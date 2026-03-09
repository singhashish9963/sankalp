// app/api/getScores/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb.js";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function authenticateRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new Error("Authorization header missing");
  const uniquePresence = authHeader.split("Bearer ")[1];
  if (!uniquePresence) throw new Error("Unauthorized - No token provided");

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, uniquePresence")
    .eq("uniquePresence", uniquePresence)
    .single();

  if (error || !user) throw new Error("Unauthorized - User not found");

  return { user, uniquePresence };
}

export async function GET(request) {
  try {
    const { uniquePresence } = await authenticateRequest(request);

    const client = await clientPromise;
    const db = client.db("AI_Interview");
    const collection = db.collection("Scores");
    

    const userScores = await collection
      .find(
        { uniquePresence },
        { projection: { score: 1, total: 1, createdAt: 1, _id: 0,percentage:1,topic:1, tags:1 } }
      )
      .sort({ createdAt: -1 }) // newest first
      .toArray();
      

    return NextResponse.json({
      status: "success",
      data: userScores, // array of all attempts
    });
  } catch (error) {
    console.error("GetScores API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
