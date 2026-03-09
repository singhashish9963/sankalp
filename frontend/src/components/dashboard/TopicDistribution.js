"use client"
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Topic 1", value: 1, color: "#6366F1" },
  { name: "Topic 2", value: 2, color: "#3B82F6" },
  { name: "Topic 3", value: 1, color: "#F97316" },
  { name: "Topic 4", value: 2, color: "#10B981" },
  { name: "Topic 5", value: 1, color: "#8B5CF6" },
  { name: "Topic 6", value: 1, color: "#EF4444" },
  { name: "Topic 7", value: 1, color: "#F59E0B" },
];

const TopicDistribution = () => {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
      <h3 className="text-lg font-semibold mb-6">Topic Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ value }) => value}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            stroke="hsl(var(--border))"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TopicDistribution;
