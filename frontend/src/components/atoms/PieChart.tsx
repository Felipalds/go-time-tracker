import React from "react";

interface PieChartData {
  name: string;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, size = 120 }) => {
  const radius = size / 2;
  const strokeWidth = size * 0.2;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;

  let cumulativePercentage = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.length === 0 ? (
        <circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
      ) : (
        data.map((item, index) => {
          const offset = cumulativePercentage * circumference / 100;
          const dashLength = item.percentage * circumference / 100;
          cumulativePercentage += item.percentage;

          return (
            <circle
              key={index}
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${radius} ${radius})`}
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
          );
        })
      )}
    </svg>
  );
};
