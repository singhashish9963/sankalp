"use client";
import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export default function QuizPage() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanations, setShowExplanations] = useState({});
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [prevScores, setPrevScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);

  const uniquePresence = (() => {
    if (typeof window === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("uniquePresence="));
    return match ? match.split("=")[1] : null;
  })();

  const fetchScores = async () => {
    setLoadingScores(true);
    try {
      const res = await fetch("/api/getScores", {
        headers: { Authorization: `Bearer ${uniquePresence}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setPrevScores(data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingScores(false);
    }
  };

  const openScoresModal = () => {
    setShowScoresModal(true);
    fetchScores();
  };

  const generateQuiz = async () => {
    if (!topic.trim()) return alert("Please enter a topic!");
    setLoading(true);
    setQuiz([]);
    setScore(null);
    setAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setShowExplanations({});
    setShowScoreAnimation(false);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Generate a 2-question multiple-choice quiz on the topic "${topic}". Format as valid JSON only: { "questions": [ { "question": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct option text", "explanation": "Short explanation" } ] }`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
      const data = JSON.parse(jsonText);
      setQuiz(data.questions);
    } catch (err) {
      console.error("Gemini error:", err);
      alert("Failed to generate quiz. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, option) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    let sc = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) sc++;
    });
    setScore(sc);
    setSubmitted(true);
    setShowScoreAnimation(true);

    try {
      await fetch("/api/saveScore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${uniquePresence}`,
        },
        body: JSON.stringify({
          topic,
          score: sc,
          total: quiz.length,
        }),
      });
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  const resetQuiz = () => {
    setTopic("");
    setQuiz([]);
    setAnswers({});
    setScore(null);
    setCurrentQuestion(0);
    setSubmitted(false);
    setShowExplanations({});
    setShowScoreAnimation(false);
  };

  const toggleExplanation = (index) => {
    setShowExplanations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <button
        onClick={openScoresModal}
        className="fixed top-8 right-8 bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-white px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-all"
      >
        Previous Scores
      </button>

      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl font-bold mb-3 tracking-tight">AI Quiz Generator</h1>
          <p className="text-gray-400 text-lg">Test your knowledge with precision</p>
        </div>

        {quiz.length === 0 && !submitted ? (
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
            <label className="block text-sm font-medium mb-4 text-gray-300 uppercase tracking-wide">
              Enter Topic
            </label>
            <input
              type="text"
              placeholder="e.g., Space Exploration, Machine Learning..."
              className="w-full bg-black border border-gray-800 rounded-lg px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-white transition mb-4"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateQuiz()}
            />
            <button
              onClick={generateQuiz}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 py-4 rounded-lg transition font-semibold"
            >
              {loading ? "Generating..." : "Generate Quiz"}
            </button>
          </div>
        ) : null}

        {quiz.length > 0 && !submitted ? (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Progress</span>
                <span className="text-sm font-medium text-white">
                  {currentQuestion + 1} / {quiz.length}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-white h-1 transition-all duration-500"
                  style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                Question {currentQuestion + 1}
              </div>
              <h3 className="text-2xl font-semibold mb-8">
                {quiz[currentQuestion].question}
              </h3>
              <div className="space-y-3">
                {quiz[currentQuestion].options.map((opt, i) => {
                  const isSelected = answers[currentQuestion] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentQuestion, opt)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-white text-black border-white"
                          : "bg-black border-gray-800 hover:border-gray-700 text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-950 disabled:text-gray-700 border border-gray-800 px-6 py-3 rounded-lg font-medium transition disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              {currentQuestion === quiz.length - 1 ? (
                <button
                  onClick={submitQuiz}
                  className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-lg font-semibold transition"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg font-medium transition"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        ) : null}

        {submitted && quiz.length > 0 ? (
          <div className="space-y-6">
            <div className={`bg-gray-900 rounded-lg p-12 border border-gray-800 text-center transition-all duration-1000 ${
              showScoreAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
              <div className="text-sm text-gray-500 uppercase tracking-wider mb-4">Final Score</div>
              <div className={`text-7xl font-bold mb-6 transition-all duration-1000 delay-300 ${
                showScoreAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                {score}/{quiz.length}
              </div>
              <div className={`text-xl text-gray-400 transition-all duration-1000 delay-500 ${
                showScoreAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                {score === quiz.length ? "Perfect Score" : score >= quiz.length / 2 ? "Well Done" : "Keep Learning"}
              </div>
            </div>

            <div className="space-y-4">
              {quiz.map((q, i) => {
                const isCorrect = answers[i] === q.answer;
                return (
                  <div
                    key={i}
                    className={`bg-gray-900 rounded-lg p-6 border-2 transition-all ${
                      isCorrect ? 'border-green-500' : 'border-red-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-semibold flex-1">
                        <span className="text-gray-500 text-sm">Q{i + 1}.</span> {q.question}
                      </h4>
                      <span className={`text-2xl ml-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, idx) => {
                        const isAnswerCorrect = opt === q.answer;
                        const isSelected = answers[i] === opt;
                        const isWrong = isSelected && !isAnswerCorrect;
                        return (
                          <div
                            key={idx}
                            className={`border-2 p-4 rounded-lg transition-all ${
                              isAnswerCorrect
                                ? "bg-green-900 bg-opacity-20 border-green-500"
                                : isWrong
                                ? "bg-red-900 bg-opacity-20 border-red-500"
                                : "bg-black border-gray-800"
                            }`}
                          >
                            <span className="text-base flex items-center gap-2">
                              {isAnswerCorrect ? <span className="text-green-500">✓</span> : null}
                              {isWrong ? <span className="text-red-500">✗</span> : null}
                              <span className={isAnswerCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-gray-500'}>
                                {opt}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => toggleExplanation(i)}
                      className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2"
                    >
                      {showExplanations[i] ? '− Hide' : '+ Show'} Explanation
                    </button>
                    {showExplanations[i] ? (
                      <div className="mt-4 bg-black border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
                        {q.explanation}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetQuiz}
              className="w-full bg-white text-black hover:bg-gray-200 px-6 py-4 rounded-lg font-semibold text-lg transition"
            >
              Start New Quiz
            </button>
          </div>
        ) : null}
      </div>

      {showScoresModal ? (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md border border-gray-800 relative">
            <button
              onClick={() => setShowScoresModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-light leading-none transition"
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold mb-6">Previous Scores</h2>
            {loadingScores ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mt-3">Loading...</p>
              </div>
            ) : prevScores.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No scores yet. Complete a quiz to see your history.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {prevScores.map((item, i) => (
                  <li
                    key={i}
                    className="border border-gray-800 p-4 rounded-lg bg-black hover:border-gray-700 transition"
                  >
                    <div className="font-medium text-white mb-2">{item.topic}</div>
                    <div className="text-gray-400 text-sm mb-1">
                      Score: <span className="font-semibold text-white">{item.score}/{item.total}</span> ({item.percentage}%)
                    </div>
                    <div className="text-gray-600 text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}