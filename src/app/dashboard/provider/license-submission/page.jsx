"use client";

import { useState, useEffect } from "react";
import { uploadMedicalLicense, getProviderProfile, getLicenseViewUrl } from "@/services/api_calls";
import { useRouter } from "next/navigation";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import LicenseViewerModal from "@/components/LicenseViewerModal";

const LICENSE_STATUS = {
  approved: "bg-green-500/10 border-green-500/20 text-green-400",
  pending:  "bg-amber-500/10 border-amber-500/20 text-amber-400",
  rejected: "bg-red-500/10  border-red-500/20  text-red-400",
};

const SPECIALISATIONS = [
  "General Practice", "Cardiology", "Neurology", "Pediatrics", "Surgery",
  "Orthopedics", "Dermatology", "Psychiatry", "Radiology", "Anesthesiology",
  "Obstetrics & Gynecology", "Ophthalmology", "Emergency Medicine", "Internal Medicine", "Other",
];

const inputCls = "w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-colors";
const labelCls = "block text-white/40 text-xs font-semibold uppercase tracking-widest mb-2";

export default function LicenseSubmissionPage() {
  const [file,              setFile]              = useState(null);
  const [preview,           setPreview]           = useState(null);
  const [uploading,         setUploading]         = useState(false);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState("");
  const [profile,           setProfile]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [viewingLicense,    setViewingLicense]    = useState(false);
  const [modalOpen,         setModalOpen]         = useState(false);
  const [licenseUrl,        setLicenseUrl]        = useState(null);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specialisation,    setSpecialisation]    = useState("");
  const [about,             setAbout]             = useState("");
  const router = useRouter();

  const loadProfile = async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data);
      if (data.years_of_experience != null) setYearsOfExperience(data.years_of_experience.toString());
      if (data.specialisation) setSpecialisation(data.specialisation);
      if (data.about) setAbout(data.about);
      setError("");
    } catch (err) {
      if (err.message && !err.message.includes("not found") && !err.message.includes("Provider profile not found")) {
        setError("Failed to load profile information");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(f.type)) { setError("Invalid file type. Please upload JPEG, PNG, or PDF."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File size exceeds 10MB limit."); return; }
    setFile(f); setError(""); setSuccess("");
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file to upload."); return; }
    if (!specialisation?.trim()) { setError("Specialisation is required."); return; }
    if (yearsOfExperience !== "" && (parseInt(yearsOfExperience) < 0 || parseInt(yearsOfExperience) > 60)) {
      setError("Years of experience must be between 0 and 60."); return;
    }
    if (about && about.length > 500) { setError("About description must be 500 characters or less."); return; }

    setUploading(true); setError(""); setSuccess("");
    try {
      await uploadMedicalLicense(file, {
        yearsOfExperience: yearsOfExperience !== "" ? parseInt(yearsOfExperience) : null,
        specialisation: specialisation.trim(),
        about: about.trim() || null,
      });
      setSuccess("License and profile submitted successfully! Pending admin review.");
      setFile(null); setPreview(null);
      const input = document.getElementById("license-file");
      if (input) input.value = "";
      await loadProfile();
    } catch (err) {
      setError(err.message || "Failed to upload license.");
    } finally {
      setUploading(false);
    }
  };

  const handleViewLicense = async () => {
    setViewingLicense(true); setError("");
    try {
      const result = await getLicenseViewUrl();
      setLicenseUrl(result.url);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to view license.");
    } finally {
      setViewingLicense(false);
    }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">Provider</p>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-3xl font-bold">License & Profile</h1>
          <p className="text-white/40 text-sm mt-1">Upload your medical license and complete your professional profile.</p>
        </div>

        {/* Current license status */}
        {!loading && profile?.license_url && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 mb-5 flex items-center justify-between">
            <div>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">Current License</p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${LICENSE_STATUS[profile.license_status] || "bg-white/[0.05] border-white/[0.08] text-white/40"}`}>
                {profile.license_status?.charAt(0).toUpperCase() + profile.license_status?.slice(1) || "Unknown"}
              </span>
            </div>
            <button
              onClick={handleViewLicense}
              disabled={viewingLicense}
              className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
            >
              {viewingLicense ? "Loading…" : "View License"}
            </button>
          </div>
        )}

        {/* No license yet */}
        {!loading && !profile?.license_url && !error && (
          <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.05] p-4 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-white/70 text-sm font-medium">No license uploaded yet</p>
              <p className="text-white/35 text-xs mt-0.5">Upload your medical license to complete your provider profile. It will be reviewed by our admin team.</p>
            </div>
          </div>
        )}

        {/* Upload form */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
          <p className="text-white text-sm font-semibold mb-5 pb-4 border-b border-white/[0.07]">
            {profile?.license_url ? "Update License & Profile" : "Upload License & Complete Profile"}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Years of experience */}
            <div>
              <label htmlFor="years-of-experience" className={labelCls}>
                Years of Experience <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input
                id="years-of-experience"
                type="number" min="0" max="60"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g., 5"
                className={inputCls}
              />
            </div>

            {/* Specialisation */}
            <div>
              <label htmlFor="specialisation" className={labelCls}>
                Specialisation <span className="text-red-400">*</span>
              </label>
              <select
                id="specialisation"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
                required
                className={`${inputCls} appearance-none`}
              >
                <option value="" className="bg-[#0d1525]">Select your specialisation</option>
                {SPECIALISATIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#0d1525]">{s}</option>
                ))}
              </select>
            </div>

            {/* About */}
            <div>
              <label htmlFor="about" className={labelCls}>
                About <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea
                id="about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Brief description about yourself, your experience, and areas of expertise…"
                className={`${inputCls} resize-none`}
              />
              <p className="text-white/20 text-xs mt-1 text-right">{about.length}/500</p>
            </div>

            {/* License file */}
            <div>
              <label htmlFor="license-file" className={labelCls}>
                License Document <span className="text-red-400">*</span>
              </label>
              <label htmlFor="license-file" className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors group">
                <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div className="flex-1 min-w-0">
                  {file ? (
                    <p className="text-white/70 text-sm truncate">{file.name} <span className="text-white/30">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></p>
                  ) : (
                    <p className="text-white/25 text-sm">Click to select file…</p>
                  )}
                  <p className="text-white/20 text-xs mt-0.5">JPEG, PNG, PDF — max 10 MB</p>
                </div>
              </label>
              <input id="license-file" type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange} required className="sr-only" />
            </div>

            {/* Image preview */}
            {preview && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 overflow-hidden">
                <img src={preview} alt="License preview" className="max-h-72 mx-auto rounded-lg object-contain" />
              </div>
            )}

            {/* PDF selected indicator (no preview) */}
            {file && !preview && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03]">
                <svg className="w-8 h-8 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-white/70 text-sm font-medium">{file.name}</p>
                  <p className="text-white/30 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={!file || !specialisation || uploading}
                className="flex-1 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  "Submit License & Profile"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/provider")}
                className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/40 text-sm font-medium hover:bg-white/[0.07] hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

      </div>

      <LicenseViewerModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setLicenseUrl(null); }}
        licenseUrl={licenseUrl}
        loading={viewingLicense}
      />
    </RoleProtection>
  );
}
