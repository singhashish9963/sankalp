import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
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

function isGeminiQuotaError(error) {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("quota") || msg.includes("too many requests") || msg.includes("429");
}

function extractRetrySeconds(error) {
  const msg = error?.message || "";
  const retryInfoMatch = msg.match(/retry in\s+([\d.]+)s/i);
  if (retryInfoMatch) return Math.ceil(Number(retryInfoMatch[1]));

  const retryDelayMatch = msg.match(/"retryDelay":"(\d+)s"/i);
  if (retryDelayMatch) return Number(retryDelayMatch[1]);

  return null;
}

async function generateWithGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "compound-beta",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 350,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content || null;
}

async function generateWithOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 350,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${err}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content || null;
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

    // Profile
    const profile = await db.collection("Profiles").findOne(
      { uniquePresence },
      { projection: { _id: 0 } }
    );

    if (!profile) {
      return NextResponse.json(
        { status: "error", message: "Profile not found" },
        { status: 404 }
      );
    }

    // Bookmarked Jobs
    const bookmarkedJobs = await db
      .collection("BookmarkedJobs")
      .find({ uniquePresence })
      .project({ _id: 0 })
      .toArray();

    // Goals and Skills
    const goalsData = await db
      .collection("Goals")
      .findOne({ uniquePresence }, { projection: { _id: 0 } });
    
    const scoresDocs = await db
      .collection("Scores")
      .find({ uniquePresence })
      .project({ _id: 0, topic: 1, score: 1, total: 1, percentage: 1 })
      .toArray();

    const scores = {};
    for (const doc of scoresDocs) {
      scores[doc.topic] = {
        score: doc.score,
        total: doc.total,
        percentage: doc.percentage,
      };
    }

    const fullProfile = {
      ...profile,
      bookmarkedJobs: bookmarkedJobs || [],
      goals: goalsData?.goals || [],
      skills: goalsData?.skills || [],
      scores: scores || {},
    };
    console.log("Fetched full profile:", fullProfile);

    return NextResponse.json({ status: "success", data: fullProfile });
  } catch (error) {
    console.error("GetProfile API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const { message, chatHistory } = await request.json();
    const { user, uniquePresence } = await authenticateRequest(request);

    const client = await clientPromise;
    const db = client.db("AI_Interview");

    // Fetch all user context
    // --- Scores ---
    const scoresDocs = await db
      .collection("Scores")
      .find({ uniquePresence })
      .project({ _id: 0, topic: 1, score: 1, total: 1, percentage: 1 })
      .toArray();

    const scores = {};
    for (const doc of scoresDocs) {
      scores[doc.topic] = {
        score: doc.score,
        total: doc.total,
        percentage: doc.percentage,
      };
    }

    // --- Profile ---
    const profile = await db.collection("Profiles").findOne({ uniquePresence });

    // --- Goals & Skills ---
    const goalsData = await db.collection("Goals").findOne({ uniquePresence });
    const goals = goalsData?.goals || [];
    const skills = goalsData?.skills || [];

    // --- Bookmarked Jobs ---
    const bookmarkedJobs = await db
      .collection("BookmarkedJobs")
      .find({ uniquePresence })
      .project({ _id: 0 })
      .toArray();

    // --- Debug log: Full context ---
    console.log("✅ User context fetched for Gemini:", {
      profile,
      goals,
      skills,
      scores,
      bookmarkedJobs,
      chatHistoryLength: chatHistory?.length || 0,
    });

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Format chat history for context
    const formattedHistory = chatHistory && chatHistory.length > 1
      ? chatHistory
          .slice(0, -1) // Exclude the current message (it's already in 'message')
          .map((msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`)
          .join("\n")
      : "No previous conversation.";

    // Construct contextual prompt with conversation history
    const prompt = `
You are the AI Career Copilot chatbot. You provide personalized career guidance based on the user's profile and conversation history.

User Profile:
- Name: ${user.name || "User"}
- Goals: ${goals.join(", ") || "Not specified"}
- Skills: ${skills.join(", ") || "Not specified"}
- Test Scores: ${Object.keys(scores).length > 0 ? JSON.stringify(scores, null, 2) : "No scores available"}
- Bookmarked Jobs: ${bookmarkedJobs.length > 0 ? bookmarkedJobs.map((j) => j.title).join(", ") : "None"}

Conversation History:
${formattedHistory}

Current User Message: "${message}"

Instructions:
- Respond naturally and conversationally, referencing previous messages when relevant
- Use the user's profile data to provide personalized guidance
- If the user refers to something from earlier in the conversation, acknowledge it
- Be supportive, encouraging, and professional
- Keep responses concise but helpful (2-4 sentences unless more detail is needed)

Your response:
`;

    console.log("🧠 Final Gemini Prompt:\n", prompt);

    // Generate content using Gemini
    let reply = "⚠️ Sorry, I couldn't generate a response.";
    try {
      const result = await model.generateContent(prompt);
      reply = result.response.text() || reply;
    } catch (geminiError) {
      if (isGeminiQuotaError(geminiError)) {
        const retrySeconds = extractRetrySeconds(geminiError);
        const retryHint = retrySeconds
          ? ` Please retry in about ${retrySeconds} seconds.`
          : " Please retry in a short while.";

        // Fallback 1: Groq
        try {
          const groqReply = await generateWithGroq(prompt);
          if (groqReply) {
            reply = groqReply;
          } else {
            throw new Error("Groq returned empty response");
          }
        } catch (groqError) {
          console.warn("Groq fallback failed:", groqError?.message || groqError);

          // Fallback 2: OpenRouter
          try {
            const openRouterReply = await generateWithOpenRouter(prompt);
            if (openRouterReply) {
              reply = openRouterReply;
            } else {
              reply =
                "I hit a temporary AI quota limit while generating your response." +
                retryHint +
                " In the meantime, I can still help with concise guidance if you ask a specific career question.";
            }
          } catch (openRouterError) {
            console.warn("OpenRouter fallback failed:", openRouterError?.message || openRouterError);
            reply =
              "I hit a temporary AI quota limit while generating your response." +
              retryHint +
              " In the meantime, I can still help with concise guidance if you ask a specific career question.";
          }
        }

        console.warn("Gemini quota/rate-limit reached:", geminiError?.message || geminiError);
      } else {
        throw geminiError;
      }
    }

    console.log("✅ Gemini response:", reply);

    // Return AI response
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chatbot route error:", error);
    const status =
      (error?.message || "").includes("Unauthorized") ||
      (error?.message || "").includes("Authorization header")
        ? 401
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}