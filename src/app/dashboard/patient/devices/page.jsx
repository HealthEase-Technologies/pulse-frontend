"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDevices, getMyDevices, connectDevice, disconnectDevice,
  getDeviceDetails, simulateDeviceData,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

/* ─── helpers ────────────────────────────────────────────────────── */
const fmtDate = (ts) => { if (!ts) return "N/A"; const d = new Date(ts); return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString(); };
const prettyType = (raw) => {
  if (!raw) return "";
  return String(raw).replace(/^devicetype\./i, "").toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};
const fmtBio = (b) => String(b).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const TABS = ["all","connected","available"];

/* ─── main ───────────────────────────────────────────────────────── */
export default function DevicesPage() {
  const [devices,      setDevices]      = useState([]);
  const [activeTab,    setActiveTab]    = useState("all");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [actionLoad,   setActionLoad]   = useState(false);
  const [toast,        setToast]        = useState(null);

  /* modal state */
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalType,    setModalType]    = useState("connect"); // connect | details | simulate
  const [selDevice,    setSelDevice]    = useState(null);
  const [devDetails,   setDevDetails]   = useState(null);
  const [step,         setStep]         = useState("oauth"); // oauth | pairing | done
  const [daysHistory,  setDaysHistory]  = useState(1);
  const [returnToDet,  setReturnToDet]  = useState(false);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 5000); };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const [avail, mine] = await Promise.all([getDevices(), getMyDevices()]);
      const connMap = new Map((mine || []).map((d) => [d.device_type, d]));
      setDevices((avail || []).map((d) => {
        const conn = connMap.get(d.device_type);
        return {
          id:             conn?.id || d.id,
          deviceTypeRaw:  d.device_type,
          name:           d.display_name,
          manufacturer:   d.manufacturer,
          typeLabel:      prettyType(d.device_type),
          biomarkers:     (d.supported_biomarkers || []).map(fmtBio),
          description:    d.description,
          iconUrl:        d.icon_url,
          isConnected:    !!conn,
          status:         conn?.status || "available",
          connectedAt:    conn?.connected_at,
        };
      }));
      setError(null);
    } catch (err) { setError(err?.message || "Failed to load devices"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDevices(); }, []);

  const connDevices = useMemo(() => devices.filter((d) => d.isConnected),  [devices]);
  const availDevices= useMemo(() => devices.filter((d) => !d.isConnected), [devices]);
  const visible     = useMemo(() => {
    if (activeTab === "connected") return connDevices;
    if (activeTab === "available") return availDevices;
    return devices;
  }, [activeTab, devices, connDevices, availDevices]);

  const closeModal = () => { setModalOpen(false); setSelDevice(null); setDevDetails(null); setStep("oauth"); };

  const openConnect = (d) => { setSelDevice(d); setModalType("connect"); setStep("oauth"); setModalOpen(true); };

  const openDetails = async (d) => {
    setSelDevice(d); setModalType("details"); setModalOpen(true); setActionLoad(true);
    try { setDevDetails(await getDeviceDetails(d.id)); }
    catch (err) { setError(err?.message || "Failed to load details"); closeModal(); }
    finally { setActionLoad(false); }
  };

  const openSimulate = (d, fromDet = false) => {
    setSelDevice(d); setModalType("simulate"); setDaysHistory(1); setReturnToDet(fromDet); setModalOpen(true);
  };

  const handleConnect = async () => {
    if (!selDevice) return;
    setActionLoad(true);
    try {
      await connectDevice({ deviceType: selDevice.deviceTypeRaw, deviceName: selDevice.name });
      await fetchDevices();
      closeModal();
      showToast("success", `${selDevice.name} connected successfully.`);
    } catch (err) { setError(err?.message || "Failed to connect"); setStep("oauth"); }
    finally { setActionLoad(false); }
  };

  const handleDisconnect = async (d) => {
    if (!confirm(`Disconnect ${d.name}?`)) return;
    setActionLoad(true);
    try { await disconnectDevice(d.id); await fetchDevices(); showToast("success", `${d.name} disconnected.`); }
    catch (err) { setError(err?.message || "Failed to disconnect"); }
    finally { setActionLoad(false); }
  };

  const handleSimulate = async () => {
    if (!selDevice) return;
    setActionLoad(true);
    try {
      const res = await simulateDeviceData(selDevice.id, daysHistory);
      showToast("success", `Generated ${res?.total_readings || 0} readings.`);
      if (returnToDet) { setModalType("details"); setDevDetails(await getDeviceDetails(selDevice.id)); setReturnToDet(false); }
      else closeModal();
    } catch (err) { showToast("error", err?.message || "Simulation failed"); }
    finally { setActionLoad(false); }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-4xl mx-auto pb-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Devices</h1>
          <p className="text-white/40 text-sm mt-1">Connect health devices to automatically sync your biomarker data.</p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`px-4 py-3 rounded-xl text-sm border ${toast.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {toast.msg}
          </div>
        )}
        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Connected summary */}
        {connDevices.length > 0 && (
          <div className="rounded-2xl border border-green-500/15 bg-green-500/[0.04] px-5 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-green-400/80 text-sm">{connDevices.length} device{connDevices.length !== 1 ? "s" : ""} connected and syncing</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${activeTab === t ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/60"}`}>
              {t === "all" ? `All (${devices.length})` : t === "connected" ? `Connected (${connDevices.length})` : `Available (${availDevices.length})`}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-white/25 text-sm">
            No devices in this category.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((d) => (
              <div key={d.id} className={`rounded-2xl border p-5 space-y-3 transition-colors ${d.isConnected ? "border-green-500/15 bg-green-500/[0.04]" : "border-white/[0.07] bg-white/[0.03]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Device icon */}
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {d.iconUrl ? (
                        <img src={d.iconUrl} alt={d.name} className="w-7 h-7 object-contain" />
                      ) : (
                        <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4m6-18h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M9 3v18m6-18v18" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/85 text-sm font-semibold leading-snug truncate">{d.name}</p>
                      <p className="text-white/35 text-xs truncate">{d.manufacturer}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${d.isConnected ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/[0.05] border-white/[0.08] text-white/35"}`}>
                    {d.isConnected ? "Connected" : "Available"}
                  </span>
                </div>

                {d.description && <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{d.description}</p>}

                {d.biomarkers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {d.biomarkers.slice(0, 4).map((b) => (
                      <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.09] text-white/45">{b}</span>
                    ))}
                    {d.biomarkers.length > 4 && <span className="text-xs text-white/30">+{d.biomarkers.length - 4} more</span>}
                  </div>
                )}

                {d.connectedAt && <p className="text-white/30 text-xs">Connected since {fmtDate(d.connectedAt)}</p>}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {d.isConnected ? (
                    <>
                      <button onClick={() => openDetails(d)}
                        className="flex-1 py-1.5 rounded-lg text-xs border border-white/[0.09] text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
                        Details
                      </button>
                      <button onClick={() => openSimulate(d)}
                        className="flex-1 py-1.5 rounded-lg text-xs border border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-300 hover:bg-indigo-500/15 transition-colors">
                        Simulate
                      </button>
                      <button onClick={() => handleDisconnect(d)} disabled={actionLoad}
                        className="py-1.5 px-3 rounded-lg text-xs border border-red-500/20 text-red-400/70 hover:bg-red-500/[0.08] transition-colors disabled:opacity-40">
                        ×
                      </button>
                    </>
                  ) : (
                    <button onClick={() => openConnect(d)}
                      className="w-full py-1.5 rounded-lg text-xs border border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-300 hover:bg-indigo-500/15 transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Modals ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0d1525] shadow-2xl p-6 space-y-5">

              {/* Connect modal */}
              {modalType === "connect" && selDevice && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white/25 text-xs uppercase tracking-widest">Connect Device</p>
                      <p className="text-white font-semibold mt-0.5">{selDevice.name}</p>
                    </div>
                    <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 text-lg">×</button>
                  </div>
                  {step === "oauth" && (
                    <>
                      <p className="text-white/40 text-sm">You'll need to authorize Pulse to read data from {selDevice.name}.</p>
                      <button onClick={() => setStep("pairing")}
                        className="w-full py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors">
                        Authorize
                      </button>
                    </>
                  )}
                  {step === "pairing" && (
                    <>
                      <p className="text-white/40 text-sm">Pairing device…</p>
                      <button onClick={() => setStep("done")} className="w-full py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold">Next</button>
                    </>
                  )}
                  {step === "done" && (
                    <>
                      <p className="text-white/40 text-sm">Ready to connect. Confirm to finish setup.</p>
                      <button onClick={handleConnect} disabled={actionLoad}
                        className="w-full py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold disabled:opacity-40">
                        {actionLoad ? "Connecting…" : "Confirm Connection"}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Details modal */}
              {modalType === "details" && selDevice && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white/25 text-xs uppercase tracking-widest">Device Details</p>
                      <p className="text-white font-semibold mt-0.5">{selDevice.name}</p>
                    </div>
                    <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 text-lg">×</button>
                  </div>
                  {actionLoad ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-white/30 text-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                      Loading…
                    </div>
                  ) : devDetails ? (
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {[["Type",devDetails.device_type_label || selDevice.typeLabel],["Status",devDetails.status || selDevice.status],["Connected",fmtDate(devDetails.connected_at || selDevice.connectedAt)],["Synced",fmtDate(devDetails.last_sync)]].map(([l,v]) => (
                          <div key={l} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                            <p className="text-white/25 text-xs">{l}</p>
                            <p className="text-white/65 text-xs font-medium mt-0.5 truncate">{v}</p>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => openSimulate(selDevice, true)}
                        className="w-full py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors">
                        Simulate Data
                      </button>
                    </div>
                  ) : null}
                </>
              )}

              {/* Simulate modal */}
              {modalType === "simulate" && selDevice && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white/25 text-xs uppercase tracking-widest">Simulate Data</p>
                      <p className="text-white font-semibold mt-0.5">{selDevice.name}</p>
                    </div>
                    <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-white/40 text-lg">×</button>
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Days of History</label>
                    <div className="flex flex-wrap gap-2">
                      {[1,3,7,14,30].map((d) => (
                        <button key={d} onClick={() => setDaysHistory(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${daysHistory === d ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300" : "border-white/[0.07] text-white/35 hover:border-white/20"}`}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-white/30 text-xs">This will generate {daysHistory} day{daysHistory !== 1 ? "s" : ""} of synthetic biomarker readings for testing.</p>
                  <button onClick={handleSimulate} disabled={actionLoad}
                    className="w-full py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40">
                    {actionLoad ? "Simulating…" : `Generate ${daysHistory} day${daysHistory !== 1 ? "s" : ""} of data`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}
