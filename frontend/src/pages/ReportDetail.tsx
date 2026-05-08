import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Loader2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportDetail {
  id: number;
  title: string;
  status: string;
  period: string | null;
  is_public: boolean;
  share_token: string | null;
  content: string | null;
  summary: string | null;
  created_at: string;
}

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await client.get(`/reports/${id}`);
      setReport(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePublic = async () => {
    if (!report) return;
    setUpdating(true);
    try {
      const res = await client.put(`/reports/${report.id}`, {
        is_public: !report.is_public,
      });
      setReport(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const copyLink = () => {
    if (!report?.share_token) return;
    const url = `${window.location.origin}/public/${report.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText size={48} className="text-text-dim mb-4" />
        <p className="text-text-dim">报告不存在或已被删除</p>
        <button
          onClick={() => navigate("/reports")}
          className="mt-4 text-primary hover:text-primary-light text-sm"
        >
          返回报告列表
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">返回</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{report.title}</h1>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span>
              {report.period ? `${report.period}报` : "单次报告"}
            </span>
            <span>·</span>
            <span>{new Date(report.created_at).toLocaleString()}</span>
            <span>·</span>
            <span
              className={`px-2 py-0.5 rounded-md text-xs ${
                report.status === "completed"
                  ? "bg-success/10 text-success"
                  : report.status === "generating"
                  ? "bg-warning/10 text-warning"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {report.status === "completed" ? "已完成" : report.status === "generating" ? "生成中" : "失败"}
            </span>
          </div>
        </div>

        {report.status === "completed" && (
          <div className="flex items-center gap-3">
            <button
              onClick={togglePublic}
              disabled={updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                report.is_public
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-bg-card text-text-muted border-bg-border hover:border-text-dim"
              }`}
            >
              {updating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : report.is_public ? (
                <Eye size={16} />
              ) : (
                <EyeOff size={16} />
              )}
              {report.is_public ? "公开中" : "设为公开"}
            </button>
            {report.is_public && report.share_token && (
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "已复制" : "复制链接"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-6 md:p-8 min-h-[400px]">
        {report.status === "generating" ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-primary mb-4" />
            <p className="text-text-muted">报告正在生成中，请稍候...</p>
          </div>
        ) : report.status === "failed" ? (
          <div className="flex flex-col items-center justify-center py-20 text-danger">
            <p>报告生成失败，请稍后重试</p>
          </div>
        ) : report.content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-text-dim text-center py-20">暂无内容</p>
        )}
      </div>
    </div>
  );
};

export default ReportDetailPage;
