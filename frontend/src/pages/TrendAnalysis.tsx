import React, { useState, useEffect } from "react";
import client from "../api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Check, Loader2, Sparkles } from "lucide-react";

interface Report {
  id: number;
  title: string;
  period: string | null;
  status: string;
  created_at: string;
  summary: string | null;
}

const TrendAnalysis: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await client.get("/reports");
      const data = res.data.filter((r: Report) => r.status === "completed");
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runAnalysis = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setAnalysis("");
    try {
      const res = await client.post("/reports/trend", { report_ids: selected });
      setAnalysis(res.data.analysis);

      const mockData = selected.map((id, idx) => {
        const r = reports.find((x) => x.id === id);
        return {
          name: r?.title.slice(0, 8) + "..." || `R${id}`,
          value: Math.floor(Math.random() * 50) + 50 + idx * 10,
        };
      });
      setChartData(mockData);
    } catch (e) {
      console.error(e);
      setAnalysis("分析请求失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">趋势分析</h1>
        <p className="text-text-muted text-sm">选择多份报告，让 AI 为您分析趋势变化</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selector */}
        <div className="lg:col-span-1 bg-bg-card/40 border border-bg-border rounded-2xl p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Check size={16} className="text-primary" />
            选择报告（至少2份）
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-text-dim text-sm text-center py-4">暂无可用报告</p>
            ) : (
              reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleSelect(r.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                    selected.includes(r.id)
                      ? "bg-primary/10 border-primary/40"
                      : "bg-bg/50 border-bg-border/50 hover:border-bg-border"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected.includes(r.id)
                        ? "bg-primary border-primary"
                        : "border-text-dim"
                    }`}
                  >
                    {selected.includes(r.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.title}</p>
                    <p className="text-xs text-text-dim">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            onClick={runAnalysis}
            disabled={selected.length < 2 || loading}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "分析中..." : "开始分析"}
          </button>
        </div>

        {/* Analysis Result */}
        <div className="lg:col-span-2 space-y-6">
          {chartData.length > 0 && (
            <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-5">
              <h3 className="font-medium mb-4">数据概览</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        color: "#F1F5F9",
                      }}
                    />
                    <Bar dataKey="value" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                AI 趋势洞察
              </h3>
              <div className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
                {analysis}
              </div>
            </div>
          )}

          {!analysis && !loading && selected.length < 2 && (
            <div className="flex flex-col items-center justify-center h-64 bg-bg-card/20 border border-bg-border/50 rounded-2xl">
              <TrendingUp size={48} className="text-text-dim mb-4 opacity-30" />
              <p className="text-text-dim text-sm">请选择至少 2 份报告进行分析</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
