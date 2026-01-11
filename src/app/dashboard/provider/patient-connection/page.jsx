"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getPatientToHCP,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPatientDashboardForProvider,
} from "@/services/api_calls";

const CARD_COLORS = {
  heart_rate: "from-rose-50 to-orange-50 border-rose-200",
  blood_pressure_systolic: "from-indigo-50 to-blue-50 border-indigo-200",
  blood_pressure_diastolic: "from-indigo-50 to-blue-50 border-indigo-200",
  glucose: "from-amber-50 to-amber-100 border-amber-200",
  steps: "from-emerald-50 to-teal-50 border-emerald-200",
  sleep: "from-slate-50 to-slate-100 border-slate-200",
  default: "from-gray-50 to-gray-100 border-gray-200",
};

export default function PatientConnections() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // dashboard biomarkers
  const [biomarkers, setBiomarkers] = useState(null);
  const [biomarkersLoading, setBiomarkersLoading] = useState(false);
  const [biomarkersError, setBiomarkersError] = useState("");

  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getPatientToHCP();
      setAllRequests(data.requests || []);
      console.log("Patient connection requests:", data);
    } catch (error) {
      console.error("Error fetching patient requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const loadBiomarkersForPatient = async (patient) => {
    // only load biomarkers if accepted and has id
    if (!patient?.patient_user_id || patient.status !== "accepted") {
      setBiomarkers(null);
      setBiomarkersError("");
      setBiomarkersLoading(false);
      return;
    }

    try {
      setBiomarkersLoading(true);
      setBiomarkersError("");
      const data = await getPatientDashboardForProvider(patient.patient_user_id);

      // ✅ This is what your instructor sentence means: show REAL data (not static)
      console.log("Provider dashboard (biomarkers) for patient:", patient.patient_user_id, data);

      setBiomarkers(data);
    } catch (err) {
      setBiomarkersError(err?.message || "Failed to load biomarkers");
      setBiomarkers(null);
    } finally {
      setBiomarkersLoading(false);
    }
  };

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    setBiomarkers(null);
    setBiomarkersError("");
    setBiomarkersLoading(false);
    await loadBiomarkersForPatient(patient);
  };

  const handleAccept = async (connectionId, patientName) => {
    try {
      await acceptConnectionRequest(connectionId);
      alert(`Connection with ${patientName} accepted!`);
      await fetchRequests();
      setSelectedPatient(null);
    } catch (error) {
      alert(`Failed to accept connection: ${error.message}`);
    }
  };

  const handleReject = async (connectionId, patientName) => {
    try {
      await rejectConnectionRequest(connectionId);
      alert(`Connection with ${patientName} rejected!`);
      await fetchRequests();
      setSelectedPatient(null);
    } catch (error) {
      alert(`Failed to reject connection: ${error.message}`);
    }
  };

  const filteredPatients = allRequests.filter((p) => {
    if (activeTab !== "all" && p.status !== activeTab) return false;
    if (searchTerm && !p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>{config.label}</span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Management</h1>
        <p className="text-gray-600 mb-8">Manage patient connection requests</p>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6 flex gap-2">
          {[
            { key: "all", label: `All (${allRequests.length})` },
            { key: "pending", label: "Pending" },
            { key: "accepted", label: "Accepted" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg font-medium ${
                activeTab === tab.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">PATIENT</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">STATUS</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">REQUESTED</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    {/* ✅ Only NAME is linkable */}
                    <td className="px-6 py-4">
                      <Link
                        href={
                          patient.patient_user_id
                            ? `/dashboard/provider/patient-connection/${patient.patient_user_id}`
                            : "#"
                        }
                        className={`font-medium ${
                          patient.patient_user_id
                            ? "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          if (!patient.patient_user_id) e.preventDefault();
                        }}
                      >
                        {patient.patient_name}
                      </Link>

                      <div className="text-sm text-gray-500">{patient.patient_email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={patient.status} />
                    </td>

                    <td className="px-6 py-4">{formatDate(patient.requested_at)}</td>

                    <td className="px-6 py-4 flex flex-col items-start gap-2">
                      {/* ✅ View Details opens modal */}
                      <button
                        onClick={() => handleViewDetails(patient)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>

                      <Link
                        href={
                          patient.patient_user_id
                            ? `/dashboard/provider/patient-connection/biomarkers/${patient.patient_user_id}`
                            : "#"
                        }
                        className={`font-medium ${
                          patient.status === "accepted" && patient.patient_user_id
                            ? "text-indigo-600 hover:text-indigo-800"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        aria-disabled={patient.status !== "accepted" || !patient.patient_user_id}
                        onClick={(e) => {
                          if (patient.status !== "accepted" || !patient.patient_user_id) {
                            e.preventDefault();
                          }
                        }}
                      >
                        View History
                      </Link>

                      {patient.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(patient.id, patient.patient_name)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(patient.id, patient.patient_name)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No patient connection requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal: shows ACTUAL patient details from request + ACTUAL biomarkers from API */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">Patient Details</h2>
                <button onClick={() => setSelectedPatient(null)} className="text-2xl">
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="font-semibold mb-4 pb-2 border-b">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedPatient.patient_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedPatient.patient_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">
                      {typeof selectedPatient.patient_age === "number" && selectedPatient.patient_age >= 0
                        ? selectedPatient.patient_age
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Requested</p>
                    <p className="font-medium">{formatDate(selectedPatient.requested_at)}</p>
                  </div>
                </div>
              </div>

              {/* Health Goals */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-4 pb-2 border-b">🎯 Health Goals</h3>
                {selectedPatient.patient_health_goals?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPatient.patient_health_goals.map((goal, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span>•</span>
                        <span className="flex-1">{typeof goal === "string" ? goal : goal.goal}</span>
                        {typeof goal === "object" && goal.frequency && (
                          <span className="text-xs text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded">
                            {goal.frequency}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No health goals provided</p>
                )}
              </div>

              {/* Health Restrictions */}
              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                <h3 className="font-semibold mb-4 pb-2 border-b">⚠️ Health Restrictions</h3>
                {selectedPatient.patient_health_restrictions?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPatient.patient_health_restrictions.map((restriction, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span>•</span>
                        <span className="text-orange-700">
                          {typeof restriction === "string" ? restriction : restriction}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No health restrictions provided</p>
                )}
              </div>

              {/* Connection Details */}
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="font-semibold mb-4 pb-2 border-b">Connection Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <StatusBadge status={selectedPatient.status} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Accepted At</p>
                    <p className="font-medium">{formatDate(selectedPatient.accepted_at)}</p>
                  </div>
                </div>
              </div>

              {/* Biomarkers */}
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-semibold mb-4 pb-2 border-b">Current Biomarkers</h3>
                {selectedPatient.status !== "accepted" ? (
                  <p className="text-sm text-gray-600">
                    Biomarkers available after the connection is accepted.
                  </p>
                ) : biomarkersLoading ? (
                  <p className="text-sm text-gray-600">Loading biomarkers...</p>
                ) : biomarkersError ? (
                  <p className="text-sm text-red-700">{biomarkersError}</p>
                ) : !biomarkers ? (
                  <p className="text-sm text-gray-600">No biomarker data available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(biomarkers).map(([key, value]) => {
                      if (!value) return null;

                      // Expecting { value: number|string, unit: string }
                      const metaLabel = key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                      const colors = CARD_COLORS[key] || CARD_COLORS.default;

                      // If API returns something else, skip safely
                      const displayValue =
                        typeof value === "object" && value !== null && "value" in value
                          ? value.value
                          : value;

                      const displayUnit =
                        typeof value === "object" && value !== null && "unit" in value ? value.unit : "";

                      return (
                        <div
                          key={key}
                          className={`rounded-lg border px-3 py-3 bg-gradient-to-br ${colors} shadow-sm`}
                        >
                          <p className="text-xs uppercase tracking-wide text-gray-600">{metaLabel}</p>
                          <p className="text-xl font-semibold text-gray-900">
                            {displayValue} {displayUnit}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleProtection>
  );
}