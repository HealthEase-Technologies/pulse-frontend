"use client";

import { useState, useEffect } from "react";
import { getAllProviders, updateLicenseStatus, getProviderLicenseUrl, updateProvider } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import LicenseViewerModal from "@/components/LicenseViewerModal";

const STATUS_BADGE = {
  approved: { cls: "bg-green-500/15 border-green-500/20 text-green-400" },
  rejected: { cls: "bg-red-500/15   border-red-500/20   text-red-400"   },
  pending:  { cls: "bg-amber-500/15 border-amber-500/20 text-amber-400" },
};

const FILTERS = ["all", "pending", "approved", "rejected"];

const SPECIALISATIONS = [
  "General Practice","Cardiology","Neurology","Pediatrics","Surgery",
  "Orthopedics","Dermatology","Psychiatry","Radiology","Anesthesiology",
  "Obstetrics & Gynecology","Ophthalmology","Emergency Medicine","Internal Medicine","Other",
];

function InputField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AdminProvidersPage() {
  const [providers, setProviders]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [filter, setFilter]             = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [licenseLoading, setLicenseLoading]   = useState(false);

  const [editingProvider, setEditingProvider]           = useState(null);
  const [editName, setEditName]                         = useState("");
  const [editYearsOfExperience, setEditYearsOfExperience] = useState("");
  const [editSpecialisation, setEditSpecialisation]     = useState("");
  const [editAbout, setEditAbout]                       = useState("");

  const [viewingProvider, setViewingProvider] = useState(null);

  useEffect(() => { loadProviders(); }, [filter]);

  const loadProviders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllProviders(filter === "all" ? null : filter);
      setProviders(data.providers || []);
    } catch (err) {
      console.error("Failed to load providers:", err);
      setError("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (providerId, newStatus) => {
    setProcessingId(providerId);
    setError("");
    try {
      await updateLicenseStatus(providerId, newStatus);
      await loadProviders();
    } catch (err) {
      setError(err.message || "Failed to update license status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewLicense = async (providerId) => {
    setLicenseLoading(true);
    setError("");
    setModalOpen(true);
    try {
      const result = await getProviderLicenseUrl(providerId);
      setSelectedLicense(result.url);
    } catch (err) {
      setError(err.message || "Failed to load license");
      setModalOpen(false);
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setEditName(provider.full_name);
    setEditYearsOfExperience(
      provider.years_of_experience != null ? provider.years_of_experience.toString() : ""
    );
    setEditSpecialisation(provider.specialisation || "");
    setEditAbout(provider.about || "");
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return setError("Provider name cannot be empty");
    if (!editSpecialisation.trim()) return setError("Specialisation is required");
    if (editYearsOfExperience !== "" && (parseInt(editYearsOfExperience) < 0 || parseInt(editYearsOfExperience) > 60))
      return setError("Years of experience must be between 0 and 60");
    if (editAbout && editAbout.length > 500)
      return setError("About must be 500 characters or less");

    setProcessingId(editingProvider.id);
    setError("");
    try {
      const updateData = {
        full_name: editName.trim(),
        specialisation: editSpecialisation.trim(),
        about: editAbout.trim() || null,
      };
      if (editYearsOfExperience !== "") {
        updateData.years_of_experience = parseInt(editYearsOfExperience);
      }
      await updateProvider(editingProvider.id, updateData);
      setEditingProvider(null);
      await loadProviders();
    } catch (err) {
      setError(err.message || "Failed to update provider");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
    setEditName("");
    setEditYearsOfExperience("");
    setEditSpecialisation("");
    setEditAbout("");
  };

  const statusBadge = (status) => {
    const s = status || "pending";
    const { cls } = STATUS_BADGE[s] || STATUS_BADGE.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cls}`}>
        {s}
      </span>
    );
  };

  const inputCls = "w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50";

  return (
    <RoleProtection allowedRoles={[USER_ROLES.ADMIN]}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">Provider Management</h1>
          <p className="text-white/40 text-sm mt-1">Manage providers, licenses, and provider data</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-3 mb-5 flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all duration-150 capitalize ${
                filter === f
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.05]"
              }`}
            >
              {f === "all" ? `All (${providers.length})` : f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Provider", "Professional Details", "License Status", "Registered", "Actions"].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="h-3 bg-white/[0.06] rounded w-36 animate-pulse" />
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
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-white/30 text-sm">
                      No providers found
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{provider.full_name}</div>
                        <div className="text-xs text-white/40 mt-0.5">{provider.email}</div>
                      </td>
                      <td className="px-6 py-4 max-w-[220px]">
                        {provider.specialisation ? (
                          <>
                            <div className="text-sm font-medium text-white/80">{provider.specialisation}</div>
                            {provider.years_of_experience != null && (
                              <div className="text-xs text-white/35 mt-0.5">{provider.years_of_experience} yrs exp</div>
                            )}
                            {provider.about && (
                              <div className="text-xs text-white/30 mt-1 line-clamp-2">{provider.about}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-white/20 italic">No details</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge(provider.license_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/40">
                        {new Date(provider.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1.5 justify-end items-center flex-wrap">
                          <button
                            onClick={() => setViewingProvider(provider)}
                            className="px-3 py-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            Details
                          </button>
                          {provider.license_key && (
                            <button
                              onClick={() => handleViewLicense(provider.id)}
                              className="px-3 py-1 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.05] rounded-lg transition-colors"
                            >
                              License
                            </button>
                          )}
                          {provider.license_status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(provider.id, "approved")}
                                disabled={processingId === provider.id}
                                className="px-3 py-1 text-xs text-green-400 hover:bg-green-500/10 rounded-lg disabled:opacity-40 transition-colors"
                                title="Approve"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(provider.id, "rejected")}
                                disabled={processingId === provider.id}
                                className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-40 transition-colors"
                                title="Reject"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditProvider(provider)}
                            disabled={processingId === provider.id}
                            className="px-3 py-1 text-xs text-white/35 hover:text-white/60 hover:bg-white/[0.05] rounded-lg disabled:opacity-40 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* License Viewer Modal */}
        <LicenseViewerModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedLicense(null); }}
          licenseUrl={selectedLicense}
          loading={licenseLoading}
        />

        {/* Edit Provider Modal */}
        {editingProvider && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d1525] border border-white/[0.1] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-[family-name:var(--font-serif)] text-white text-xl font-bold">Edit Provider</h2>
                <button onClick={handleCancelEdit} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <InputField label="Full Name" required>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className={inputCls} placeholder="Provider name" />
                </InputField>
                <InputField label="Years of Experience">
                  <input type="number" min="0" max="60" value={editYearsOfExperience}
                    onChange={(e) => setEditYearsOfExperience(e.target.value)}
                    className={inputCls} placeholder="e.g., 5" />
                </InputField>
                <InputField label="Specialisation" required>
                  <select value={editSpecialisation} onChange={(e) => setEditSpecialisation(e.target.value)}
                    className={inputCls}>
                    <option value="" className="bg-[#0d1525]">Select specialisation</option>
                    {SPECIALISATIONS.map((s) => (
                      <option key={s} value={s} className="bg-[#0d1525]">{s}</option>
                    ))}
                  </select>
                </InputField>
                <InputField label="About">
                  <textarea value={editAbout} onChange={(e) => setEditAbout(e.target.value)}
                    maxLength={500} rows={4}
                    className={`${inputCls} resize-none`}
                    placeholder="Brief description…" />
                  <p className="mt-1 text-xs text-white/25">{editAbout.length}/500</p>
                </InputField>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button onClick={handleCancelEdit}
                  className="px-4 py-2 border border-white/[0.1] text-white/50 rounded-xl text-sm hover:bg-white/[0.05] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={processingId === editingProvider.id}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 disabled:opacity-40 transition-colors">
                  {processingId === editingProvider.id ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Provider Details Modal */}
        {viewingProvider && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d1525] border border-white/[0.1] rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-[family-name:var(--font-serif)] text-white text-2xl font-bold">Provider Profile</h2>
                <button onClick={() => setViewingProvider(null)} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="border-b border-white/[0.07] pb-5">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Basic Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["Full Name",   viewingProvider.full_name],
                      ["Email",       viewingProvider.email],
                      ["Username",    viewingProvider.username || "—"],
                      ["Registered",  new Date(viewingProvider.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-white/30 mb-1">{label}</p>
                        <p className="text-sm text-white">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b border-white/[0.07] pb-5">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Professional Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/30 mb-1">Specialisation</p>
                      <p className="text-sm text-white">{viewingProvider.specialisation || <span className="text-white/20 italic">Not provided</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 mb-1">Experience</p>
                      <p className="text-sm text-white">
                        {viewingProvider.years_of_experience != null
                          ? `${viewingProvider.years_of_experience} years`
                          : <span className="text-white/20 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  {viewingProvider.about && (
                    <div className="mt-4">
                      <p className="text-xs text-white/30 mb-1">About</p>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{viewingProvider.about}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">License</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {statusBadge(viewingProvider.license_status)}
                    {viewingProvider.license_verified_at && (
                      <span className="text-xs text-white/30">
                        Verified {new Date(viewingProvider.license_verified_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
                      </span>
                    )}
                    {viewingProvider.license_key && (
                      <button
                        onClick={() => { setViewingProvider(null); handleViewLicense(viewingProvider.id); }}
                        className="px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs rounded-lg hover:bg-indigo-500/25 transition-colors"
                      >
                        View Document
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.07]">
                <button onClick={() => setViewingProvider(null)}
                  className="px-4 py-2 border border-white/[0.1] text-white/50 rounded-xl text-sm hover:bg-white/[0.05] transition-colors">
                  Close
                </button>
                <button
                  onClick={() => { const p = viewingProvider; setViewingProvider(null); handleEditProvider(p); }}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">
                  Edit Provider
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleProtection>
  );
}
