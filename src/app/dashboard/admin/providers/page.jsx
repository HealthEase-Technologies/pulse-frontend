"use client";

import { useState, useEffect } from "react";
import { getAllProviders, updateLicenseStatus, getProviderLicenseUrl, updateProvider } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import LicenseViewerModal from "@/components/LicenseViewerModal";

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(false);

  // Edit state
  const [editingProvider, setEditingProvider] = useState(null);
  const [editName, setEditName] = useState("");
  const [editYearsOfExperience, setEditYearsOfExperience] = useState("");
  const [editSpecialisation, setEditSpecialisation] = useState("");
  const [editAbout, setEditAbout] = useState("");

  // View details state
  const [viewingProvider, setViewingProvider] = useState(null);

  useEffect(() => {
    loadProviders();
  }, [filter]);

  const loadProviders = async () => {
    setLoading(true);
    setError("");
    try {
      const filterValue = filter === "all" ? null : filter;
      const data = await getAllProviders(filterValue);
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
      // Reload providers after update
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
    setEditYearsOfExperience(provider.years_of_experience !== null && provider.years_of_experience !== undefined ? provider.years_of_experience.toString() : "");
    setEditSpecialisation(provider.specialisation || "");
    setEditAbout(provider.about || "");
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError("Provider name cannot be empty");
      return;
    }

    if (!editSpecialisation.trim()) {
      setError("Specialisation is required");
      return;
    }

    if (editYearsOfExperience !== "" && (parseInt(editYearsOfExperience) < 0 || parseInt(editYearsOfExperience) > 60)) {
      setError("Years of experience must be between 0 and 60");
      return;
    }

    if (editAbout && editAbout.length > 500) {
      setError("About description must be 500 characters or less");
      return;
    }

    setProcessingId(editingProvider.id);
    setError("");
    try {
      const updateData = {
        full_name: editName.trim(),
        specialisation: editSpecialisation.trim(),
        about: editAbout.trim() || null
      };

      if (editYearsOfExperience !== "") {
        updateData.years_of_experience = parseInt(editYearsOfExperience);
      }

      await updateProvider(editingProvider.id, updateData);
      setEditingProvider(null);
      setEditName("");
      setEditYearsOfExperience("");
      setEditSpecialisation("");
      setEditAbout("");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-700 bg-green-100";
      case "pending":
        return "text-yellow-700 bg-yellow-100";
      case "rejected":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.ADMIN]}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Management</h1>
          <p className="text-gray-600">Manage providers, licenses, and provider data</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({providers.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "approved"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === "rejected"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professional Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading providers...</span>
                      </div>
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No providers found
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{provider.full_name}</div>
                          <div className="text-sm text-gray-500">{provider.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {provider.specialisation ? (
                            <>
                              <div className="font-medium text-gray-700">{provider.specialisation}</div>
                              {provider.years_of_experience !== null && provider.years_of_experience !== undefined && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {provider.years_of_experience} years experience
                                </div>
                              )}
                              {provider.about && (
                                <div className="text-xs text-gray-600 mt-1 max-w-xs line-clamp-2" title={provider.about}>
                                  {provider.about}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No details provided</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            provider.license_status
                          )}`}
                        >
                          {provider.license_status || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(provider.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end items-center">
                          <button
                            onClick={() => setViewingProvider(provider)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          >
                            View Details
                          </button>
                          {provider.license_key && (
                            <button
                              onClick={() => handleViewLicense(provider.id)}
                              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                            >
                              License
                            </button>
                          )}
                          {provider.license_status === "pending" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStatusUpdate(provider.id, "approved")}
                                disabled={processingId === provider.id}
                                className="px-3 py-1 text-sm text-green-600 hover:text-green-900 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
                                title="Approve License"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(provider.id, "rejected")}
                                disabled={processingId === provider.id}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                                title="Reject License"
                              >
                                ✗
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => handleEditProvider(provider)}
                            disabled={processingId === provider.id}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
                            title="Edit Provider"
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
          onClose={() => {
            setModalOpen(false);
            setSelectedLicense(null);
          }}
          licenseUrl={selectedLicense}
          loading={licenseLoading}
        />

        {/* Edit Provider Modal */}
        {editingProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Provider Profile</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provider name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={editYearsOfExperience}
                    onChange={(e) => setEditYearsOfExperience(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialisation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editSpecialisation}
                    onChange={(e) => setEditSpecialisation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select specialisation</option>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Brief description about the provider..."
                  />
                  <p className="mt-1 text-xs text-gray-500">{editAbout.length}/500 characters</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={processingId === editingProvider.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === editingProvider.id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Provider Details Modal */}
        {viewingProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Provider Profile</h2>
                <button
                  onClick={() => setViewingProvider(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="mt-1 text-sm text-gray-900">{viewingProvider.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{viewingProvider.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Username</p>
                      <p className="mt-1 text-sm text-gray-900">{viewingProvider.username || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Registered</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(viewingProvider.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Specialisation</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingProvider.specialisation || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Years of Experience</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewingProvider.years_of_experience !== null && viewingProvider.years_of_experience !== undefined
                          ? `${viewingProvider.years_of_experience} years`
                          : <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  {viewingProvider.about && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">About</p>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{viewingProvider.about}</p>
                    </div>
                  )}
                </div>

                {/* License Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">License Status</p>
                      <p className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(viewingProvider.license_status)}`}>
                          {viewingProvider.license_status || "pending"}
                        </span>
                      </p>
                    </div>
                    {viewingProvider.license_verified_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Verified On</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(viewingProvider.license_verified_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  {viewingProvider.license_key && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setViewingProvider(null);
                          handleViewLicense(viewingProvider.id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View License Document
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingProvider(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const provider = viewingProvider;
                    setViewingProvider(null);
                    handleEditProvider(provider);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
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
