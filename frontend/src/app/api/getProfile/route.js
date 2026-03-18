import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getProjectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function getProjectRefFromJwt(token) {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return decoded?.ref || null;
  } catch {
    return null;
  }
}

function isMissingUniquePresenceColumn(error) {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("uniquepresence") && msg.includes("does not exist");
}

const urlRef = getProjectRefFromUrl(supabaseUrl);
const serviceRef = getProjectRefFromJwt(serviceRoleKey);
const selectedKey =
  serviceRoleKey && serviceRef && serviceRef === urlRef
    ? serviceRoleKey
    : anonKey;

const supabase = createClient(supabaseUrl, selectedKey);


async function authenticateRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new Error("Authorization header missing");

  const token = authHeader.split("Bearer ")[1];
  if (!token) throw new Error("Unauthorized - No token provided");

  if (token.startsWith("uid:")) {
    const userId = token.slice(4).trim();
    if (!userId) throw new Error("Unauthorized - Invalid token");

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (error || !user) throw new Error("Unauthorized - User not found");
    return { user, uniquePresence: token };
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, uniquePresence")
    .eq("uniquePresence", token)
    .single();

  if (error && isMissingUniquePresenceColumn(error)) {
    const { data: byId, error: byIdError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", token)
      .single();

    if (byIdError || !byId) throw new Error("Unauthorized - User not found");
    return { user: byId, uniquePresence: `uid:${byId.id}` };
  }

  if (error || !user) throw new Error("Unauthorized - User not found");

  return { user, uniquePresence: token };
}

export async function GET(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);

    const client = await clientPromise;
    const db = client.db("AI_Interview");
    const collection = db.collection("Profiles");

   
    let profile = await collection.findOne(
      { uniquePresence },
      { projection: { _id: 0 } } 
    );

    if (!profile) {
      const now = new Date();
      const freshProfile = {
        userId: user.id,
        uniquePresence,
        name: user.name || "New User",
        email: user.email || "",
        phone: "",
        location: "",
        title: "",
        bio: "Add a short summary about yourself.",
        linkedin: "",
        github: "",
        website: "",
        joinDate: now.toLocaleString("default", { month: "long", year: "numeric" }),
        createdAt: now,
        updatedAt: now,
      };

      const insertResult = await collection.insertOne(freshProfile);
      if (!insertResult.acknowledged) {
        return NextResponse.json(
          { status: "error", message: "Failed to create profile" },
          { status: 500 }
        );
      }

      profile = freshProfile;
    }
     // Fetch bookmarked jobs
    const bookmarkedJobs = await db.collection("BookmarkedJobs")
      .find({ uniquePresence })
      .project({ _id: 0 }) 
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
