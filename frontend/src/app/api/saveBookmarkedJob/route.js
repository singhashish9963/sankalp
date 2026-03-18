// app/api/saveBookmarkedJob/route.js
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { saveBookmarkedJob } from "@/mongowork/saveBookmarkedJobs.js";
import { createClient } from "@supabase/supabase-js";


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
      limiter: Ratelimit.slidingWindow(10, "60 s"),
    });
  }
} catch (error) {
  console.warn("Redis/Rate limiting setup failed:", error);
}


async function authenticateRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new Error("Authorization header missing");

  const uniquePresence = authHeader.split("Bearer ")[1];
  if (!uniquePresence) throw new Error("Unauthorized - No token provided");
console.log("Authenticating with uniquePresence:", uniquePresence);
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, uniquePresence")
    .eq("uniquePresence", uniquePresence)
    .single();

  if (error || !user) throw new Error("Unauthorized - User not found");
  return { user, uniquePresence };
}


async function checkRateLimit(request) {
  if (!ratelimit) return { success: true };
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  try {
    const result = await ratelimit.limit(ip);
    return result;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return { success: true };
  }
}

export async function POST(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);
    const rateResult = await checkRateLimit(request);

    if (!rateResult.success) {
      return NextResponse.json(
        { message: "Rate limit exceeded", status: "error" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { jobId, title, company, link } = body;

    if (!jobId || !title) {
      return NextResponse.json(
        { message: "Missing required fields", status: "error" },
        { status: 400 }
      );
    }

    const result = await saveBookmarkedJob({
      jobId,
      title,
      company,
      link,
      uniquePresence,
      user,
    });

    return NextResponse.json({
      status: result.success ? "success" : "error",
      message: result.message || "Bookmarked job saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("SaveBookmarkedJob API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
