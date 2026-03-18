import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { saveGoalsAndSkills } from '@/mongowork/saveGoalsAndSkills.js';
import { processWithLLM } from '@/agents/generate_goals.js';

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
      limiter: Ratelimit.slidingWindow(10, '60 s'),
    });
  }
} catch (error) {
  console.warn('Redis/Rate limiting setup failed:', error);
}

async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) throw new Error('Authorization header missing');

  const uniquePresence = authHeader.split('Bearer ')[1];
  console.log("Authenticating with uniquePresence:", uniquePresence);
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
    const result = await ratelimit.limit(ip);
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

    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      console.warn('Rate limit exceeded for IP:', 
        request.headers.get('x-forwarded-for') ?? 'unknown'
      );
      
      return NextResponse.json(
        { 
          message: 'Rate limit exceeded. Please try again later.', 
          status: 'error',
          retryAfter: rateLimitResult.reset 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.round((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          }
        }
      );
    }

    const body = await request.json();
  
    
    const responseData = {
      timestamp: new Date().toISOString(),
      processedItems: []
    };


    if (body.fileName) {
      console.log('File Name:', body.fileName);
      console.log('File Size:', body.fileSize);
      console.log('Extracted Text:', !!body.doc_text);
      
      responseData.processedItems.push('document');
      responseData.documentInfo = {
        fileName: body.fileName,
        fileSize: body.fileSize,
        extractedText: body.doc_text || ''
      };
    }

    if (body.goals) {
      responseData.processedItems.push('goals');
      responseData.goalsInfo = {
        goals: body.goals,
        length: body.goals.length
      };
    }

    const llmResults = await processWithLLM(
      body.doc_text || null,
      body.goals || null
    );
  
    const mongoResult = await saveGoalsAndSkills(llmResults.goals, llmResults.skills, uniquePresence);
    responseData.llmAnalysis = llmResults;
    
    if (rateLimitResult.remaining !== undefined) {
      responseData.rateLimit = {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      };
    }
    const message = responseData.processedItems.length > 0
      ? `Successfully processed ${responseData.processedItems.join(' and ')} with AI analysis`
      : 'No data provided for processing';

    return NextResponse.json({
      message,
      status: 'success',
      data: responseData,
    });
    
  } catch (error) {
    console.error('Error in processing API:', error);
    
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    return NextResponse.json(
      {
        message: 'Error processing request',
        status: 'error',
        error: message,
      },
      { status: 500 }
    );
  }
}
