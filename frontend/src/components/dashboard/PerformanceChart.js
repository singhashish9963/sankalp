"use client"
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Oct 10", value: 50 },
  { name: "Oct 10", value: 100 },
  { name: "Oct 10", value: 100 },
  { name: "Oct 10", value: 50 },
  { name: "Oct 10", value: 100 },
  { name: "Oct 10", value: 50 },
  { name: "Oct 10", value: 100 },
  { name: "Oct 10", value: 50 },
  { name: "Oct 10", value: 100 },
  { name: "Oct 10", value: 50 },
];

const PerformanceChart = () => {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
      <h3 className="text-lg font-semibold mb-6">Performance Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PerformanceChart;
