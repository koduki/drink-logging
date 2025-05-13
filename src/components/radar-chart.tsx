
'use client';

import React from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'; // Renamed Tooltip to avoid conflict
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; // Removed ChartTooltip import from here
import type { ScoreDrinkDetailsOutput } from '@/ai/flows/score-drink-details';

interface RadarChartProps {
  scoreData: ScoreDrinkDetailsOutput;
   size?: number; // Optional size prop
}

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--accent))', // Use accent color (Deep Red)
  },
  aroma: { label: 'Aroma', color: 'hsl(var(--chart-1))' },
  sweetness: { label: 'Sweetness', color: 'hsl(var(--chart-2))' },
  richnessBody: { label: 'Richness/Body', color: 'hsl(var(--chart-3))' },
  acidityFreshness: { label: 'Acidity/Freshness', color: 'hsl(var(--chart-4))' },
  complexity: { label: 'Complexity', color: 'hsl(var(--chart-5))' },
  aftertasteFinish: { label: 'Aftertaste/Finish', color: 'hsl(var(--chart-1))' }, // Re-use a color
} satisfies ChartConfig;


export default function RadarChartComponent({ scoreData, size = 250 }: RadarChartProps) {
  const chartData = [
    { category: 'Aroma', score: scoreData.aroma.score, reason: scoreData.aroma.reason },
    { category: 'Sweetness', score: scoreData.sweetness.score, reason: scoreData.sweetness.reason },
    { category: 'Richness/Body', score: scoreData.richnessBody.score, reason: scoreData.richnessBody.reason },
    { category: 'Acidity/Freshness', score: scoreData.acidityFreshness.score, reason: scoreData.acidityFreshness.reason },
    { category: 'Complexity', score: scoreData.complexity.score, reason: scoreData.complexity.reason },
    { category: 'Aftertaste/Finish', score: scoreData.aftertasteFinish.score, reason: scoreData.aftertasteFinish.reason },
  ];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square" style={{ height: `${size}px`, width: `${size}px` }}>
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }} // Adjusted margins
             outerRadius="80%" // Adjust outer radius if needed
            >
            {/* Use RechartsTooltip and ChartTooltipContent */}
            <RechartsTooltip
                cursor={false}
                content={
                    <ChartTooltipContent
                        indicator="line"
                        labelKey="category"
                         // Custom formatter to show score and reason
                         formatter={(value, name, props) => {
                             // Ensure props.payload exists and has the category property
                            const category = props.payload?.category;
                            if (typeof category !== 'string') return null; // Exit if category is not valid

                            const dataPoint = chartData.find(d => d.category === category);
                             if (!dataPoint) return null;
                            return (
                                <div className="text-xs p-1 w-40">
                                    <p className="font-semibold">{dataPoint.category}: {value}/5</p>
                                    <p className="text-muted-foreground mt-1 whitespace-normal">{dataPoint.reason}</p>
                                </div>
                            );
                        }}
                    />
                }
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} /> {/* Adjust font size */}
             {/* Hide PolarRadiusAxis numbers if needed */}
             {/* <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} /> */}
            <Radar
                name="Drink Score"
                dataKey="score"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.6}
                 dot={{ r: 2 }} // Smaller dots
                activeDot={{ r: 3 }} // Slightly larger active dots
            />
            </RadarChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
