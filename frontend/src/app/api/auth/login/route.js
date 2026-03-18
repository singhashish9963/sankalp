import { NextResponse } from "next/server";
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

const urlRef = getProjectRefFromUrl(supabaseUrl);
const serviceRef = getProjectRefFromJwt(serviceRoleKey);
const anonRef = getProjectRefFromJwt(anonKey);

const selectedKey =
  serviceRoleKey && serviceRef && serviceRef === urlRef
    ? serviceRoleKey
    : anonKey;

if (serviceRoleKey && serviceRef && urlRef && serviceRef !== urlRef) {
  console.warn("Auth login route: SUPABASE_SERVICE_ROLE_KEY does not match NEXT_PUBLIC_SUPABASE_URL project, using anon key fallback.");
}

if (anonKey && anonRef && urlRef && anonRef !== urlRef) {
  console.warn("Auth login route: NEXT_PUBLIC_SUPABASE_ANON_KEY does not match NEXT_PUBLIC_SUPABASE_URL project.");
}

const supabase = createClient(supabaseUrl, selectedKey);

function isMissingUniquePresenceColumn(error) {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("uniquepresence") && msg.includes("does not exist");
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    const userId = data?.user?.id;
    let uniquePresence = null;

    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("uniquePresence")
        .eq("id", userId)
        .single();

      if (userError && !isMissingUniquePresenceColumn(userError)) {
        return NextResponse.json(
          { message: `Login failed: ${userError.message}` },
          { status: 400 }
        );
      }

      uniquePresence = userData?.uniquePresence || `uid:${userId}`;
    }

    return NextResponse.json({
      message: "Login successful",
      user: data?.user || null,
      session: data?.session || null,
      uniquePresence,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Login failed" },
      { status: 500 }
    );
  }
}
