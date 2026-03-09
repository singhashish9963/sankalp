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
      limiter: Ratelimit.slidingWindow(5, '60 s'), // More restrictive for ATS
    });
  }
} catch (error) {
  console.warn('Redis/Rate limiting setup failed:', error);
}

async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) throw new Error('Authorization header missing');

  const uniquePresence = authHeader.split('Bearer ')[1];
  console.log("Authenticating ATS check with uniquePresence:", uniquePresence);
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

    // Rate Limiting Check
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

    // Process request
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

    console.log('ATS Check - File Name:', body.fileName);
    console.log('ATS Check - Resume Length:', body.doc_text.length);
    console.log('ATS Check - JD Length:', body.jobDescription.length);

    // Process with ATS agent
    const atsResults = await processATSAnalysis(
      body.doc_text,
      body.jobDescription
    );

    const responseData = {
      timestamp: new Date().toISOString(),
      fileName: body.fileName,
      atsAnalysis: atsResults,
      // saved: mongoResult.success
    };

    if (rateLimitResult.remaining !== undefined) {
      responseData.rateLimit = {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      };
    }

    return NextResponse.json({
      message: 'ATS analysis completed successfully',
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
