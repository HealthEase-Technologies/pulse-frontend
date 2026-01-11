/**
 * Pulse Health Tracking Application - API Service
 *
 * This module provides a centralized service for all API calls to the Pulse backend.
 * Includes automatic authentication token handling and logout on unauthorized access.
 *
 * Environment:
 * - BASE_URL: Configured via NEXT_PUBLIC_API_URL (defaults to http://localhost:8000)
 *
 * Authentication:
 * - All authenticated endpoints require 'access-token' JWT stored in localStorage
 * - Automatic logout on 401/403 responses with redirect to /login
 * - Token is automatically included in request headers
 *
 * Features:
 * - Centralized error handling
 * - Automatic authentication management
 * - Type-safe API calls with JSDoc documentation
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Handles automatic logout when receiving 401/403 status codes
 * Clears all auth data from localStorage and redirects to login
 */
const handleUnauthorized = () => {
  // Clear all authentication data
  localStorage.clear();

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Base headers for unauthenticated requests
 * @returns {Object} Headers object
 */
const getBaseHeaders = () => ({
  "Content-Type": "application/json",
});

/**
 * Headers with authentication token for protected endpoints
 * @returns {Object} Headers object with access token
 */
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("access-token") || ""}`,
});

/**
 * Centralized fetch wrapper for authenticated requests
 * Automatically handles 401/403 responses and logs out the user
 *
 * @param {string} url - The endpoint URL
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If the request fails or user is unauthorized
 */
const authenticatedFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // Check for unauthorized access
    if (response.status === 401 || response.status === 403) {
      console.warn('Unauthorized access detected. Logging out...');
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  } catch (error) {
    // If it's a network error and not our custom unauthorized error, rethrow
    if (error.message !== 'Session expired. Please log in again.') {
      throw error;
    }
    throw error;
  }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Registers a new user in the Pulse database after Cognito signup
 * @param {Object} userData User registration data
 * @param {string} userData.cognito_id Cognito user ID
 * @param {string} userData.username Username
 * @param {string} userData.email Email address
 * @param {string} userData.full_name Full name
 * @param {string} userData.role User role (patient, provider, admin)
 * @returns {Promise<Object>} Registered user data
 * @throws {Error} If registration fails
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/users/register`, {
      method: "POST",
      headers: getBaseHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    const data = await response.json();
    console.log("User registered:", data);
    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Verifies the current authentication token
 * @returns {Promise<Object>} Token verification result
 * @throws {Error} If token is invalid
 */
export const verifyToken = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/auth/verify`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Token verification failed");
    }

    const data = await response.json();
    console.log("Token verified:", data);
    return data;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

/**
 * Gets current user information
 * @returns {Promise<Object>} Current user data
 * @throws {Error} If request fails
 */
export const getCurrentUser = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/auth/me`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get user info");
    }

    const data = await response.json();
    console.log("Current user:", data);
    return data;
  } catch (error) {
    console.error("Get current user error:", error);
    throw error;
  }
};

export const acceptConnectionRequest = async (connectionId) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/connections/${connectionId}/accept`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to accept connection request");
    }

    const data = await response.json();
    console.log("Connection accepted:", data);
    return data;
  } catch (error) {
    console.error("Accept connection error:", error);
    throw error;
  }
};

export const rejectConnectionRequest = async (connectionId) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/connections/${connectionId}/reject`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to reject connection request");
    }

    const data = await response.json();
    console.log("Connection rejected:", data);
    return data;
  } catch (error) {
    console.error("Reject connection error:", error);
    throw error;
  }
};

export const disconnectFromProvider = async (connectionId) => {
  try {
    // Note: The Swagger image shows DELETE, so we use DELETE instead of PATCH
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/connections/${connectionId}`, {
      method: "DELETE", 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to disconnect from provider");
    }

    // Some DELETE endpoints return 204 (No Content), so we check before parsing JSON
    return response.status === 204 ? { success: true } : await response.json();
  } catch (error) {
    console.error("Disconnect error:", error);
    throw error;
  }
};

//add this NEW function (keep your disconnectFromProvider as is!)
export const getMyConnections = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/connections/my-connections`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch connections");
    }

    const data = await response.json();
    return data.connections; // Returns array of connections with IDs
  } catch (error) {
    console.error("Error fetching connections:", error);
    throw error;
  }
};
// ============================================================================
// PATIENT ENDPOINTS
// ============================================================================

/**
 * Gets the current patient's profile
 * @returns {Promise<Object>} Patient profile data
 * @throws {Error} If request fails
 */
export const getPatientProfile = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/profile`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get patient profile");
    }

    const data = await response.json();
    console.log("Patient profile:", data);
    return data;
  } catch (error) {
    console.error("Get patient profile error:", error);
    throw error;
  }
};

/**
 * Checks if patient has completed onboarding
 * @returns {Promise<Object>} Onboarding status with profile data
 * @throws {Error} If request fails
 */
export const checkOnboardingStatus = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/onboarding/status`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to check onboarding status");
    }

    const data = await response.json();
    console.log("Onboarding status:", data);
    return data;
  } catch (error) {
    console.error("Check onboarding status error:", error);
    throw error;
  }
};

/**
 * Completes patient onboarding with health information
 * @param {Object} onboardingData Onboarding data
 * @param {string} onboardingData.date_of_birth Date of birth (YYYY-MM-DD)
 * @param {number} onboardingData.height_cm Height in centimeters
 * @param {number} onboardingData.weight_kg Weight in kilograms
 * @param {Array<Object>} onboardingData.health_goals List of health goals
 * @param {Array<string>} onboardingData.health_restrictions Health restrictions
 * @param {string} onboardingData.reminder_frequency Reminder frequency
 * @param {Array<Object>} onboardingData.emergency_contacts Emergency contacts (max 3)
 * @returns {Promise<Object>} Updated profile data
 * @throws {Error} If request fails
 */
export const completeOnboarding = async (onboardingData) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/onboarding/complete`, {
      method: "POST",
      body: JSON.stringify(onboardingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to complete onboarding");
    }

    const data = await response.json();
    console.log("Onboarding completed:", data);
    return data;
  } catch (error) {
    console.error("Complete onboarding error:", error);
    throw error;
  }
};

/**
 * Updates patient profile information
 * @param {Object} updateData Partial profile update data
 * @returns {Promise<Object>} Updated profile data
 * @throws {Error} If request fails
 */
export const updatePatientProfile = async (updateData) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/profile`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update profile");
    }

    const data = await response.json();
    console.log("Profile updated:", data);
    return data;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

/**
 * Marks a health goal as completed for a specific date
 * @param {string} goalText Goal description
 * @param {string} goalFrequency Goal frequency (daily, weekly, monthly)
 * @param {string} [completionDate] Completion date (YYYY-MM-DD), defaults to today
 * @returns {Promise<Object>} Completion record
 * @throws {Error} If request fails
 */
export const markGoalComplete = async (goalText, goalFrequency, completionDate = null) => {
  try {
    const params = new URLSearchParams({
      goal_text: goalText,
      goal_frequency: goalFrequency,
    });

    if (completionDate) {
      params.append('completion_date', completionDate);
    }

    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/goals/complete?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to mark goal complete");
    }

    const data = await response.json();
    console.log("Goal marked complete:", data);
    return data;
  } catch (error) {
    console.error("Mark goal complete error:", error);
    throw error;
  }
};

/**
 * Unmarks a goal completion
 * @param {string} goalText Goal description
 * @param {string} [completionDate] Completion date (YYYY-MM-DD), defaults to today
 * @returns {Promise<Object>} Result
 * @throws {Error} If request fails
 */
export const unmarkGoalComplete = async (goalText, completionDate = null) => {
  try {
    const params = new URLSearchParams({
      goal_text: goalText,
    });

    if (completionDate) {
      params.append('completion_date', completionDate);
    }

    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/goals/uncomplete?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to unmark goal");
    }

    const data = await response.json();
    console.log("Goal unmarked:", data);
    return data;
  } catch (error) {
    console.error("Unmark goal error:", error);
    throw error;
  }
};

/**
 * Gets goal completion history for a date range
 * @param {string} [startDate] Start date (YYYY-MM-DD)
 * @param {string} [endDate] End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Completions data with total count
 * @throws {Error} If request fails
 */
export const getGoalCompletions = async (startDate = null, endDate = null) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = params.toString()
      ? `${BASE_URL}/api/v1/patients/goals/completions?${params.toString()}`
      : `${BASE_URL}/api/v1/patients/goals/completions`;

    const response = await authenticatedFetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get goal completions");
    }

    const data = await response.json();
    console.log("Goal completions:", data);
    return data;
  } catch (error) {
    console.error("Get goal completions error:", error);
    throw error;
  }
};

/**
 * Gets goal completion statistics
 * @returns {Promise<Object>} Statistics data
 * @throws {Error} If request fails
 */
export const getGoalStats = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/goals/stats`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get goal stats");
    }

    const data = await response.json();
    console.log("Goal stats:", data);
    return data;
  } catch (error) {
    console.error("Get goal stats error:", error);
    throw error;
  }
};

/**
 * Initializes daily goals based on user's health goals
 * @returns {Promise<Object>} Created goals
 * @throws {Error} If request fails
 */
export const initializeDailyGoals = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/patients/goals/initialize`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to initialize daily goals");
    }

    const data = await response.json();
    console.log("Daily goals initialized:", data);
    return data;
  } catch (error) {
    console.error("Initialize daily goals error:", error);
    throw error;
  }
};


export const getProvidersDirectory = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/providers/directory`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to initialize daily goals");
    }

    const data = await response.json();
    console.log("Directory data:", data);
    return data;
  } catch (error) {
    console.error("Get providers directory error:", error);
    throw error;
  }
};
// ============================================================================
// HCP PROVIDER CONNECTION ENDPOINTS
// ============================================================================
export const sendConnectionToHcp = async (providerUserId) => {
  try {
    if (!providerUserId) {
      throw new Error("Provider user id is required");
    }

    const params = new URLSearchParams({ provider_user_id: providerUserId });

    const response = await authenticatedFetch(`${BASE_URL}/api/v1/connections/request?${params.toString()}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to send connection request to HCP");
    }

    const data = await response.json();
    console.log("Send connection request response:", data);
    return data;
  } catch (error) {
    console.error("Send connection request error:", error);
    throw error;
  }
};

//getting devices available for monitoring patients
export const getDevices = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/devices/types`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch devices");
    }

    const data = await response.json();
    console.log("Get devices response:", data);
    return data;
  } catch (error) {
    console.error("Get devices error:", error);
    throw error;
  }
};

//getting user's connected devices
export const getMyDevices = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/devices/my-devices`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch my devices");
    }

    const data = await response.json();
    console.log("Get my devices response:", data);
    return data;
  } catch (error) {
    console.error("Get my devices error:", error);
    throw error;
  }
};

//connecting a device
export const connectDevice = async ({ deviceType, deviceName }) => {
  try {
    const payload = {
      device_type: deviceType,
      device_name: deviceName,
    };

    console.log("CONNECT payload:", payload);

    const response = await authenticatedFetch(`${BASE_URL}/api/v1/devices/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.log("CONNECT error response:", data);
      throw new Error(data.detail || "Failed to connect device");
    }

    return data;
  } catch (error) {
    console.error("Connect device error:", error);
    throw error;
  }
};

//disconnecting a device
export const disconnectDevice = async (deviceId) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/devices/${deviceId}/disconnect`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to disconnect device");
    }

    const data = await response.json();
    console.log("Disconnect device response:", data);
    return data;
  } catch (error) {
    console.error("Disconnect device error:", error);
    throw error;
  }
};

//get specific device details
export const getDeviceDetails = async (deviceId) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/devices/${deviceId}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch device details");
    }

    const data = await response.json();
    console.log("Get device details response:", data);
    return data;
  } catch (error) {
    console.error("Get device details error:", error);
    throw error;
  }
};

//simulate device data for testing/demo
export const simulateDeviceData = async (deviceId, daysOfHistory = 1) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/devices/${deviceId}/simulate-data`, {
      method: "POST",
      body: JSON.stringify({ days_of_history: daysOfHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to simulate device data");
    }

    const data = await response.json();
    console.log("Simulate device data response:", data);
    return data;
  } catch (error) {
    console.error("Simulate device data error:", error);
    throw error;
  }
};
//sets biomarker ranges
export const getBiomarkerRanges = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/biomarkers/ranges`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch biomarker ranges");
    }

    const data = await response.json();
    console.log("Get biomarker ranges response:", data);
    return data;
  } catch (error) {
    console.error("Get biomarker ranges error:", error);
    throw error;
  }
};
//gets biomarker dashboard summary
export const getBiomarkerDashboard = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/biomarkers/dashboard`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch biomarker dashboard");
    }

    const data = await response.json();
    console.log("Get biomarker dashboard response:", data);
    return data;
  } catch (error) {
    console.error("Get biomarker dashboard error:", error);
    throw error;
  }
};
//gets biomarker history for a specific biomarker type
export const getBiomarkerHistory = async (biomarkerType, { limit = 100, offset = 0 } = {}) => {
  if (!biomarkerType) {
    throw new Error("biomarkerType is required to fetch biomarker history");
  }

  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/biomarkers/history/${encodeURIComponent(biomarkerType)}?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch biomarker history");
    }

    const data = await response.json();
    console.log("Get biomarker history response:", data);
    return data;
  } catch (error) {
    console.error("Get biomarker history error:", error);
    throw error;
  }
};
// gets all biomarkers
export const getAllBiomarkers = async ({ limit = 100, offset = 0 } = {}) => {
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/biomarkers/all?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch biomarker all");
    }

    const data = await response.json();
    console.log("Get biomarker all response:", data);
    return data;
  } catch (error) {
    console.error("Get biomarker all error:", error);
    throw error;
  }
};

// inserts new biomarker data
export const insertBiomarkerData = async (biomarkerData) => {
  try {
    const payload = { ...biomarkerData };

    if (!payload.device_id) {
      const devicesData = await getMyDevices();
      const devices = Array.isArray(devicesData) ? devicesData : (devicesData.devices || []);
      
      if (devices.length > 0) {
        payload.device_id = devices[0].id;
      }
    }

    const response = await authenticatedFetch(`${BASE_URL}/api/v1/biomarkers/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to insert biomarker data");
    }

    const data = await response.json();
    console.log("Insert biomarker data response:", data);
    return data;
  } catch (error) {
    console.error("Insert biomarker data error:", error);
    throw error;
  }
};

/**
 * PATIENT - Get notes written about the current patient by their healthcare provider
 */
export const getMyDoctorNotes = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/notes/my-notes`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get doctor notes");
    }

    const data = await response.json();
    console.log("Doctor notes:", data);
    return data;
  } catch (error) {
    console.error("Get doctor notes error:", error);
    throw error;
  }
};

// ============================================================================
// PROVIDER ENDPOINTS
// ============================================================================

/**
 * Gets the current provider's profile
 * @returns {Promise<Object>} Provider profile data
 * @throws {Error} If request fails
 */
export const getProviderProfile = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/providers/profile`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get provider profile");
    }

    const data = await response.json();
    console.log("Provider profile:", data);
    return data;
  } catch (error) {
    console.error("Get provider profile error:", error);
    throw error;
  }
};

/**
 * Uploads medical license document with provider details
 * @param {File} file License file (image or PDF, max 10MB)
 * @param {Object} providerDetails Provider information
 * @param {number} [providerDetails.yearsOfExperience] Years of experience (0-60)
 * @param {string} providerDetails.specialisation Medical specialisation
 * @param {string} [providerDetails.about] Short description (max 500 chars)
 * @returns {Promise<Object>} Upload result with license URL
 * @throws {Error} If upload fails
 */
export const uploadMedicalLicense = async (file, providerDetails = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add provider details to FormData
    if (providerDetails.yearsOfExperience !== null && providerDetails.yearsOfExperience !== undefined && providerDetails.yearsOfExperience !== "") {
      formData.append('years_of_experience', providerDetails.yearsOfExperience.toString());
    }
    if (providerDetails.specialisation) {
      formData.append('specialisation', providerDetails.specialisation);
    }
    if (providerDetails.about) {
      formData.append('about', providerDetails.about);
    }

    // For file uploads, we need to manually handle the fetch to avoid setting Content-Type
    // The browser must set Content-Type with the proper multipart/form-data boundary
    const token = localStorage.getItem("access-token") || "";
    const response = await fetch(`${BASE_URL}/api/v1/providers/upload-license`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        // DO NOT set Content-Type - let browser set it with boundary
      },
      body: formData,
    });

    // Handle unauthorized manually since we're not using authenticatedFetch
    if (response.status === 401 || response.status === 403) {
      console.warn('Unauthorized access detected. Logging out...');
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Failed to upload license" }));
      throw new Error(errorData.detail || "Failed to upload license");
    }

    const data = await response.json();
    console.log("License uploaded:", data);
    return data;
  } catch (error) {
    console.error("Upload license error:", error);
    throw error;
  }
};

/**
 * Gets presigned URL to view provider's own uploaded license
 * @returns {Promise<Object>} Presigned URL data
 * @throws {Error} If request fails
 */
export const getProviderOwnLicenseUrl = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/providers/license-url`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get license URL");
    }

    const data = await response.json();
    console.log("License URL:", data);
    return data;
  } catch (error) {
    console.error("Get license URL error:", error);
    throw error;
  }
};

//gets patient to HCP connection requests
export const getPatientToHCP = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/connections/requests`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to receive patient request");
    }

    const data = await response.json();
    console.log("Patient to HCP requests:", data);
    return data;
  } catch (error) {
    console.error("Get patient to HCP requests error:", error);
    throw error;
  }
};

//gets biomarker dashboard summary for a specific patient
export const getPatientDashboardForProvider = async (patientUserId) => {
  if (!patientUserId) throw new Error("patientUserId is required");
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/biomarkers/patient/${encodeURIComponent(patientUserId)}/dashboard`,
      { method: "GET" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get patient dashboard");
    }

    const data = await response.json();
    console.log("Patient dashboard:", data);
    return data;
  } catch (error) {
    console.error("Get patient dashboard error:", error);
    throw error;
  }
};

//gets biomarker history for a specific patient and biomarker type
export const getPatientHistoryForProvider = async (patientUserId, biomarkerType, { limit = 100, offset = 0 } = {}) => {
  if (!patientUserId) throw new Error("patientUserId is required");
  if (!biomarkerType) throw new Error("biomarkerType is required");
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/biomarkers/patient/${encodeURIComponent(patientUserId)}/history/${encodeURIComponent(biomarkerType)}?${params.toString()}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get patient history");
    }

    const data = await response.json();
    console.log("Patient history:", data);
    return data;
  } catch (error) {
    console.error("Get patient history error:", error);
    throw error;
  }
};

//gets notes for a specific patient
export const getPatientNotes = async (patientUserId) => {
  if (!patientUserId) throw new Error("patientUserId is required");
  
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/notes/patient/${encodeURIComponent(patientUserId)}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get patient notes");
    }

    const data = await response.json();
    console.log("Patient notes:", data);
    return data;
  } catch (error) {
    console.error("Get patient notes error:", error);
    throw error;
  }
};

//creates a new patient note
export const createPatientNote = async (patientUserId, noteData) => {
  if (!patientUserId) throw new Error("patientUserId is required");
  
  try {
    const payload = {
      patient_id: patientUserId,
      content: noteData.content,
    };
    
    //only add note_type if it's provided
    if (noteData.note_type) {
      payload.note_type = noteData.note_type;
    }
    
    console.log("Creating note with payload:", payload);
    
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/notes/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Create note error response:", errorData);
      throw new Error(errorData.detail || "Failed to create note");
    }

    const data = await response.json();
    console.log("Note created:", data);
    return data;
  } catch (error) {
    console.error("Create note error:", error);
    throw error;
  }
};

//updates existing patient note
export const updatePatientNote = async (noteId, noteData) => {
  if (!noteId) throw new Error("noteId is required");
  
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/notes/${encodeURIComponent(noteId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          content: noteData.content,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update note");
    }

    const data = await response.json();
    console.log("Note updated:", data);
    return data;
  } catch (error) {
    console.error("Update note error:", error);
    throw error;
  }
};

//deletes a patient note
export const deletePatientNote = async (noteId) => {
  if (!noteId) throw new Error("noteId is required");
  
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/notes/${encodeURIComponent(noteId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete note");
    }

    return response.status === 204 ? { success: true } : await response.json();
  } catch (error) {
    console.error("Delete note error:", error);
    throw error;
  }
};

//marks a note as read
export const markNoteAsRead = async (noteId) => {
  if (!noteId) throw new Error("noteId is required");
  
  try {
    const response = await authenticatedFetch(
      `${BASE_URL}/api/v1/notes/${encodeURIComponent(noteId)}/mark-read`,
      { method: "PATCH" }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to mark note as read");
    }

    const data = await response.json();
    console.log("Note marked as read:", data);
    return data;
  } catch (error) {
    console.error("Mark note as read error:", error);
    throw error;
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Gets all users in the system (Admin only)
 * @returns {Promise<Object>} Users list with total count
 * @throws {Error} If request fails
 */
export const getAllUsers = async () => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/admins/users`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get users");
    }

    const data = await response.json();
    console.log("All users:", data);
    return data;
  } catch (error) {
    console.error("Get all users error:", error);
    throw error;
  }
};

/**
 * Gets all providers with optional license status filter (Admin only)
 * @param {string} [licenseStatus] Filter by license status (pending, approved, rejected)
 * @returns {Promise<Object>} Providers list with total count
 * @throws {Error} If request fails
 */
export const getAllProviders = async (licenseStatus = null) => {
  try {
    const url = licenseStatus
      ? `${BASE_URL}/api/v1/admins/providers?license_status=${licenseStatus}`
      : `${BASE_URL}/api/v1/admins/providers`;

    const response = await authenticatedFetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get providers");
    }

    const data = await response.json();
    console.log("All providers:", data);
    return data;
  } catch (error) {
    console.error("Get all providers error:", error);
    throw error;
  }
};

/**
 * Updates provider's license status (Admin only)
 * @param {string} providerId Provider ID
 * @param {string} status New status (approved or rejected)
 * @returns {Promise<Object>} Updated provider data
 * @throws {Error} If request fails
 */
export const updateProviderLicenseStatus = async (providerId, status) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/admins/providers/${providerId}/license-status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update license status");
    }

    const data = await response.json();
    console.log("License status updated:", data);
    return data;
  } catch (error) {
    console.error("Update license status error:", error);
    throw error;
  }
};

/**
 * Gets presigned URL for viewing a provider's license (Admin only)
 * @param {string} providerId Provider ID
 * @returns {Promise<Object>} Presigned URL data
 * @throws {Error} If request fails
 */
export const getProviderLicenseUrlAdmin = async (providerId) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/admins/providers/${providerId}/license-url`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get license URL");
    }

    const data = await response.json();
    console.log("Provider license URL:", data);
    return data;
  } catch (error) {
    console.error("Get provider license URL error:", error);
    throw error;
  }
};

/**
 * Updates provider profile data (Admin only)
 * @param {string} providerId Provider ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated provider data
 * @throws {Error} If request fails
 */
export const updateProvider = async (providerId, updateData) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/admins/providers/${providerId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update provider");
    }

    const data = await response.json();
    console.log("Provider updated:", data);
    return data;
  } catch (error) {
    console.error("Update provider error:", error);
    throw error;
  }
};

/**
 * Deletes a provider (Admin only)
 * @param {string} providerId Provider ID
 * @returns {Promise<Object>} Deletion result
 * @throws {Error} If request fails
 */
export const deleteProvider = async (providerId) => {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/v1/admins/providers/${providerId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete provider");
    }

    const data = await response.json();
    console.log("Provider deleted:", data);
    return data;
  } catch (error) {
    console.error("Delete provider error:", error);
    throw error;
  }
};

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
// These aliases ensure existing code continues to work with the new API

/**
 * Alias for getAllUsers (backward compatibility)
 * @deprecated Use getAllUsers instead
 */
export const getAllUsersAdmin = getAllUsers;

/**
 * Alias for updateProviderLicenseStatus (backward compatibility)
 * @deprecated Use updateProviderLicenseStatus instead
 */
export const updateLicenseStatus = updateProviderLicenseStatus;

/**
 * Backward compatibility alias - for admin pages to get a provider's license URL
 * This version takes a providerId parameter (admin use case)
 */
export const getProviderLicenseUrl = getProviderLicenseUrlAdmin;

/**
 * Backward compatibility alias - for provider pages to get their own license URL
 * This version takes no parameters (provider use case - gets current user's license)
 */
export const getLicenseViewUrl = getProviderOwnLicenseUrl;
