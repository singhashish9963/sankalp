"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Target } from "lucide-react";

const DocumentProcessing = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fileName, setFileName] = useState("No file chosen");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Document Processing</h3>
            <p className="text-sm text-muted-foreground">
              Upload resume, set goals, and check ATS compatibility
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide" : "Show"}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6 animate-fade-in">
          {/* Upload Resume */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Upload Resume</label>
            </div>
            <div className="flex items-center gap-3">
              <label
                htmlFor="resume-upload"
                className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium cursor-pointer hover:bg-primary/90 transition-colors"
              >
                Choose file
              </label>
              <input
                id="resume-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
              <span className="text-sm text-muted-foreground">{fileName}</span>
            </div>
          </div>

          {/* Your Goals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Your Goals</label>
            </div>
            <Textarea
              placeholder="Enter your career goals and objectives..."
              className="min-h-[120px] bg-background/50 border-border/50"
            />
          </div>

          {/* Job Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">
                Job Description (Optional - for ATS Check)
              </label>
            </div>
            <Textarea
              placeholder="Paste the job description to check ATS compatibility..."
              className="min-h-[120px] bg-background/50 border-border/50"
            />
          </div>

          {/* Process Button */}
          <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90">
            Process Document
          </Button>
        </div>
      )}
    </Card>
  );
};

export default DocumentProcessing;
