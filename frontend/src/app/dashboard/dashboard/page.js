import Header from "@/components/dashboard/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import FeatureCard from "@/components/dashboard/FeatureCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import FrequencyChart from "@/components/dashboard/FrequencyChart";
import TopicDistribution from "@/components/dashboard/TopicDistribution";
import DocumentProcessing from "@/components/dashboard/DocumentProcessing";
import { FileText, Calendar, CheckCircle2, Briefcase, Map, Video, FileQuestion } from "lucide-react";
import { LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";


const Index = () => {
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back! Choose a tool to continue your AI career journey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <StatsCard
            title="Applications"
            value="24"
            subtitle="+3 this week"
            icon={FileText}
            iconColor="bg-purple-500"
          />
          <StatsCard
            title="Interviews"
            value="8"
            subtitle="2 scheduled"
            icon={Calendar}
            iconColor="bg-blue-500"
          />
          <StatsCard
            title="Skills"
            value={skill}
            subtitle="3 in progress"
            icon={CheckCircle2}
            iconColor="bg-pink-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PerformanceChart />
          <FrequencyChart />
          <TopicDistribution />
        </div>

        {/* Document Processing */}
        <DocumentProcessing />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            title="Jobs"
            description="Browse AI-matched opportunities tailored to skills"
            icon={Briefcase}
            gradient="from-purple-500/10 to-purple-500/5"
          />
          <FeatureCard
            title="Roadmap"
            description="Personalized career paths and skill plans"
            icon={Map}
            gradient="from-blue-500/10 to-blue-500/5"
          />
          <FeatureCard
            title="Mock Interview"
            description="Practice with an AI interviewer and get feedback"
            icon={Video}
            gradient="from-pink-500/10 to-pink-500/5"
          />
          <FeatureCard
            title="Quiz"
            description="Test knowledge with AI-generated quizzes"
            icon={FileQuestion}
            gradient="from-teal-500/10 to-teal-500/5"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
