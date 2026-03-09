"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, Upload, Target, FileText, CheckCircle } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Float } from "@react-three/drei";
import mammoth from 'mammoth';
import DashboardNav from "@/components/layout/Dashboardnav";
import ChatbotButton from "@/components/dashboard/Chatbot";
import Analytics from "@/components/dashboard/Analytics";

// Document processing functions
const extractPdfText = async (file) => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

const extractDocxText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractTextFromDocument = async (file) => {
  switch (file.type) {
    case 'application/pdf':
      return await extractPdfText(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return await extractDocxText(file);
    default:
      throw new Error(`Unsupported file type: ${file.type}`);
  }
};

// 3D Background Components
function AnimatedSphere({ position, color, speed }) {
  const meshRef = useRef(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 32, 32]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </Sphere>
    </Float>
  );
}

function Stars() {
  const count = 200;
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} />
    </points>
  );
}

function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#a855f7" />
        
        <AnimatedSphere position={[-2, 1, 0]} color="#8b5cf6" speed={0.2} />
        <AnimatedSphere position={[2, -1, -1]} color="#ec4899" speed={0.15} />
        <AnimatedSphere position={[0, 0, -2]} color="#3b82f6" speed={0.25} />
        
        <Stars />
      </Canvas>
    </div>
  );
}

export default function DashboardPage() {
  // State management
  const [file, setFile] = useState(null);
  const [goals, setGoals] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [skills, setSkills] = useState([]);
useEffect(() => {
  const fetchSkills = async () => {
    try {
      const uniquePresence = document.cookie
        .split('; ')
        .find(row => row.startsWith('uniquePresence='))
        ?.split('=')[1];

      if (!uniquePresence) return;

      const res = await fetch('/api/getProfile', {
        headers: { 'Authorization': `Bearer ${uniquePresence}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userSkills = Array.isArray(data.data.skills) ? data.data.skills : [];
        setSkills(userSkills);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  fetchSkills();
}, []);


  const features = [
    {
      title: "Jobs",
      description: "Browse AI-matched opportunities tailored to skills",
      link: "/dashboard/jobs",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-gradient-to-br from-purple-900/30 to-pink-900/30",
      borderColor: "border-purple-500/20",
      hoverBorder: "hover:border-purple-500/50",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Roadmap",
      description: "Personalized career paths and skill plans",
      link: "/dashboard/roadmap",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-900/30 to-cyan-900/30",
      borderColor: "border-blue-500/20",
      hoverBorder: "hover:border-blue-500/50",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      title: "Mock Interview",
      description: "Practice with an AI interviewer and get feedback",
      link: "/dashboard/interview",
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-gradient-to-br from-pink-900/30 to-rose-900/30",
      borderColor: "border-pink-500/20",
      hoverBorder: "hover:border-pink-500/50",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Quiz",
      description: "Test knowledge with AI-generated quizzes",
      link: "/dashboard/quiz",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-900/30 to-teal-900/30",
      borderColor: "border-emerald-500/20",
      hoverBorder: "hover:border-emerald-500/50",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "Generate Resume",
      description: "Create tailored resumes with AI assistance",
      link: "/dashboard/resume",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-gradient-to-br from-emerald-900/30 to-teal-900/30",
      borderColor: "border-emerald-500/20",
      hoverBorder: "hover:border-emerald-500/50",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        alert('Please upload a PDF or Word document');
        e.target.value = '';
      }
    }
  };

  const handleProcess = async () => {
    if (!file && !goals.trim()) {
      alert('Please provide either a document or goals');
      return;
    }

    setIsProcessing(true);

    try {
      const uniquePresence = document.cookie
        .split('; ')
        .find(row => row.startsWith('uniquePresence='))
        ?.split('=')[1];

      let extractedText = null;

      if (file) {
        try {
          extractedText = await extractTextFromDocument(file);
        } catch (error) {
          console.error('Error extracting text:', error);
          alert('Error processing the document. Please try again.');
          setIsProcessing(false);
          return;
        }
      }

      const apiCalls = [];
      const processingBody = {};
      
      if (extractedText) {
        processingBody.fileName = file.name;
        processingBody.fileSize = file.size;
        processingBody.doc_text = extractedText;
      }
      if (goals.trim()) {
        processingBody.goals = goals;
      }
      console.log('Processing Body:', processingBody);
      apiCalls.push(
        fetch('/api/user/processing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${uniquePresence}`
          },
          body: JSON.stringify(processingBody),
        })
      );

      if (extractedText && jobDescription.trim()) {
        const atsBody = {
          doc_text: extractedText,
          jobDescription: jobDescription.trim(),
          fileName: file.name
        };

        apiCalls.push(
          fetch('/api/user/ats-check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${uniquePresence}`
            },
            body: JSON.stringify(atsBody),
          })
        );
      }

      const results = await Promise.allSettled(apiCalls);
      console.log('API Call Results:', results);

      const processingResult = results[0];
      if (processingResult.status === 'fulfilled') {
        const data = await processingResult.value.json();
        if (!processingResult.value.ok) {
          if (processingResult.value.status === 401) {
            alert('Authentication failed: ' + (data.error || 'Unauthorized'));
          } else if (processingResult.value.status === 429) {
            alert(`Rate limit exceeded. Try again after ${data.retryAfter || 'a while'} seconds.`);
          } else {
            alert(`Processing Error: ${data.error || 'Something went wrong'}`);
          }
        } else {
          console.log('Processing API Response:', data);
        }
      } else {
        console.error('Processing API failed:', processingResult.reason);
        alert('Processing API failed. Please try again.');
      }

      if (results.length > 1) {
        const atsResult = results[1];
        if (atsResult.status === 'fulfilled') {
          const atsData = await atsResult.value.json();
          if (!atsResult.value.ok) {
            console.error('ATS Check Error:', atsData);
            alert(`ATS Check Error: ${atsData.error || 'Something went wrong'}`);
          } else {
            console.log('ATS Check Response:', atsData);
            alert(`Success! ATS Score: ${atsData.data.atsAnalysis.matchScore}%`);
          }
        } else {
          console.error('ATS Check failed:', atsResult.reason);
          alert('ATS Check failed. Results saved without ATS score.');
        }
      }

      if (results[0].status === 'fulfilled') {
        alert('Processing completed successfully!');
        setFile(null);
        setGoals('');
        setJobDescription('');
        setShowUploadSection(false);
      }

    } catch (error) {
      console.error('Error calling API:', error);
      alert('Error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("user_id");
      localStorage.removeItem("role");
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <Background3D />

        <ChatbotButton /> 
      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        <DashboardNav />
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>

          <p className="text-xl text-gray-400">
            Welcome back! Choose a tool to continue your AI career journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-500/20 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-400">Applications</p>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">24</p>
            <p className="text-sm text-gray-500 mt-1">+3 this week</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border-2 border-blue-500/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-400">Interviews</p>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">8</p>
            <p className="text-sm text-gray-500 mt-1">2 scheduled</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border-2 border-pink-500/20 shadow-lg hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-400">Skills</p>
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{skills.length}</p>
            <p className="text-sm text-gray-500 mt-1">3 in progress</p>
          </div>
        </div>

        <Analytics />

        {/* Document Upload Section */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-500/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Document Processing</h2>
                <p className="text-gray-400">Upload resume, set goals, and check ATS compatibility</p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-semibold"
            >
              {showUploadSection ? 'Hide' : 'Show'}
            </button>
          </div>

          {showUploadSection && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-600 file:text-white
                    hover:file:bg-purple-700
                    border-2 border-gray-700 rounded-lg
                    bg-gray-800/50
                    focus:outline-none focus:border-purple-500 transition-colors"
                />
                {file && (
                  <div className="mt-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-purple-400">Selected:</span> {file.name}
                      <span className="text-gray-500 ml-2">({(file.size / 1024).toFixed(2)} KB)</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Your Goals
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Enter your career goals and objectives..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg
                    bg-gray-800/50 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Job Description (Optional - for ATS Check)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description to check ATS compatibility..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg
                    bg-gray-800/50 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
                {file && jobDescription.trim() && (
                  <p className="mt-3 text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    ATS analysis will be performed in parallel
                  </p>
                )}
              </div>

              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg
                  hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
                  transition-all shadow-lg hover:shadow-purple-500/50 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:shadow-none
                  transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Process Document'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <a
              key={index}
              href={feature.link}
              className={`group relative overflow-hidden rounded-3xl border-2 ${feature.borderColor} ${feature.hoverBorder} ${feature.bgColor} backdrop-blur-md p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
              <div className="relative z-10 space-y-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="flex items-center text-purple-400 font-semibold group-hover:gap-3 gap-2 transition-all">
                  <span>Get started</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Actions CTA */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-purple-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold">Ready to level up?</h3>
              <p className="text-white/90 text-lg">Complete your profile to unlock personalized recommendations</p>
            </div>
            <button className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 whitespace-nowrap">
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}