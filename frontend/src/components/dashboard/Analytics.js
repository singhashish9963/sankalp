"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, parseISO, startOfWeek } from "date-fns";

export default function Analytics() {
  const uniquePresence = (() => {
    if (typeof window === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("uniquePresence="));
    return match ? match.split("=")[1] : null;
  })();

  const [data, setData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topicData, setTopicData] = useState([]);

  // useEffect(() => {
  //   if (!uniquePresence) return;

  //   fetch("/api/getScores", {
  //     headers: {
  //       Authorization: `Bearer ${uniquePresence}`,
  //     },
  //   })
  //     .then((res) => res.json())
  //     .then((tests) => {
  //       // Sort by date
  //       // console.log(tests);
  //       const sorted = tests.data.sort(
  //         (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  //       );
  //       setData(sorted);

  //       // Weekly frequency
  //       const weekly = {};
  //       sorted.forEach((test) => {
  //         const week = format(startOfWeek(parseISO(test.createdAt)), "MMM d");
  //         weekly[week] = (weekly[week] || 0) + 1;
  //       });
  //       setWeeklyData(
  //         Object.entries(weekly).map(([week, count]) => ({ week, count }))
  //       );

  //       // Topic distribution
  //       const topicMap = {};
  //       sorted.forEach((t) => {
  //         topicMap[t.topic] = (topicMap[t.topic] || 0) + 1;
  //       });
  //       setTopicData(
  //         Object.entries(topicMap).map(([topic, value]) => ({ topic, value }))
  //       );
  //     });
  // }, [uniquePresence]);

  useEffect(() => {
  if (!uniquePresence) return;

  fetch("/api/getScores", {
    headers: {
      Authorization: `Bearer ${uniquePresence}`,
    },
  })
    .then((res) => res.json())
    .then((tests) => {
      const sorted = tests.data.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setData(sorted);
      const weekly = {};
      sorted.forEach((test) => {
        const week = format(startOfWeek(parseISO(test.createdAt)), "MMM d");
        weekly[week] = (weekly[week] || 0) + 1;
      });
      setWeeklyData(
        Object.entries(weekly).map(([week, count]) => ({ week, count }))
      );
      console.log(sorted)
      const tagMap = {};
      sorted.forEach((t) => {
        if(t.tags && Array.isArray(t.tags)) {
          console.log(t.tags)
          t.tags.forEach((tag) => {
            tagMap[tag] = (tagMap[tag] || 0) + 1;
          });
        }
      });
      setTopicData(
        Object.entries(tagMap).map(([tag, value]) => ({ topic: tag, value }))
      );
    });
}, [uniquePresence]);

  const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#a855f7"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis
                dataKey="createdAt"
                tickFormatter={(d) => format(parseISO(d), "MMM d")}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(val) => `${val}%`}
                labelFormatter={(d) => format(parseISO(d), "PPP")}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4, fill: "#22c55e" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Test Frequency</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Topic Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={topicData}
                dataKey="value"
                nameKey="topic"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {topicData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
