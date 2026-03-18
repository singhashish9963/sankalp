import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || 'software engineer';
    const location = searchParams.get('location') || 'Bangalore';
    const max = parseInt(searchParams.get('max') || '5', 10);

    const token = process.env.APIFY_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'APIFY_TOKEN not configured' }, { status: 500 });
    }
    const client = new ApifyClient({ token });

    const { defaultDatasetId } = await client
      .actor('muhammetakkurtt/naukri-job-scraper')
      .call({
        query,
        location,
        max_results: Number.isFinite(max) ? max : 5,
      });

    const { items } = await client.dataset(defaultDatasetId).listItems();

    const jobs = (items || []).map((j) => ({
      title: j['Job Title'] || j.title || j.jobTitle || null,
      company: j['Company'] || j.company || j.companyName || null,
      location: j['Location'] || j.location || null,
      url: j['Job URL'] || j.url || j.link || null,
      salary: j['Salary'] || j.salary || null,
      experience: j['Experience Required'] || j.experience || null,
      source: 'naukri',
    }));
    console.log(`job urls: ${jobs.map((j) => j.url).join(', ')}`);

    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
