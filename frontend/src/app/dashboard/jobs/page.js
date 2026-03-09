"use client";
import React, { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

export default function JobsPage() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("both");
  const [loading, setLoading] = useState(false);
  const [liJobs, setLiJobs] = useState([]);
  const [nkJobs, setNkJobs] = useState([]);
  const [serpJobs, setSerpJobs] = useState([]); // ✅ NEW: SerpApi jobs state
  const [error, setError] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  // --- Get uniquePresence dynamically at the time of API call ---
  const getUniquePresence = () => {
    if (typeof window === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("uniquePresence="));
    return match ? match.split("=")[1] : null;
  };

  useEffect(() => {
    const saved = JSON.parse(window.savedJobsData || "[]");
    setSavedJobs(saved);
  }, []);

  const saveToPersistence = (jobs) => {
    window.savedJobsData = JSON.stringify(jobs);
  };

  const fetchJSON = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const hint = await res.text();
      throw new Error(`Error ${res.status}: ${hint.slice(0, 160)}`);
    }
    return res.json();
  };

  const onSearch = async () => {
    setError("");
    setLiJobs([]);
    setNkJobs([]);
    setSerpJobs([]); // ✅ NEW: reset SerpApi jobs
    setLoading(true);
    try {
      const title = encodeURIComponent(role.trim());
      const loc = encodeURIComponent(location.trim());

      // ✅ Define reusable fetchers for each source
      const sources = {
        linkedin: () => fetchJSON(`/api/linkedin?title=${title}&location=${loc}`),
        naukri: () => fetchJSON(`/api/naukri?query=${title}&location=${loc}`),
        serpapi: () => fetchJSON(`/api/serpapi?title=${title}&location=${loc}`), // ✅ NEW: SerpApi route
      };

      // ✅ Fetch based on user-selected source
      if (source === "linkedin") {
        const json = await sources.linkedin();
        setLiJobs(json.jobs || []);
      } else if (source === "naukri") {
        const json = await sources.naukri();
        setNkJobs(json.jobs || []);
      } else if (source === "serpapi") {
        const json = await sources.serpapi();
        setSerpJobs(json.jobs || []);
      } else {
        // ✅ If "both" is selected, fetch all three sources in parallel
        const [li, nk, sp] = await Promise.all([
          sources.linkedin(),
          sources.naukri(),
          sources.serpapi(),
        ]);
        setLiJobs(li.jobs || []);
        setNkJobs(nk.jobs || []);
        setSerpJobs(sp.jobs || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveJob = async (job, jobSource) => {
    const uniquePresence = getUniquePresence();
    if (!uniquePresence) return alert("You must be logged in!");

    const jobWithSource = { ...job, source: jobSource, savedAt: new Date().toISOString() };
    const jobKey = `${jobSource}-${job.title}-${job.company}`;

    const isAlreadySaved = savedJobs.some(
      (saved) => `${saved.source}-${saved.title}-${saved.company}` === jobKey
    );

    let updatedSaved;
    if (isAlreadySaved) {
      updatedSaved = savedJobs.filter(
        (saved) => `${saved.source}-${saved.title}-${saved.company}` !== jobKey
      );
    } else {
      updatedSaved = [...savedJobs, jobWithSource];

      // --- POST to /api/saveBookmarkedJob ---
      try {
        await fetch("/api/saveBookmarkedJob", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${uniquePresence}`,
          },
          body: JSON.stringify({
            jobId: job.id || jobKey,
            title: job.title,
            company: job.company || "",
            link: job.url || "",
          }),
        });
      } catch (err) {
        console.error("Error saving job:", err);
      }
    }

    setSavedJobs(updatedSaved);
    saveToPersistence(updatedSaved);
  };

  const isJobSaved = (job, jobSource) => {
    const jobKey = `${jobSource}-${job.title}-${job.company}`;
    return savedJobs.some(
      (saved) => `${saved.source}-${saved.title}-${saved.company}` === jobKey
    );
  };

  const removeSavedJob = (index) => {
    const updatedSaved = savedJobs.filter((_, i) => i !== index);
    setSavedJobs(updatedSaved);
    saveToPersistence(updatedSaved);
  };

  const JobCard = ({ job, jobSource, index }) => {
    const isSaved = isJobSaved(job, jobSource);

    return (
      <li className="border rounded-xl p-4 hover:shadow-sm transition">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="text-lg font-semibold">
              {job.title}{" "}
              {job.company && <span className="text-gray-500">· {job.company}</span>}
            </div>
            {job.location && <div className="text-sm text-gray-600">{job.location}</div>}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-indigo-600 hover:underline text-sm"
              >
                View job
              </a>
            )}
          </div>
          <button
            onClick={() => toggleSaveJob(job, jobSource)}
            className={`p-2 rounded-lg transition ${
              isSaved
                ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={isSaved ? "Remove from goals" : "Save to goals"}
          >
            {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        </div>
      </li>
    );
  };

  return (
    <section className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Find Jobs</h1>
        <button
          onClick={() => setShowSaved(!showSaved)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Bookmark size={18} />
          My Goals ({savedJobs.length})
        </button>
      </div>

      {showSaved ? (
        // --- Saved jobs section ---
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Saved Jobs</h2>
            <button
              onClick={() => setShowSaved(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Back to Search
            </button>
          </div>
          {savedJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bookmark size={48} className="mx-auto mb-3 opacity-50" />
              <p>No saved jobs yet. Start searching and save jobs to your goals!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {savedJobs.map((job, i) => (
                <li key={i} className="border rounded-xl p-4 hover:shadow-sm transition">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {job.source}
                        </span>
                      </div>
                      <div className="text-lg font-semibold">
                        {job.title}{" "}
                        {job.company && (
                          <span className="text-gray-500">· {job.company}</span>
                        )}
                      </div>
                      {job.location && (
                        <div className="text-sm text-gray-600">{job.location}</div>
                      )}
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-indigo-600 hover:underline text-sm"
                        >
                          View job
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => removeSavedJob(i)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                      title="Remove from goals"
                    >
                      <BookmarkCheck size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {/* Search Form */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Job role (e.g., Software Engineer)"
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g., India)"
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <button
              onClick={onSearch}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* ✅ Source Filter: added "serpapi" */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Source:</span>
            {["both", "linkedin", "naukri", "serpapi"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  source === s
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {error}
            </div>
          )}

          {/* ✅ Jobs List: Added SerpApi section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">LinkedIn</h2>
              <ul className="space-y-3">
                {liJobs.map((j, i) => (
                  <JobCard key={`li-${i}`} job={j} jobSource="linkedin" index={i} />
                ))}
                {!loading && !error && liJobs.length === 0 && (
                  <li className="text-gray-500">No LinkedIn results.</li>
                )}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3">Naukri</h2>
              <ul className="space-y-3">
                {nkJobs.map((j, i) => (
                  <JobCard key={`nk-${i}`} job={j} jobSource="naukri" index={i} />
                ))}
                {!loading && !error && nkJobs.length === 0 && (
                  <li className="text-gray-500">No Naukri results.</li>
                )}
              </ul>
            </div>
            {/* ✅ NEW: SerpApi results column */}
            <div>
              <h2 className="text-xl font-semibold mb-3">SerpApi (Google Jobs)</h2>
              <ul className="space-y-3">
                {serpJobs.map((j, i) => (
                  <JobCard key={`sp-${i}`} job={j} jobSource="serpapi" index={i} />
                ))}
                {!loading && !error && serpJobs.length === 0 && (
                  <li className="text-gray-500">No SerpApi results.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
