import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  FileText,
  ChevronRight,
  AlertCircle,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface Schedule {
  id: number;
  title: string;
  period: string;
  is_active: boolean;
  next_run_at: string;
  last_run_at: string | null;
  created_at: string;
}

const periodLabel: Record<string, string> = {
  day: "日报",
  week: "周报",
  month: "月报",
  year: "年报",
};

const periodColor: Record<string, string> = {
  day: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  week: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  month: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  year: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const ReportSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await client.get("/schedules");
      setSchedules(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await client.put(`/schedules/${id}`, { is_active: !current });
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSchedule = async (id: number) => {
    if (!window.confirm("确定要删除该计划吗？关联的报告不会被删除。")) return;
    try {
      await client.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const activeCount = schedules.filter((s) => s.is_active).length;

  const formatTime = (s: string | null) => {
    if (!s) return "—";
    return new Date(s).toLocaleString("zh-CN");
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">计划管理</h1>
        <p className="text-text-muted text-sm">
          查看和管理您的周期性报告计划，系统将在下次执行时间自动生成新报告
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-card/60 backdrop-blur-md border border-bg-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap size={18} className="text-primary" />
            </div>
            <span className="text-text-muted text-sm">活跃计划</span>
          </div>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="bg-bg-card/60 backdrop-blur-md border border-bg-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock size={18} className="text-warning" />
            </div>
            <span className="text-text-muted text-sm">总计划数</span>
          </div>
          <p className="text-2xl font-semibold">{schedules.length}</p>
        </div>
        <div className="bg-bg-card/60 backdrop-blur-md border border-bg-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <span className="text-text-muted text-sm">已暂停</span>
          </div>
          <p className="text-2xl font-semibold">{schedules.length - activeCount}</p>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-20 bg-bg-card/40 border border-bg-border rounded-2xl">
            <Calendar size={48} className="text-text-dim mx-auto mb-4 opacity-30" />
            <p className="text-text-dim mb-1">暂无计划</p>
            <p className="text-text-dim text-xs">
              在仪表盘选择报告周期并提交，即可创建自动执行计划
            </p>
          </div>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-bg-card/40 border border-bg-border hover:border-primary/40 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full border shrink-0 ${
                      periodColor[s.period] || "bg-bg/50 text-text-dim"
                    }`}
                  >
                    {periodLabel[s.period] || s.period}
                  </span>
                  {s.is_active ? (
                    <span className="px-2 py-0.5 text-[10px] bg-success/10 text-success border border-success/20 rounded-full shrink-0">
                      运行中
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-danger/10 text-danger border border-danger/20 rounded-full shrink-0">
                      已暂停
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    下次执行：{formatTime(s.next_run_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    上次执行：{formatTime(s.last_run_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(s.id, s.is_active)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    s.is_active
                      ? "bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20"
                      : "bg-success/10 text-success hover:bg-success/20 border border-success/20"
                  }`}
                >
                  {s.is_active ? <Pause size={14} /> : <Play size={14} />}
                  {s.is_active ? "暂停" : "启用"}
                </button>
                <button
                  onClick={() => navigate(`/reports?schedule=${s.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all"
                >
                  <FileText size={14} />
                  报告
                </button>
                <button
                  onClick={() => deleteSchedule(s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportSchedules;
