import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import {
  Shield,
  Users,
  FileText,
  Search,
  CheckCircle,
  Loader2,
  Key,
  Settings,
  ChevronRight,
  Globe,
} from "lucide-react";

interface Stats {
  total_users: number;
  total_queries: number;
  total_reports: number;
  pending_users: number;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [llmForm, setLlmForm] = useState({ provider: "deepseek", api_key: "", model: "deepseek-chat" });
  const [searchForm, setSearchForm] = useState({ engine: "serpapi", api_key: "" });
  const [saving, setSaving] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [sRes, cfgRes] = await Promise.all([
        client.get("/admin/stats"),
        client.get("/system/config"),
      ]);
      setStats(sRes.data);
      const cfg = cfgRes.data;
      if (cfg.llm_provider !== undefined) {
        setLlmForm({
          provider: cfg.llm_provider,
          model: cfg.llm_model || "",
          api_key: cfg.llm_api_key || "",
        });
      }
      if (cfg.search_engine !== undefined) {
        setSearchForm({
          engine: cfg.search_engine || "serpapi",
          api_key: cfg.search_api_key || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveLLMConfig = async () => {
    setSaving(true);
    try {
      await client.put("/system/llm", llmForm);
      alert("LLM 配置已保存");
    } catch (e: any) {
      console.error(e);
      const detail = e.response?.data?.detail || "保存失败";
      alert(detail);
    } finally {
      setSaving(false);
    }
  };

  const saveSearchConfig = async () => {
    setSavingSearch(true);
    try {
      await client.put("/system/search", searchForm);
      alert("搜索引擎配置已保存");
    } catch (e: any) {
      console.error(e);
      const detail = e.response?.data?.detail || "保存失败";
      alert(detail);
    } finally {
      setSavingSearch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={24} className="text-primary" />
        <h1 className="text-2xl font-semibold">系统管理</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "总用户", value: stats.total_users, icon: Users },
            { label: "总查询", value: stats.total_queries, icon: Search },
            { label: "总报告", value: stats.total_reports, icon: FileText },
            { label: "待审核", value: stats.pending_users, icon: CheckCircle, accent: true },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-bg-card/40 border border-bg-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className={s.accent ? "text-warning" : "text-primary"} />
                <span className="text-sm text-text-muted">{s.label}</span>
              </div>
              <p className={`text-2xl font-semibold ${s.accent ? "text-warning" : ""}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management Entry */}
        <Link
          to="/admin/users"
          className="group bg-bg-card/40 border border-bg-border rounded-2xl p-5 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <h3 className="font-medium">用户管理</h3>
            </div>
            <ChevronRight size={18} className="text-text-dim group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-text-dim">查看、新增、编辑、禁用用户，审核注册申请</p>
        </Link>

        {/* LLM Config */}
        <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Key size={18} className="text-primary" />
            LLM 配置
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">服务商</label>
              <select
                value={llmForm.provider}
                onChange={(e) => setLlmForm({ ...llmForm, provider: e.target.value })}
                className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="kimi">Kimi (月之暗面)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">模型</label>
              <input
                type="text"
                value={llmForm.model}
                onChange={(e) => setLlmForm({ ...llmForm, model: e.target.value })}
                className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                placeholder="例如：deepseek-chat"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">API Key</label>
              <input
                type="password"
                value={llmForm.api_key}
                onChange={(e) => setLlmForm({ ...llmForm, api_key: e.target.value })}
                className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                placeholder="输入 API Key"
              />
            </div>
            <button
              onClick={saveLLMConfig}
              disabled={saving}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
              {saving ? "保存中..." : "保存配置"}
            </button>
          </div>
        </div>

        {/* Search Engine Config */}
        <div className="bg-bg-card/40 border border-bg-border rounded-2xl p-5">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            搜索引擎配置
          </h3>
          <p className="text-xs text-text-dim mb-4">
            配置搜索引擎后，系统会在生成报告前自动抓取最新网络资讯，使报告内容基于实时数据而非模型旧知识。
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1.5">搜索引擎</label>
              <select
                value={searchForm.engine}
                onChange={(e) => setSearchForm({ ...searchForm, engine: e.target.value })}
                className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
              >
                <option value="serpapi">SerpAPI (Google)</option>
                <option value="bing">Bing Search API</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1.5">API Key</label>
              <input
                type="password"
                value={searchForm.api_key}
                onChange={(e) => setSearchForm({ ...searchForm, api_key: e.target.value })}
                className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                placeholder="输入搜索引擎 API Key"
              />
            </div>
            <button
              onClick={saveSearchConfig}
              disabled={savingSearch}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {savingSearch ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
              {savingSearch ? "保存中..." : "保存配置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
