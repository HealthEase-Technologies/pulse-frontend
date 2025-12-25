"use client";

import { useState, useEffect } from "react";
import { getAllProviders, updateLicenseStatus, getProviderLicenseUrl, updateProvider, deleteProvider } from "@/services/api_calls";
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

  // Delete state
  const [deletingProvider, setDeletingProvider] = useState(null);

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
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError("Provider name cannot be empty");
      return;
    }

    setProcessingId(editingProvider.id);
    setError("");
    try {
      await updateProvider(editingProvider.id, { full_name: editName });
      setEditingProvider(null);
      setEditName("");
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
  };

  const handleDeleteConfirm = (provider) => {
    setDeletingProvider(provider);
  };

  const handleDeleteProvider = async () => {
    setProcessingId(deletingProvider.id);
    setError("");
    try {
      await deleteProvider(deletingProvider.id);
      setDeletingProvider(null);
      await loadProviders();
    } catch (err) {
      setError(err.message || "Failed to delete provider");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingProvider(null);
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
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading providers...</span>
                      </div>
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
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
                        <div className="flex gap-2 justify-end flex-wrap">
                          {provider.license_key && (
                            <button
                              onClick={() => handleViewLicense(provider.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View License
                            </button>
                          )}
                          {provider.license_status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(provider.id, "approved")}
                                disabled={processingId === provider.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(provider.id, "rejected")}
                                disabled={processingId === provider.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditProvider(provider)}
                            disabled={processingId === provider.id}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                            title="Edit Provider"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(provider)}
                            disabled={processingId === provider.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete Provider"
                          >
                            Delete
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Provider</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provider name"
                />
              </div>

              <div className="flex gap-3 justify-end">
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

        {/* Delete Confirmation Modal */}
        {deletingProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h2>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete provider <strong>{deletingProvider.full_name}</strong>?
                This action cannot be undone and will also delete the associated user account.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProvider}
                  disabled={processingId === deletingProvider.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === deletingProvider.id ? "Deleting..." : "Delete Provider"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtection>
  );
}
