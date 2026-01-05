"use client";

import { useState, useEffect } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import { getPatientToHCP, acceptConnectionRequest, rejectConnectionRequest } from "@/services/api_calls";

export default function PatientConnections() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
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
    if (searchTerm && !p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    };
    const config = statusMap[status] || statusMap.pending;
    return <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
                    <td className="px-6 py-4">
                      <div className="font-medium">{patient.patient_name}</div>
                      <div className="text-sm text-gray-500">{patient.patient_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-6 py-4">{formatDate(patient.requested_at)}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
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

      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">Patient Details</h2>
                <button onClick={() => setSelectedPatient(null)} className="text-2xl">×</button>
              </div>
            </div>

            <div className="p-6 space-y-6">
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
                    <p className="font-medium">{calculateAge(selectedPatient.patient_date_of_birth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Requested</p>
                    <p className="font-medium">{formatDate(selectedPatient.requested_at)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold mb-4 pb-2 border-b">🎯 Health Goals</h3>
                {selectedPatient.patient_health_goals?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPatient.patient_health_goals.map((goal, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span>•</span>
                        <span className="flex-1">
                          {typeof goal === 'string' ? goal : goal.goal}
                        </span>
                        {typeof goal === 'object' && goal.frequency && (
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

              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="font-semibold mb-4 pb-2 border-b">Connection Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <StatusBadge status={selectedPatient.status} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Accepted At</p>
                    <p className="font-medium">{formatDate(selectedPatient.accepted_at) || "Not yet accepted"}</p>
                  </div>
                </div>
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