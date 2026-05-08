import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { FileText, Clock, ChevronRight, Search } from "lucide-react";

interface Report {
  id: number;
  title: string;
  status: string;
  period: string | null;
  is_public: boolean;
  created_at: string;
  summary: string | null;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await client.get("/reports");
      setReports(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(filter.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-success/10 text-success border-success/20",
      generating: "bg-warning/10 text-warning border-warning/20",
      failed: "bg-danger/10 text-danger border-danger/20",
    };
    return map[status] || "bg-bg/50 text-text-dim";
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">报告管理</h1>
          <p className="text-text-muted text-sm">查看和管理您生成的所有情报报告</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索报告..."
            className="pl-10 pr-4 py-2 bg-bg-card border border-bg-border rounded-xl text-sm text-text placeholder-text-dim focus:outline-none focus:border-primary w-full md:w-64"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="text-text-dim mx-auto mb-4 opacity-30" />
            <p className="text-text-dim">暂无报告</p>
          </div>
        ) : (
          filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/reports/${r.id}`)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-bg-card/40 border border-bg-border hover:border-primary/40 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  {r.is_public && (
                    <span className="px-2 py-0.5 text-[10px] bg-accent/10 text-accent border border-accent/20 rounded-full">
                      公开
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-dim">
                  {r.period ? `${r.period}报` : "单次报告"} · {r.summary?.slice(0, 60) || "暂无摘要"}
                  {r.summary && r.summary.length > 60 ? "..." : ""}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 text-xs rounded-lg border shrink-0 ${statusBadge(r.status)}`}
              >
                {r.status === "completed" ? "已完成" : r.status === "generating" ? "生成中" : "失败"}
              </span>
              <ChevronRight size={16} className="text-text-dim shrink-0 group-hover:text-text transition-colors" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
