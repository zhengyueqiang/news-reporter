import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Pencil,
  Trash2,
  UserPlus,
  Lock,
  AlertCircle,
  X,
  ChevronLeft,
} from "lucide-react";

interface UserItem {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  status: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  active: { label: "正常", cls: "bg-success/10 text-success" },
  pending: { label: "待审核", cls: "bg-warning/10 text-warning" },
  rejected: { label: "已拒绝", cls: "bg-danger/10 text-danger" },
  banned: { label: "已禁用", cls: "bg-text-dim/10 text-text-dim" },
};

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    is_admin: false,
    status: "active",
  });
  const [userFormLoading, setUserFormLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [user, page, pageSize, keyword]);

  const fetchUsers = async () => {
    setListLoading(true);
    try {
      const res = await client.get("/admin/users", {
        params: { page, page_size: pageSize, keyword: keyword || undefined },
      });
      setUsers(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
      setListLoading(false);
    }
  };

  const updateUserStatus = async (id: number, status: string) => {
    try {
      await client.put(`/admin/users/${id}/status?status=${status}`);
      fetchUsers();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "操作失败");
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUserForm({ username: "", email: "", password: "", is_admin: false, status: "active" });
    setShowUserModal(true);
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setUserForm({ username: u.username, email: u.email, password: "", is_admin: u.is_admin, status: u.status });
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const saveUser = async () => {
    if (!userForm.username || !userForm.email) {
      alert("请填写用户名和邮箱");
      return;
    }
    if (!editingUser && !userForm.password) {
      alert("请设置密码");
      return;
    }
    setUserFormLoading(true);
    try {
      if (editingUser) {
        const payload: any = {
          username: userForm.username,
          email: userForm.email,
          is_admin: userForm.is_admin,
          status: userForm.status,
        };
        await client.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await client.post("/admin/users", userForm);
      }
      closeUserModal();
      fetchUsers();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "保存失败");
    } finally {
      setUserFormLoading(false);
    }
  };

  const resetUserPassword = async (id: number) => {
    if (!window.confirm("确定要重置该用户的密码吗？系统将生成随机密码。")) return;
    try {
      const res = await client.post(`/admin/users/${id}/reset-password`);
      setResetPassword(res.data.new_password);
      setShowResetModal(true);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "重置失败");
    }
  };

  const toggleBanUser = async (u: UserItem) => {
    const next = u.status === "banned" ? "active" : "banned";
    const action = next === "banned" ? "禁用" : "启用";
    if (!window.confirm(`确定要${action}用户 "${u.username}" 吗？`)) return;
    await updateUserStatus(u.id, next);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/admin"
          className="flex items-center gap-1 text-sm text-text-dim hover:text-text transition-colors"
        >
          <ChevronLeft size={16} />
          返回系统管理
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-primary" />
          <h1 className="text-2xl font-semibold">用户管理</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
        >
          <UserPlus size={16} />
          新增用户
        </button>
      </div>

      <div className="relative bg-bg-card/40 border border-bg-border rounded-2xl p-5">
        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索用户名或邮箱"
              className="w-full pl-9 pr-4 py-2 bg-bg border border-bg-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-3 py-2 bg-bg border border-bg-border rounded-xl text-sm text-text focus:outline-none focus:border-primary"
          >
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
          </select>
        </div>

        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-text-dim text-sm text-center py-8">暂无用户</p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl bg-bg/50 border border-bg-border/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{u.username}</p>
                    {u.is_admin && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">管理员</span>
                    )}
                  </div>
                  <p className="text-xs text-text-dim truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 text-xs rounded-md ${statusMap[u.status]?.cls || "bg-text-dim/10 text-text-dim"}`}
                  >
                    {statusMap[u.status]?.label || u.status}
                  </span>
                  {u.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateUserStatus(u.id, "active")}
                        className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20"
                        title="通过"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => updateUserStatus(u.id, "rejected")}
                        className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20"
                        title="拒绝"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                    title="编辑"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => resetUserPassword(u.id)}
                    className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20"
                    title="重置密码"
                  >
                    <Lock size={14} />
                  </button>
                  <button
                    onClick={() => toggleBanUser(u)}
                    className={`p-1.5 rounded-lg ${u.status === "banned" ? "bg-success/10 text-success hover:bg-success/20" : "bg-danger/10 text-danger hover:bg-danger/20"}`}
                    title={u.status === "banned" ? "启用" : "禁用"}
                  >
                    {u.status === "banned" ? <CheckCircle size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-bg-border/50">
          <span className="text-xs text-text-dim">
            共 {total} 条，第 {page} / {totalPages} 页
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded-lg bg-bg border border-bg-border text-sm text-text hover:bg-bg/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-primary text-white"
                      : "bg-bg border border-bg-border text-text hover:bg-bg/80"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-bg border border-bg-border text-sm text-text hover:bg-bg/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>

        {/* Local loading overlay */}
        {listLoading && (
          <div className="absolute inset-0 bg-bg/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{editingUser ? "编辑用户" : "新增用户"}</h3>
              <button onClick={closeUserModal} className="p-1 rounded-lg hover:bg-bg/50 text-text-dim">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">用户名</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                  placeholder="输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">邮箱</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                  placeholder="输入邮箱"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  密码 {editingUser && <span className="text-text-dim">（留空则不修改）</span>}
                </label>
                <input
                  type="text"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                  placeholder={editingUser ? "留空则不修改密码" : "输入密码"}
                />
              </div>
              {editingUser && (
                <div>
                  <label className="block text-sm text-text-muted mb-1.5">状态</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-bg border border-bg-border rounded-xl text-text focus:outline-none focus:border-primary"
                  >
                    <option value="active">正常</option>
                    <option value="pending">待审核</option>
                    <option value="rejected">已拒绝</option>
                    <option value="banned">已禁用</option>
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={userForm.is_admin}
                  onChange={(e) => setUserForm({ ...userForm, is_admin: e.target.checked })}
                  className="w-4 h-4 rounded border-bg-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-muted">设为管理员</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeUserModal}
                className="flex-1 py-2.5 border border-bg-border rounded-xl text-sm font-medium hover:bg-bg/50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveUser}
                disabled={userFormLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {userFormLoading && <Loader2 size={16} className="animate-spin" />}
                {editingUser ? "保存" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">密码已重置</h3>
            <p className="text-sm text-text-muted mb-4">新密码已生成，请复制并告知用户：</p>
            <div className="bg-bg border border-bg-border rounded-xl px-4 py-3 font-mono text-sm text-text break-all mb-6">
              {resetPassword}
            </div>
            <button
              onClick={() => setShowResetModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
