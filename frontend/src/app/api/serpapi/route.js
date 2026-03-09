// /app/api/serpapi/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const location = searchParams.get("location");
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing SERPAPI_KEY in env" }, { status: 500 });
  }

  const query = `${title || ""} ${location || ""}`.trim();

  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(
        query
      )}&api_key=${apiKey}`
    );
    const data = await res.json();

    const jobs = (data.jobs_results || []).map((j) => ({
      id: j.job_id,
      title: j.title,
      company: j.company_name,
      location: j.location,
      url: j.apply_options?.[0]?.link || "",
      description: j.description,
    }));

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("SerpApi error:", err);
    return NextResponse.json({ error: "Failed to fetch from SerpApi" }, { status: 500 });
  }
}
