import React, { useState, useEffect } from "react";
import { PieChart } from "../atoms/PieChart";

const API_URL = "http://localhost:8085/api";

type Period = "day" | "week" | "month" | "year";

interface ActivityResume {
  activity_id: number;
  activity_name: string;
  total_seconds: number;
  total_time: string;
  entry_count: number;
  percentage: number;
}

interface ResumeData {
  period: string;
  total_seconds: number;
  total_time: string;
  activities: ActivityResume[];
}

const COLORS = ["#F87070", "#70F3F8", "#D881F8"];

export const ResumeSection: React.FC = () => {
  const [period, setPeriod] = useState<Period>("week");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResume();
  }, [period]);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/resume?period=${period}`);
      const data = await response.json();
      setResumeData(data);
    } catch (err) {
      console.error("Failed to fetch resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const pieData =
    resumeData?.activities.map((activity, index) => ({
      name: activity.activity_name,
      percentage: activity.percentage,
      color: COLORS[index % COLORS.length],
    })) || [];

  return (
    <div className="w-full bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 backdrop-blur-xl">
      {/* Period Filters */}
      <div className="flex gap-2 mb-6 justify-center">
        {(["day", "week", "month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              period === p
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                : "bg-black/30 border border-white/[0.08] text-slate-400 hover:border-white/15 hover:text-slate-200"
            }`}
            onClick={() => setPeriod(p)}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-600 text-center py-8 text-sm">
          Loading...
        </div>
      ) : !resumeData || resumeData.activities.length === 0 ? (
        <div className="text-slate-600 text-center py-8 text-sm">
          No activities tracked for this period
        </div>
      ) : (
        <div className="flex gap-8 items-center justify-center">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <PieChart data={pieData} size={120} />
          </div>

          {/* Activity List with Progress */}
          <div className="flex flex-col gap-3 flex-1 max-w-xs">
            {resumeData.activities.map((activity, index) => (
              <div
                key={activity.activity_id}
                className="flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-50 truncate text-sm">
                      {activity.activity_name}
                    </span>
                    <span className="text-slate-500 ml-2 text-xs">
                      {activity.total_time}
                    </span>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${activity.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
                <span className="text-slate-500 text-xs w-9 text-right">
                  {Math.round(activity.percentage)}%
                </span>
              </div>
            ))}

            {/* Total */}
            <div className="mt-2 pt-2 border-t border-white/[0.08]">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Total</span>
                <span>{resumeData.total_time}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
