import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMsg, setPendingMsg] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPendingMsg("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
        setPendingMsg("注册成功，请等待管理员审核后登录。");
        setIsRegister(false);
      } else {
        await login(username, password);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold mb-1">MiQroNews</h2>
          <p className="text-text-muted text-sm">{isRegister ? "创建新账户" : "登录到您的账户"}</p>
        </div>

        <div className="bg-bg-card/60 backdrop-blur-xl border border-bg-border rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}
          {pendingMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm">
              {pendingMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-bg border border-bg-border rounded-xl text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="请输入用户名"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-bg border border-bg-border rounded-xl text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="请输入邮箱"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-bg border border-bg-border rounded-xl text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-10"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isRegister ? "注册" : "登录"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setPendingMsg("");
              }}
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              {isRegister ? "已有账户？去登录" : "没有账户？去注册"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
