import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { processATSAnalysis } from '@/agents/generate_ats.js';

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let redis, ratelimit;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'), 
    });
  }
} catch (error) {
  console.warn('Redis/Rate limiting setup failed:', error);
}

async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) throw new Error('Authorization header missing');

  const uniquePresence = authHeader.split('Bearer ')[1];
  if (!uniquePresence) throw new Error('Unauthorized - No token provided');

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, uniquePresence')
    .eq('uniquePresence', uniquePresence)
    .single();

  if (userError || !user) throw new Error('Unauthorized - User not found');
  return { user, uniquePresence };
}

async function checkRateLimit(request) {
  if (!ratelimit) {
    console.warn('Rate limiting not configured - skipping');
    return { success: true };
  }
  
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'anonymous';
    
  try {
    const result = await ratelimit.limit(`ats:${ip}`);
    return result;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { success: true };
  }
}

function generateFallbackATSAnalysis(resumeText, jobDescription) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  
  const commonSkills = ['python', 'javascript', 'react', 'node', 'java', 'sql', 'aws', 'docker', 'git'];
  const matchedSkills = commonSkills.filter(skill => 
    resumeLower.includes(skill) && jdLower.includes(skill)
  );

  const baseScore = 60;
  const bonus = Math.min(matchedSkills.length * 2, 15); 
  const finalScore = baseScore + bonus;

  return {
    matchScore: finalScore,
    summary: "Your resume shows potential for this role. Consider highlighting more relevant skills and experiences that directly align with the job requirements to improve your match score.",
    strengths: [
      "Resume structure is clear and readable",
      "Contains relevant professional experience",
      "Demonstrates technical or professional skills"
    ],
    improvements: [
      "Add more keywords from the job description",
      "Quantify achievements with specific metrics",
      "Tailor experience descriptions to match role requirements",
      "Include relevant certifications or projects"
    ],
    keywords: {
      matched: matchedSkills.length > 0 ? matchedSkills : ["general technical skills"],
      missing: ["specific role requirements", "industry-specific terminology"]
    },
    fallback: true
  };
}

export async function POST(request) {
  try {
    let uniquePresence;
    try {
      const authResult = await authenticateRequest(request);
      uniquePresence = authResult.uniquePresence;
    } catch (authError) {
      console.warn('Authentication failed:', authError.message);
      return NextResponse.json(
        { 
          message: 'Authentication required', 
          status: 'error',
          error: authError.message 
        },
        { status: 401 }
      );
    }

    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      console.warn('ATS rate limit exceeded for IP:', 
        request.headers.get('x-forwarded-for') ?? 'unknown'
      );
      
      return NextResponse.json(
        { 
          message: 'Rate limit exceeded for ATS checks. Please try again later.', 
          status: 'error',
          retryAfter: rateLimitResult.reset 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.round((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          }
        }
      );
    }

    const body = await request.json();
    
    if (!body.doc_text || !body.jobDescription) {
      return NextResponse.json(
        {
          message: 'Both resume text and job description are required',
          status: 'error',
        },
        { status: 400 }
      );
    }

    let atsResults;
    let usedFallback = false;

    try {
      atsResults = await processATSAnalysis(
        body.doc_text,
        body.jobDescription
      );
      
      if (!atsResults || typeof atsResults.matchScore !== 'number' || atsResults.matchScore === 0) {
        throw new Error('Invalid ATS results from LLM');
      }
      
    } catch (atsError) {
      console.error('LLM ATS analysis failed, using fallback:', atsError);
      usedFallback = true;
      
      atsResults = generateFallbackATSAnalysis(
        body.doc_text,
        body.jobDescription
      );
    }
    
    if (typeof atsResults.matchScore !== 'number' || isNaN(atsResults.matchScore)) {
      console.warn('Invalid matchScore, using fallback');
      atsResults = generateFallbackATSAnalysis(body.doc_text, body.jobDescription);
      usedFallback = true;
    }

    const responseData = {
      timestamp: new Date().toISOString(),
      fileName: body.fileName,
      atsAnalysis: atsResults,
      usedFallback: usedFallback,
    };

    if (rateLimitResult.remaining !== undefined) {
      responseData.rateLimit = {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      };
    }

    return NextResponse.json({
      message: usedFallback 
        ? 'ATS analysis completed with basic scoring (AI analysis unavailable)' 
        : 'ATS analysis completed successfully',
      status: 'success',
      data: responseData,
    });
    
  } catch (error) {
    console.error('Error in ATS check API:', error);
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    return NextResponse.json(
      {
        message: 'Error processing ATS check',
        status: 'error',
        error: message,
      },
      { status: 500 }
    );
  }
}
