import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb.js";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Authenticate User by uniquePresence ---
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

// --- GET: Fetch user profile from MongoDB ---
export async function GET(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);

    const client = await clientPromise;
    const db = client.db("AI_Interview");
    const collection = db.collection("Profiles");

    // Fetch profile document for this user
    const profile = await collection.findOne(
      { uniquePresence },
      { projection: { _id: 0 } } // remove MongoDB _id field
    );

    if (!profile) {
      return NextResponse.json(
        { status: "error", message: "Profile not found" },
        { status: 404 }
      );
    }
     // Fetch bookmarked jobs
    const bookmarkedJobs = await db.collection("BookmarkedJobs")
      .find({ uniquePresence })
      .project({ _id: 0 }) // remove _id
      .toArray();

    // Fetch goals and skills
    const goalsData = await db.collection("Goals")
      .findOne({ uniquePresence }, { projection: { _id: 0 } });

    // Combine all data
    const fullProfile = {
      ...profile,
      bookmarkedJobs: bookmarkedJobs || [],
      goals: goalsData?.goals || [],
      skills: goalsData?.skills || [],
    };
    

    return NextResponse.json({
      status: "success",
      data: fullProfile,
    });
  } catch (error) {
    console.error("GetProfile API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
