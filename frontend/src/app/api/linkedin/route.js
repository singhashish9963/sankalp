import { NextResponse } from "next/server";
import { load } from "cheerio";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "AI Engineer";
  const location = searchParams.get("location") || "United States";
  const listUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}&start=0`;

  const upstream = await fetch(listUrl, { headers: { "user-agent": "Mozilla/5.0", accept: "text/html,application/xhtml+xml" } });
  const html = await upstream.text();
  if (!upstream.ok) return NextResponse.json({ error: `Upstream ${upstream.status}`, hint: html.slice(0, 160) }, { status: 502 });

  const $ = load(html);
  const jobs = [];
  $("li").each((_, el) => {
    const li = $(el);
    const titleEl = li.find('a[href*="/jobs/view/"]').first();
    const jobTitle = titleEl.text().trim();
    const jobUrl = titleEl.attr("href")?.split("?")[0] || null;
    const company =
      li.find(".base-search-card__subtitle").first().text().trim() ||
      li.find('a[href*="/company/"]').first().text().trim() ||
      null;
    const locationText = li.find(".job-search-card__location").first().text().trim() || null;
    if (jobTitle) jobs.push({ title: jobTitle, company, location: locationText, url: jobUrl });
  });

  return NextResponse.json({ jobs });
}