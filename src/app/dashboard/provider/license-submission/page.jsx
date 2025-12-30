"use client";

import { useState, useEffect } from "react";
import { uploadMedicalLicense, getProviderProfile, getLicenseViewUrl } from "@/services/api_calls";
import { useRouter } from "next/navigation";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import LicenseViewerModal from "@/components/LicenseViewerModal";

export default function LicenseSubmissionPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingLicense, setViewingLicense] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [licenseUrl, setLicenseUrl] = useState(null);
  const router = useRouter();

  // New form fields
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data);

      // Populate form fields if data exists
      if (data.years_of_experience !== null && data.years_of_experience !== undefined) {
        setYearsOfExperience(data.years_of_experience.toString());
      }
      if (data.specialisation) {
        setSpecialisation(data.specialisation);
      }
      if (data.about) {
        setAbout(data.about);
      }

      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Failed to load profile:", err);
      // Don't show error if profile just doesn't exist yet (404)
      // User can still upload license which will create the profile
      if (err.message && !err.message.includes("not found") && !err.message.includes("Provider profile not found")) {
        setError("Failed to load profile information");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload JPEG, PNG, or PDF files only.");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess("");

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!specialisation || !specialisation.trim()) {
      setError("Specialisation is required");
      return;
    }

    if (yearsOfExperience !== "" && (parseInt(yearsOfExperience) < 0 || parseInt(yearsOfExperience) > 60)) {
      setError("Years of experience must be between 0 and 60");
      return;
    }

    if (about && about.length > 500) {
      setError("About description must be 500 characters or less");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await uploadMedicalLicense(file, {
        yearsOfExperience: yearsOfExperience !== "" ? parseInt(yearsOfExperience) : null,
        specialisation: specialisation.trim(),
        about: about.trim() || null
      });
      setSuccess("License and profile information uploaded successfully! Your submission is pending review.");
      setFile(null);
      setPreview(null);

      // Reload profile to show updated license status
      await loadProfile();

      // Reset file input
      const fileInput = document.getElementById('license-file');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.message || "Failed to upload license");
    } finally {
      setUploading(false);
    }
  };

  const getLicenseStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleViewLicense = async () => {
    setViewingLicense(true);
    setError("");
    try {
      const result = await getLicenseViewUrl();
      // Open in modal
      setLicenseUrl(result.url);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Failed to view license");
    } finally {
      setViewingLicense(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setLicenseUrl(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PROVIDER]}>
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical License & Profile Submission</h1>
      <p className="text-gray-600 mb-8">
        Complete your provider profile by uploading your medical license and providing your professional details.
      </p>

      {/* Current License Status - Only show if license exists */}
      {!loading && profile?.license_url && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current License Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getLicenseStatusColor(profile.license_status)}`}>
                {profile.license_status?.charAt(0).toUpperCase() + profile.license_status?.slice(1) || 'Unknown'}
              </span>
            </div>
            <div>
              <button
                onClick={handleViewLicense}
                disabled={viewingLicense}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {viewingLicense ? "Loading..." : "View Current License"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First time user - No license yet */}
      {!loading && !profile?.license_url && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">No License Uploaded Yet</h3>
              <p className="text-sm text-blue-700">
                Please upload your medical license to complete your provider profile. Your license will be reviewed by our admin team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {profile?.license_url ? 'Update License & Profile' : 'Upload License & Complete Profile'}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Years of Experience */}
          <div className="mb-6">
            <label
              htmlFor="years-of-experience"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Years of Experience <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              id="years-of-experience"
              type="number"
              min="0"
              max="60"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="e.g., 5"
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter your years of medical experience (0-60)
            </p>
          </div>

          {/* Specialisation */}
          <div className="mb-6">
            <label
              htmlFor="specialisation"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Specialisation <span className="text-red-500">*</span>
            </label>
            <select
              id="specialisation"
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
              required
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select your specialisation</option>
              <option value="General Practice">General Practice</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Surgery">Surgery</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Psychiatry">Psychiatry</option>
              <option value="Radiology">Radiology</option>
              <option value="Anesthesiology">Anesthesiology</option>
              <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
              <option value="Ophthalmology">Ophthalmology</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Other">Other</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Select your medical specialisation
            </p>
          </div>

          {/* About */}
          <div className="mb-6">
            <label
              htmlFor="about"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              About <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Brief description about yourself, your experience, and areas of expertise..."
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              {about.length}/500 characters
            </p>
          </div>

          {/* License Document */}
          <div className="mb-6">
            <label
              htmlFor="license-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              License Document <span className="text-red-500">*</span>
            </label>
            <input
              id="license-file"
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500">
              Accepted formats: JPEG, PNG, PDF. Maximum file size: 10MB
            </p>
          </div>

          {preview && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <img
                  src={preview}
                  alt="License preview"
                  className="max-w-full h-auto max-h-96 mx-auto"
                />
              </div>
            </div>
          )}

          {file && !preview && (
            <div className="mb-6">
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || !specialisation || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Submit License & Profile'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push('/dashboard/provider')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>

      {/* License Viewer Modal */}
      <LicenseViewerModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        licenseUrl={licenseUrl}
        loading={viewingLicense}
      />
    </div>
    </RoleProtection>
  );
}
