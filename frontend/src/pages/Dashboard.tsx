import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import {
  Search,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface Query {
  id: number;
  topic: string;
  created_at: string;
}

interface Report {
  id: number;
  title: string;
  status: string;
  period: string | null;
  schedule_id: number | null;
  created_at: string;
  summary: string | null;
}

const Dashboard: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [period, setPeriod] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<Query[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      const [qRes, rRes] = await Promise.all([
        client.get("/queries"),
        client.get("/reports"),
      ]);
      setRecentQueries(qRes.data.slice(0, 5));
      setRecentReports(rRes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const qRes = await client.post("/queries", { topic });
      if (period) {
        const scheduleRes = await client.post("/schedules", {
          query_id: qRes.data.id,
          title: topic,
          period: period,
          is_active: true,
        });
        const reports = await client.get("/reports");
        const latest = reports.data.find(
          (r: Report) => r.schedule_id === scheduleRes.data.id
        );
        if (latest) {
          navigate(`/reports/${latest.id}`);
        } else {
          navigate("/schedules");
        }
      } else {
        const reportRes = await client.post("/reports", {
          query_id: qRes.data.id,
          title: topic,
          period: null,
        });
        navigate(`/reports/${reportRes.data.id}`);
      }
    } catch (e: any) {
      console.error(e);
      const detail = e.response?.data?.detail || "请求失败，请稍后重试";
      alert(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">仪表盘</h1>
        <p className="text-text-muted text-sm">输入主题，让 AI 为您生成情报分析报告</p>
      </div>

      {/* Query Input */}
      <div className="bg-bg-card/60 backdrop-blur-md border border-bg-border rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <form onSubmit={handleQuery}>
          <div className="relative mb-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：2025年全球人工智能行业发展趋势"
              className="w-full pl-12 pr-4 py-4 bg-bg border border-bg-border rounded-xl text-text placeholder-text-dim text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <Sparkles size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Calendar size={16} />
              <span>报告周期</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-bg border border-bg-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-primary"
              >
                <option value="">单次报告</option>
                <option value="day">日报</option>
                <option value="week">周报</option>
                <option value="month">月报</option>
                <option value="year">年报</option>
              </select>
              {period && (
                <span className="text-xs text-primary ml-1">
                  系统将按计划自动重复生成报告
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="md:ml-auto px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? "生成中..." : "生成报告"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Queries */}
        <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-primary" />
            <h3 className="font-medium">近期查询</h3>
          </div>
          {recentQueries.length === 0 ? (
            <p className="text-text-dim text-sm py-4 text-center">暂无查询记录</p>
          ) : (
            <div className="space-y-3">
              {recentQueries.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg/50 border border-bg-border/50 hover:border-primary/30 transition-colors"
                >
                  <Search size={14} className="text-text-dim shrink-0" />
                  <p className="text-sm truncate flex-1">{q.topic}</p>
                  <span className="text-xs text-text-dim shrink-0">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-primary" />
            <h3 className="font-medium">近期报告</h3>
          </div>
          {recentReports.length === 0 ? (
            <p className="text-text-dim text-sm py-4 text-center">暂无报告</p>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/reports/${r.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg/50 border border-bg-border/50 hover:border-primary/30 transition-colors text-left"
                >
                  <FileText size={14} className="text-text-dim shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{r.title}</p>
                    <p className="text-xs text-text-dim mt-0.5">
                      {r.period ? `${r.period}报` : "单次报告"} · {" "}
                      {r.status === "completed" ? "已完成" : r.status === "generating" ? "生成中" : "失败"}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-text-dim shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
