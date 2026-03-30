"use client";

import { useState, useEffect } from "react";
import { getAllUsersAdmin } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

const ROLE_BADGE = {
  1: { label: "Patient",  cls: "bg-indigo-500/15 border-indigo-500/20 text-indigo-400" },
  2: { label: "Provider", cls: "bg-green-500/15  border-green-500/20  text-green-400"  },
  3: { label: "Admin",    cls: "bg-purple-500/15 border-purple-500/20 text-purple-400" },
};

const LICENSE_BADGE = {
  approved: "bg-green-500/15 border-green-500/20 text-green-400",
  rejected: "bg-red-500/15   border-red-500/20   text-red-400",
  pending:  "bg-amber-500/15 border-amber-500/20 text-amber-400",
};

export default function AdminUsersPage() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsersAdmin();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === parseInt(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <RoleProtection allowedRoles={[USER_ROLES.ADMIN]}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">User Management</h1>
          <p className="text-white/40 text-sm mt-1">View all registered users in the system</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 mb-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or username…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all"  className="bg-[#0d1525]">All Roles</option>
              <option value="1"    className="bg-[#0d1525]">Patients</option>
              <option value="2"    className="bg-[#0d1525]">Providers</option>
              <option value="3"    className="bg-[#0d1525]">Admins</option>
            </select>
          </div>
          <p className="mt-2.5 text-xs text-white/25">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["User", "Role", "Status", "Registered", "License"].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="h-3 bg-white/[0.06] rounded w-32 animate-pulse" />
                          <div className="h-2.5 bg-white/[0.04] rounded w-44 animate-pulse" />
                        </div>
                      </td>
                      {[1,2,3,4].map((j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-3 bg-white/[0.06] rounded w-20 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-white/30 text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const role    = ROLE_BADGE[user.role] || { label: "Unknown", cls: "bg-white/10 border-white/10 text-white/40" };
                    const licStat = user.license_status || "pending";
                    const licCls  = LICENSE_BADGE[licStat] || LICENSE_BADGE.pending;
                    return (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{user.full_name || "N/A"}</div>
                          <div className="text-xs text-white/40 mt-0.5">{user.email}</div>
                          <div className="text-xs text-white/25">@{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${role.cls}`}>
                            {role.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            user.is_active
                              ? "bg-green-500/15 border-green-500/20 text-green-400"
                              : "bg-red-500/15   border-red-500/20   text-red-400"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/40">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 2 ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${licCls}`}>
                              {licStat}
                            </span>
                          ) : (
                            <span className="text-xs text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </RoleProtection>
  );
}
