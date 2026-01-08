"use client";

import { useEffect, useMemo, useState } from "react";
import {getDevices, getMyDevices, connectDevice, disconnectDevice, getDeviceDetails, simulateDeviceData,} 
from "@/services/api_calls";

/* ---------------- Helpers ---------------- */

function chipStyle(label) {
  const l = String(label).toLowerCase();
  if (l.includes("heart")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (l.includes("sleep")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (l.includes("steps")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (l.includes("water")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (l.includes("blood")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (l.includes("glucose")) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function biomarkerIcon(label) {
  const l = String(label).toLowerCase();
  if (l.includes("heart")) return "♥";
  if (l.includes("sleep")) return "Zz";
  if (l.includes("steps")) return "👣";
  if (l.includes("water")) return "💧";
  if (l.includes("blood")) return "BP";
  if (l.includes("glucose")) return "G";
  return "•";
}

function formatBiomarkerName(biomarker) {
  return String(biomarker)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

// Only for showing a nicer label in UI (do not send this to the API)
function prettyDeviceType(deviceTypeRaw) {
  if (!deviceTypeRaw) return "";
  const raw = String(deviceTypeRaw);
  const noPrefix = raw.replace(/^devicetype\./i, "");
  return noPrefix
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ---------------- Page ---------------- */

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("connect"); // connect | details
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [step, setStep] = useState("oauth"); // oauth -> pairing -> done
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchDevices() {
    try {
      setLoading(true);

      const [availableTypes, myDevices] = await Promise.all([getDevices(), getMyDevices()]);

      // Connected devices keyed by device_type (exactly as backend returns it)
      const connectedMap = new Map(myDevices.map((d) => [d.device_type, d]));

      const transformed = availableTypes.map((d) => {
        const connectedDevice = connectedMap.get(d.device_type);

        return {
          // for disconnect/details we need the connected device id (if connected)
          id: connectedDevice?.id || d.id,

          // ✅ IMPORTANT: send this EXACT value when connecting
          deviceTypeRaw: d.device_type,

          // UI fields
          name: d.display_name,
          manufacturer: d.manufacturer,
          deviceTypeLabel: prettyDeviceType(d.device_type),
          biomarkers: (d.supported_biomarkers || []).map(formatBiomarkerName),
          iconUrl: d.icon_url,
          description: d.description,

          isConnected: !!connectedDevice,
          status: connectedDevice?.status || "available",
          connectedAt: connectedDevice?.connected_at,
        };
      });

      setDevices(transformed);
      setError(null);
    } catch (err) {
      console.error("Fetch devices error:", err);
      setError(err?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDevices();
  }, []);

  const connectedDevices = useMemo(() => devices.filter((d) => d.isConnected), [devices]);
  const availableDevices = useMemo(() => devices.filter((d) => !d.isConnected), [devices]);

  const visibleDevices = useMemo(() => {
    if (activeTab === "connected") return connectedDevices;
    if (activeTab === "available") return availableDevices;
    return devices;
  }, [activeTab, devices, connectedDevices, availableDevices]);

  function openConnect(device) {
    setSelectedDevice(device);
    setModalType("connect");
    setStep("oauth");
    setModalOpen(true);
  }

  async function openDetails(device) {
    try {
      setSelectedDevice(device);
      setModalType("details");
      setModalOpen(true);
      setActionLoading(true);

      const details = await getDeviceDetails(device.id);
      setDeviceDetails(details);
    } catch (err) {
      console.error("Failed to load device details:", err);
      setError(err?.message || "Failed to load device details");
      closeModal();
    } finally {
      setActionLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedDevice(null);
    setDeviceDetails(null);
    setStep("oauth");
  }

  function approve() {
    setStep("pairing");
    setTimeout(() => setStep("done"), 800);
  }

  async function finish() {
    if (!selectedDevice) return;

    try {
      setActionLoading(true);

      await connectDevice({
      deviceType: selectedDevice.deviceTypeRaw,  // e.g. apple_watch
      deviceName: selectedDevice.name,           // e.g. Apple Watch
});

      await fetchDevices();
      closeModal();
    } catch (err) {
      console.error("Connection error:", err);
      setError(err?.message || "Failed to connect device");
      setStep("oauth");
    } finally {
      setActionLoading(false);
    }
  }

  async function disconnect(id) {
    try {
      setActionLoading(true);
      await disconnectDevice(id);
      await fetchDevices();
    } catch (err) {
      console.error("Disconnect error:", err);
      setError(err?.message || "Failed to disconnect device");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSimulateData(id) {
    try {
      setActionLoading(true);
      const response = await simulateDeviceData(id);
      alert(`Successfully generated ${response?.total_readings || 0} readings!`);

      if (modalOpen && modalType === "details" && selectedDevice?.id === id) {
        const details = await getDeviceDetails(id);
        setDeviceDetails(details);
      }
    } catch (err) {
      console.error("Simulate data error:", err);
      setError(err?.message || "Failed to simulate device data");
    } finally {
      setActionLoading(false);
    }
  }

  /* ---------------- States ---------------- */

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <div className="mt-3 text-sm text-gray-600">Loading devices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button
            onClick={() => {
              setError(null);
              fetchDevices();
            }}
            className="ml-3 text-xs underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
        <p className="mt-1 text-sm text-gray-600">Connect your devices to sync biomarker data.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: `All (${devices.length})` },
          { key: "connected", label: `Connected (${connectedDevices.length})` },
          { key: "available", label: `Available (${availableDevices.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border transition
              ${
                activeTab === t.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {visibleDevices.length === 0 ? (
        <EmptyState text="No devices to show." />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDevices.map((d) => (
            <div key={d.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {d.iconUrl ? (
                  <img src={d.iconUrl} alt={d.name} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100" />
                )}

                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{d.name}</div>
                  <div className="text-xs text-gray-500">
                    {d.manufacturer}
                    {d.deviceTypeLabel ? ` • ${d.deviceTypeLabel}` : ""}
                  </div>
                </div>

                {d.isConnected && (
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Connected
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {d.biomarkers.map((b) => (
                  <span
                    key={b}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${chipStyle(b)}`}
                  >
                    <span className="font-semibold">{biomarkerIcon(b)}</span>
                    {b}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                {d.isConnected ? (
                  <>
                    <button
                      onClick={() => openDetails(d)}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => disconnect(d.id)}
                      disabled={actionLoading}
                      className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openConnect(d)}
                    disabled={actionLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {modalOpen && modalType === "connect" && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="text-lg font-semibold text-gray-900">Connect {selectedDevice.name}</div>
            <p className="mt-1 text-sm text-gray-600">{selectedDevice.description}</p>

            {step === "oauth" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                  Authorize Pulse to access your {selectedDevice.name} data.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={approve}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

            {step === "pairing" && (
              <div className="mt-4 text-sm text-gray-700">
                Pairing with device...
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-2/3 animate-pulse bg-blue-500" />
                </div>
              </div>
            )}

            {step === "done" && (
              <button
                onClick={finish}
                disabled={actionLoading}
                className="mt-4 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? "Connecting..." : "Done"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {modalOpen && modalType === "details" && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold text-gray-900">{selectedDevice.name} Details</div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {actionLoading ? (
              <div className="mt-6 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              </div>
            ) : deviceDetails ? (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Info label="Device Type" value={String(deviceDetails.device_type || "")} />
                  <Info label="Status" value={String(deviceDetails.status || "")} />
                  <Info label="Connected At" value={formatDate(deviceDetails.connected_at)} />
                  <Info label="Last Updated" value={formatDate(deviceDetails.updated_at)} />
                </div>

                <div>
                  <div className="mb-2 text-xs text-gray-500">Supported Biomarkers</div>
                  <div className="flex flex-wrap gap-2">
                    {(deviceDetails.supported_biomarkers || []).map((b) => (
                      <span
                        key={b}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${chipStyle(b)}`}
                      >
                        <span className="font-semibold">{biomarkerIcon(b)}</span>
                        {formatBiomarkerName(b)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <button
                    onClick={() => handleSimulateData(selectedDevice.id)}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Simulating..." : "Simulate Data"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-sm text-gray-600">No details available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Small components ---------------- */

function EmptyState({ text }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
      {text}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value || "N/A"}</div>
    </div>
  );
}