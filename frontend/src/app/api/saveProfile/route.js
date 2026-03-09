import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveProfile } from "@/mongowork/saveProfile.js";

// --- Supabase setup ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Authenticate using uniquePresence ---
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

// --- POST: Save user profile ---
export async function POST(request) {
  try {
    const { user, uniquePresence } = await authenticateRequest(request);
    const body = await request.json();
    console.log("SaveProfile body:", body);
    const {
      name,
      email,
      phone,
      location,
      title,
      bio,
      linkedin,
      github,
      website,
      joinDate,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields: name, email" },
        { status: 400 }
      );
    }

    const result = await saveProfile({
      user,
      uniquePresence,
      name,
      email,
      phone,
      location,
      title,
      bio,
      linkedin,
      github,
      website,
      joinDate,
    });

    return NextResponse.json({
      status: "success",
      message: "Profile saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("SaveProfile API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
