import React from "react";
import { Check, X } from "lucide-react";

const comparisons = [
  {
    feature: "Coding & Problem Practice",
    leetcode: true,
    naukri: false,
    glassdoor: false,
    us: true,
  },
  {
    feature: "Resume / Portfolio",
    leetcode: false,
    naukri: "Limited",
    glassdoor: false,
    us: "AI-powered",
  },
  {
    feature: "Mock Interview Simulations",
    leetcode: false,
    naukri: false,
    glassdoor: false,
    us: "Real-time AI feedback",
  },
  {
    feature: "Career Roadmap Guidance",
    leetcode: false,
    naukri: false,
    glassdoor: false,
    us: "Personalized AI path",
  },
  {
    feature: "Job Listings / Opportunities",
    leetcode: false,
    naukri: true,
    glassdoor: false,
    us: "Auto-scraped & matched",
  },
  {
    feature: "Integrated All-in-One Platform",
    leetcode: false,
    naukri: false,
    glassdoor: false,
    us: true,
  },
];

const platforms = [
  { name: "LeetCode", key: "leetcode" },
  { name: "Naukri", key: "naukri" },
  { name: "Glassdoor", key: "glassdoor" },
  { name: "Career AI", key: "us", highlight: true },
];

const Comparison = () => {
  const renderCell = (value) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-red-500/50 mx-auto" />;
    }
    return <span className="text-sm text-primary font-medium">{value}</span>;
  };

  return (
    <section id="comparison" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Choose <span className="text-primary">Career AI</span>?
          </h2>
          <p className="text-xl text-muted-foreground">
            See how we compare to other platforms in the market
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">
                    Feature
                  </th>
                  {platforms.map((platform) => (
                    <th
                      key={platform.key}
                      className={`p-4 text-center font-semibold ${
                        platform.highlight
                          ? "text-primary text-lg"
                          : "text-foreground"
                      }`}
                    >
                      {platform.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisons.map((comparison, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/50 hover:bg-card/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="p-4 text-foreground/90">
                      {comparison.feature}
                    </td>
                    <td className="p-4 text-center">
                      {renderCell(comparison.leetcode)}
                    </td>
                    <td className="p-4 text-center">
                      {renderCell(comparison.naukri)}
                    </td>
                    <td className="p-4 text-center">
                      {renderCell(comparison.glassdoor)}
                    </td>
                    <td className="p-4 text-center bg-primary/5">
                      {renderCell(comparison.us)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
          <div
            className="text-center space-y-2 animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="text-2xl font-bold text-primary">
              Unified Platform
            </div>
            <p className="text-sm text-muted-foreground">
              Everything in one place - no more jumping between tools
            </p>
          </div>
          <div
            className="text-center space-y-2 animate-fade-in"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="text-2xl font-bold text-primary">Personalized AI</div>
            <p className="text-sm text-muted-foreground">
              Tailored roadmap and feedback just for you
            </p>
          </div>
          <div
            className="text-center space-y-2 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="text-2xl font-bold text-primary">
              Real-Time Improvement
            </div>
            <p className="text-sm text-muted-foreground">
              Instant AI feedback to boost your performance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
