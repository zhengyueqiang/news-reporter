import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  CalendarClock,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { path: "/", label: "仪表盘", icon: LayoutDashboard },
    { path: "/reports", label: "报告管理", icon: FileText },
    { path: "/schedules", label: "计划管理", icon: CalendarClock },
    { path: "/trends", label: "趋势分析", icon: TrendingUp },
  ];

  if (user?.is_admin) {
    navItems.push({ path: "/admin", label: "系统管理", icon: Shield });
  }

  return (
    <div className="flex h-screen bg-bg text-text">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-bg-border">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">MiQroNews</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:text-text hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-bg-border">
          <div className="flex items-center justify-between mb-3 px-4">
            <div className="text-sm">
              <p className="text-text font-medium">{user?.username}</p>
              <p className="text-text-dim text-xs">{user?.is_admin ? "管理员" : "普通用户"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm text-text-muted hover:text-danger hover:bg-danger/5 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-bg-card/80 backdrop-blur-md border-b border-bg-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-semibold">MiQroNews</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="px-4 pb-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-text-muted"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="flex items-center gap-3 px-4 py-3 w-full text-sm text-text-muted"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
};

export default Layout;
