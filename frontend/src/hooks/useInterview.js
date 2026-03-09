"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export function useInterview() {
  const [question, setQuestion] = useState("");
  const [text, setText] = useState("");

  async function start() {
    const res = await apiClient("/interview/start", { method: "POST" });
    setQuestion(res.question || "");
  }

  async function submit() {
    const res = await apiClient("/interview/feedback", {
      method: "POST",
      body: { text }
    });
    alert(`WPM: ${res.wpm}\nTips: ${(res.tips||[]).join(", ")}`);
  }

  return { question, text, setText, start, submit };
}
