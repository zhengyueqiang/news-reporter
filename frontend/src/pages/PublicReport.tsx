import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FileText, Loader2, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportDetail {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
}

const PublicReport: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [shareToken]);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`/api/reports/public/${shareToken}`);
      setReport(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "报告不存在或已取消分享");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <FileText size={48} className="text-text-dim mb-4" />
        <p className="text-text-dim">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="border-b border-bg-border bg-bg-card/40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-semibold">MiQroNews</span>
          <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full">
            公开分享
          </span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-2">{report.title}</h1>
        <p className="text-sm text-text-muted mb-8">
          发布时间：{new Date(report.created_at).toLocaleString()}
        </p>
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content || "暂无内容"}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PublicReport;
