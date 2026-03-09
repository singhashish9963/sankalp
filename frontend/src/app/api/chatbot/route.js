import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


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
    const result = await model.generateContent(prompt);
    const reply = result.response.text() || "⚠️ Sorry, I couldn't generate a response.";

    console.log("✅ Gemini response:", reply);

    // Return AI response
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chatbot route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}