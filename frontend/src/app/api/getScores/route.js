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
    return { user: { id: userId }, uniquePresence: token };
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, uniquePresence")
    .eq("uniquePresence", token)
    .single();

  if (error && isMissingUniquePresenceColumn(error)) {
    return { user: { id: token }, uniquePresence: `uid:${token}` };
  }

  if (error || !user) throw new Error("Unauthorized - User not found");

  return { user, uniquePresence: token };
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
      .sort({ createdAt: -1 }) 
      .toArray();
      

    return NextResponse.json({
      status: "success",
      data: userScores,
    });
  } catch (error) {
    console.error("GetScores API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
