"use client";

import { useState, useEffect, useMemo } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getProvidersDirectory,
  sendConnectionToHcp,
  disconnectFromProvider,
  getMyConnections, // ← ADD THIS IMPORT
} from "@/services/api_calls";

export default function HcpDirectory() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingByProviderId, setConnectingByProviderId] = useState({});
  const [disconnectingByProviderId, setDisconnectingByProviderId] = useState({});

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // 1. Fetch providers
        let providers = await getProvidersDirectory();
        console.log("RAW PROVIDER DATA:", providers.providers);
        
        // 2. Fetch connections to get the connection IDs
        let connections = [];
        try {
          connections = await getMyConnections();
          console.log("MY CONNECTIONS:", connections);
        } catch (error) {
          console.error("Error fetching connections:", error);
        }

        // 3. Create a map of provider_email → connection data for easy lookup
        // We use email because provider_id differs between the two APIs
        const connectionMap = {};
        connections.forEach((conn) => {
          console.log("Processing connection:", conn); // Debug log
          connectionMap[conn.provider_email] = {
            connection_id: conn.id, // The connection ID
            status: conn.status,
          };
        });
        console.log("Connection Map (by email):", connectionMap);

        // 4. Merge providers with their connection data using email as the key
        const normalizedProviders = (providers.providers || []).map((p) => {
          const connectionData = connectionMap[p.provider_email]; // Match by email!
          
          console.log(`Provider ${p.provider_name}:`, {
            provider_email: p.provider_email,
            connectionData: connectionData,
            connection_id: connectionData?.connection_id
          }); // Debug log
          
          // Determine the correct status
          let status;
          if (connectionData) {
            // If we found a connection in the connections API, use its status
            status = connectionData.status;
          } else if (p.connection_status === "none" || !p.connection_status) {
            // If no connection exists, mark as disconnected
            status = "disconnected";
          } else {
            // Otherwise use the provider's existing status
            status = p.connection_status;
          }
          
          return {
            ...p,
            connection_status: status,
            connection_id: connectionData?.connection_id || null,
          };
        });
        
        setAllProviders(normalizedProviders);
        console.log("Normalized providers:", normalizedProviders);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const connectedProvider = useMemo(
    () => allProviders.find((p) => p.connection_status === "accepted"),
    [allProviders]
  );
  const hasActiveConnection = !!connectedProvider;
  const connectedProviderId = connectedProvider?.provider_id;

  const handleConnect = async (hcp) => {
    const providerUserId = hcp?.provider_id;
    if (!providerUserId) return;

    if (hasActiveConnection && providerUserId !== connectedProviderId) {
      alert("You are already connected to a provider. Disconnect first to connect to another.");
      return;
    }

    setConnectingByProviderId((prev) => ({ ...prev, [providerUserId]: true }));
    try {
      const res = await sendConnectionToHcp(providerUserId);
      const nextStatus = res?.connection?.status || "pending";

      // Get the connection_id from the response
      const nextConnectionId = res?.connection?.id || null;

      setAllProviders((prev) =>
        prev.map((p) =>
          p.provider_id === providerUserId
            ? {
                ...p,
                connection_status: nextStatus,
                connection_id: nextConnectionId,
              }
            : p
        )
      );

      if (res?.message) alert(res.message);
    } catch (e) {
      alert(e?.message || "Failed to send connection request");
    } finally {
      setConnectingByProviderId((prev) => ({ ...prev, [providerUserId]: false }));
    }
  };

  const handleDisconnect = async (hcp) => {
    const providerUserId = hcp?.provider_id;
    const connectionId = hcp?.connection_id;
    
    console.log("Disconnect clicked for:", { providerUserId, connectionId, hcp });
    
    if (!providerUserId) return;

    if (!connectionId) {
      alert("Missing connection id for this provider. Refresh the page and try again.");
      return;
    }

    setDisconnectingByProviderId((prev) => ({ ...prev, [providerUserId]: true }));
    try {
      const res = await disconnectFromProvider(connectionId);

      setAllProviders((prev) =>
        prev.map((p) =>
          p.provider_id === providerUserId
            ? {
                ...p,
                connection_status: "disconnected",
                connection_id: null,
              }
            : p
        )
      );

      if (res?.message) alert(res.message);
    } catch (e) {
      alert(e?.message || "Failed to disconnect");
    } finally {
      setDisconnectingByProviderId((prev) => ({ ...prev, [providerUserId]: false }));
    }
  };

  const specialties = [...new Set(allProviders.map((p) => p.specialisation))].filter(Boolean);

  const filteredHCPs = allProviders.filter((hcp) => {
    if (activeTab !== "all") {
      if (activeTab === "none" && hcp.connection_status !== "disconnected") return false;
      if (activeTab === "approved" && hcp.connection_status !== "accepted") return false;
      if (activeTab !== "none" && activeTab !== "approved" && hcp.connection_status !== activeTab) return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = hcp.provider_name?.toLowerCase().includes(search);
      const matchesSpecialty = hcp.specialisation?.toLowerCase().includes(search);
      if (!matchesName && !matchesSpecialty) return false;
    }

    if (specialtyFilter !== "all" && hcp.specialisation !== specialtyFilter) return false;

    if (experienceFilter !== "all") {
      const years = hcp.years_of_experience;
      if (experienceFilter === "0-5" && years > 5) return false;
      if (experienceFilter === "6-10" && (years < 6 || years > 10)) return false;
      if (experienceFilter === "11+" && years < 11) return false;
    }

    return true;
  });

  const StatusBadge = ({ status }) => {
    const statusMap = {
      accepted: { color: "bg-green-100 text-green-800", label: "Connected" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      disconnected: { color: "bg-gray-100 text-gray-800", label: "Not Connected" },
      none: { color: "bg-gray-100 text-gray-800", label: "Not Connected" },
    };
    const config = statusMap[status] || statusMap.disconnected;
    return <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>{config.label}</span>;
  };

  const ActionButton = ({ hcp }) => {
    const status = hcp.connection_status;
    const providerUserId = hcp?.provider_id;

    if (status === "accepted") {
      const isDisconnecting = !!disconnectingByProviderId[providerUserId];
      return (
        <button
          onClick={() => handleDisconnect(hcp)}
          disabled={isDisconnecting}
          className={`font-medium ${
            isDisconnecting ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:text-red-800"
          }`}
        >
          {isDisconnecting ? "Disconnecting..." : "Disconnect"}
        </button>
      );
    }

    const isDisconnected = status === "disconnected" || status === "none" || !status;
    if (isDisconnected) {
      const isConnecting = !!connectingByProviderId[providerUserId];
      const isBlockedByExistingConnection = hasActiveConnection && providerUserId !== connectedProviderId;

      const disabled = isConnecting || isBlockedByExistingConnection;

      return (
        <button
          onClick={() => handleConnect(hcp)}
          disabled={disabled}
          title={
            isBlockedByExistingConnection
              ? "Disconnect from your current provider to connect to another."
              : undefined
          }
          className={`font-medium ${
            disabled ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-800"
          }`}
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
      );
    }

    if (status === "pending") return <span className="text-gray-500">Request Pending</span>;
    if (status === "rejected") return <span className="text-red-600 font-medium">Rejected</span>;

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HCP Directory</h1>
        <p className="text-gray-600 mb-8">Browse all the healthcare providers</p>

        {hasActiveConnection && (
          <div className="mb-4 p-4 rounded-lg border bg-blue-50 text-blue-900">
            You are currently connected to <span className="font-semibold">{connectedProvider?.provider_name}</span>.
            To connect to another provider, disconnect first.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Specialties</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Experience Levels</option>
                <option value="0-5">0-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="11+">11+ years</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {[
            { key: "all", label: `All (${allProviders.length})` },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Connected" },
            { key: "none", label: "Not Connected" },
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
                {["Provider", "Specialty", "Experience", "Connection Status", "Actions"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredHCPs.length > 0 ? (
                filteredHCPs.map((hcp) => (
                  <tr key={hcp.provider_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{hcp.provider_name}</div>
                      <div className="text-sm text-gray-500">{hcp.provider_email}</div>
                    </td>
                    <td className="px-6 py-4">{hcp.specialisation || "N/A"}</td>
                    <td className="px-6 py-4">{hcp.years_of_experience || 0} years</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={hcp.connection_status} />
                    </td>
                    <td className="px-6 py-4">
                      <ActionButton hcp={hcp} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No healthcare providers found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RoleProtection>
  );
}