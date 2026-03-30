"use client";

import { useState, useEffect, useMemo } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getProvidersDirectory, sendConnectionToHcp,
  disconnectFromProvider, getMyConnections,
} from "@/services/api_calls";

/* ─── constants ──────────────────────────────────────────────────── */
const STATUS_CLS = {
  accepted:    "bg-green-500/10 border-green-500/20 text-green-400",
  pending:     "bg-amber-500/10 border-amber-500/20 text-amber-400",
  rejected:    "bg-red-500/10   border-red-500/20   text-red-400",
  disconnected:"bg-white/[0.05] border-white/[0.08] text-white/25",
};

const inputCls = "w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors";

/* ─── main ───────────────────────────────────────────────────────── */
export default function HcpDirectory() {
  const [providers,     setProviders]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [specFilter,    setSpecFilter]    = useState("all");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [connecting,    setConnecting]    = useState({});
  const [disconnecting, setDisconnecting] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [dirRes, connRes] = await Promise.allSettled([
          getProvidersDirectory(),
          getMyConnections(),
        ]);
        const raw   = dirRes.status  === "fulfilled" ? (dirRes.value?.providers  || []) : [];
        const conns = connRes.status === "fulfilled" ? (connRes.value || [])             : [];

        const connMap = {};
        conns.forEach((c) => { connMap[c.provider_email] = { connection_id: c.id, status: c.status }; });

        setProviders(raw.map((p) => {
          const cd = connMap[p.provider_email];
          return {
            ...p,
            connection_status: cd?.status || (p.connection_status === "none" ? "disconnected" : p.connection_status || "disconnected"),
            connection_id:     cd?.connection_id || null,
          };
        }));
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const connected   = useMemo(() => providers.find((p) => p.connection_status === "accepted"), [providers]);
  const specialties = useMemo(() => {
    const set = new Set(providers.map((p) => p.specialisation).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [providers]);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchSearch = !search || [p.provider_name, p.provider_email, p.specialisation, p.about]
        .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
      const matchSpec   = specFilter   === "all" || p.specialisation === specFilter;
      const matchStatus = statusFilter === "all" || p.connection_status === statusFilter;
      return matchSearch && matchSpec && matchStatus;
    });
  }, [providers, search, specFilter, statusFilter]);

  const handleConnect = async (p) => {
    if (!p.provider_id) return;
    if (connected && p.provider_id !== connected.provider_id) {
      alert("You are already connected to a provider. Disconnect first before connecting to another.");
      return;
    }
    setConnecting((prev) => ({ ...prev, [p.provider_id]: true }));
    try {
      const res = await sendConnectionToHcp(p.provider_id);
      const nextStatus = res?.connection?.status || "pending";
      const nextId     = res?.connection?.id     || null;
      setProviders((prev) => prev.map((q) => q.provider_id === p.provider_id ? { ...q, connection_status: nextStatus, connection_id: nextId } : q));
    } catch (err) { alert(err?.message || "Failed to send request"); }
    finally { setConnecting((prev) => ({ ...prev, [p.provider_id]: false })); }
  };

  const handleDisconnect = async (p) => {
    if (!p.connection_id) return;
    if (!confirm(`Disconnect from ${p.provider_name}?`)) return;
    setDisconnecting((prev) => ({ ...prev, [p.provider_id]: true }));
    try {
      await disconnectFromProvider(p.connection_id);
      setProviders((prev) => prev.map((q) => q.provider_id === p.provider_id ? { ...q, connection_status: "disconnected", connection_id: null } : q));
    } catch (err) { alert(err?.message || "Failed to disconnect"); }
    finally { setDisconnecting((prev) => ({ ...prev, [p.provider_id]: false })); }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Find a Provider</h1>
          <p className="text-white/40 text-sm mt-1">Connect with a healthcare professional to share your health data.</p>
        </div>

        {/* Connected banner */}
        {connected && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm flex-shrink-0">
              {(connected.provider_name || "P").charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-green-400 text-sm font-semibold">{connected.provider_name}</p>
              <p className="text-white/30 text-xs">{connected.specialisation} · Connected</p>
            </div>
            <button onClick={() => handleDisconnect(connected)} disabled={!!disconnecting[connected.provider_id]}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-white/30 hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-40">
              Disconnect
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search providers…" className={`${inputCls} max-w-xs`} />
          <select value={specFilter} onChange={(e) => setSpecFilter(e.target.value)} className={`${inputCls} w-auto appearance-none`}>
            {specialties.map((s) => <option key={s} value={s} className="bg-[#0d1525]">{s === "all" ? "All Specialties" : s}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} w-auto appearance-none`}>
            <option value="all"         className="bg-[#0d1525]">All Statuses</option>
            <option value="disconnected" className="bg-[#0d1525]">Available</option>
            <option value="pending"      className="bg-[#0d1525]">Pending</option>
            <option value="accepted"     className="bg-[#0d1525]">Connected</option>
          </select>
          <span className="text-white/25 text-xs self-center ml-auto">{filtered.length} provider{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
            No providers match your filters.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((p) => {
              const st       = p.connection_status || "disconnected";
              const isBusy   = !!connecting[p.provider_id] || !!disconnecting[p.provider_id];
              const isConnected = st === "accepted";
              const isPending   = st === "pending";
              return (
                <div key={p.provider_id || p.provider_email} className={`rounded-2xl border p-5 space-y-3 transition-colors ${isConnected ? "border-green-500/15 bg-green-500/[0.04]" : "border-white/[0.07] bg-white/[0.03]"}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 font-bold flex-shrink-0">
                      {(p.provider_name || "P").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-semibold truncate">{p.provider_name || "Provider"}</p>
                      <p className="text-white/30 text-xs truncate">{p.provider_email}</p>
                      {p.specialisation && <p className="text-indigo-400 text-xs mt-0.5">{p.specialisation}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_CLS[st] || STATUS_CLS.disconnected}`}>
                      {isConnected ? "Connected" : isPending ? "Pending" : st === "rejected" ? "Rejected" : "Available"}
                    </span>
                  </div>

                  {p.about && <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{p.about}</p>}

                  {p.years_of_experience != null && (
                    <p className="text-white/25 text-xs">{p.years_of_experience} years experience</p>
                  )}

                  {/* Action button */}
                  {isConnected ? (
                    <button onClick={() => handleDisconnect(p)} disabled={isBusy}
                      className="w-full py-2 rounded-xl text-xs font-semibold border border-red-500/20 bg-red-500/[0.06] text-red-400 hover:bg-red-500/[0.12] transition-colors disabled:opacity-40">
                      {disconnecting[p.provider_id] ? "Disconnecting…" : "Disconnect"}
                    </button>
                  ) : isPending ? (
                    <button disabled className="w-full py-2 rounded-xl text-xs font-semibold border border-amber-500/20 bg-amber-500/[0.06] text-amber-400 opacity-70 cursor-default">
                      Request Pending
                    </button>
                  ) : st === "rejected" ? (
                    <button onClick={() => handleConnect(p)} disabled={isBusy}
                      className="w-full py-2 rounded-xl text-xs font-semibold border border-white/[0.09] bg-white/[0.04] text-white/40 hover:text-white/60 transition-colors disabled:opacity-40">
                      {connecting[p.provider_id] ? "Sending…" : "Resend Request"}
                    </button>
                  ) : (
                    <button onClick={() => handleConnect(p)} disabled={isBusy}
                      className="w-full py-2 rounded-xl text-xs font-semibold border border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-300 hover:bg-indigo-500/15 transition-colors disabled:opacity-40">
                      {connecting[p.provider_id] ? "Sending…" : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}
