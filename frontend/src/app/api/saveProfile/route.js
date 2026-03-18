import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveProfile } from "@/mongowork/saveProfile.js";

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

  // Fallback token format when users.uniquePresence column does not exist.
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

    if (!result?.success) {
      return NextResponse.json(
        { status: "error", message: result?.error || "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        message: "Profile saved successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SaveProfile API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
