"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

export default function PatientOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    date_of_birth: "",
    weight_kg: "",
    height_cm: "",
    health_goals: [],
    health_restrictions: [],
    reminder_frequency: "daily",
    emergency_contacts: [
      { name: "", phone: "", relationship: "" },
      { name: "", phone: "", relationship: "" },
      { name: "", phone: "", relationship: "" }
    ]
  });

  // New goal/restriction input
  const [newGoal, setNewGoal] = useState("");
  const [newGoalFrequency, setNewGoalFrequency] = useState("daily");
  const [newRestriction, setNewRestriction] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmergencyContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergency_contacts];
    updatedContacts[index][field] = value;
    setFormData(prev => ({
      ...prev,
      emergency_contacts: updatedContacts
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      // Check if goal already exists (comparing only goal text)
      const goalExists = formData.health_goals.some(g => g.goal === newGoal.trim());
      if (!goalExists) {
        const newGoalObj = { goal: newGoal.trim(), frequency: newGoalFrequency };
        setFormData(prev => ({
          ...prev,
          health_goals: [...prev.health_goals, newGoalObj]
        }));
        setNewGoal("");
        setNewGoalFrequency("daily");
      }
    }
  };

  const removeGoal = (goalToRemove) => {
    setFormData(prev => ({
      ...prev,
      health_goals: prev.health_goals.filter(g => g.goal !== goalToRemove.goal)
    }));
  };

  const addRestriction = () => {
    if (newRestriction.trim() && !formData.health_restrictions.includes(newRestriction.trim())) {
      setFormData(prev => ({
        ...prev,
        health_restrictions: [...prev.health_restrictions, newRestriction.trim()]
      }));
      setNewRestriction("");
    }
  };

  const removeRestriction = (restriction) => {
    setFormData(prev => ({
      ...prev,
      health_restrictions: prev.health_restrictions.filter(r => r !== restriction)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.date_of_birth || !formData.weight_kg || !formData.height_cm) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (formData.health_goals.length === 0) {
        setError("Please add at least one health goal");
        setLoading(false);
        return;
      }

      // Filter out empty emergency contacts
      const validContacts = formData.emergency_contacts.filter(
        contact => contact.name && contact.phone && contact.relationship
      );

      // Prepare data for submission
      const onboardingData = {
        date_of_birth: formData.date_of_birth,
        weight_kg: parseFloat(formData.weight_kg),
        height_cm: parseFloat(formData.height_cm),
        health_goals: formData.health_goals,
        health_restrictions: formData.health_restrictions,
        reminder_frequency: formData.reminder_frequency,
        emergency_contacts: validContacts
      };

      await completeOnboarding(onboardingData);

      // Redirect to patient dashboard
      router.push("/dashboard/patient");
    } catch (err) {
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Pulse!</h1>
          <p className="text-gray-600">Please complete your profile to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.1"
                  placeholder="70"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  name="height_cm"
                  value={formData.height_cm}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.1"
                  placeholder="170"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Health Goals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Goals *</h2>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                placeholder="Add a health goal (e.g., weight loss, fitness)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newGoalFrequency}
                onChange={(e) => setNewGoalFrequency(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button
                type="button"
                onClick={addGoal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.health_goals.map((goalObj, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md border border-blue-200"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{goalObj.goal}</span>
                    <span className="text-xs text-blue-600 capitalize">{goalObj.frequency}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGoal(goalObj)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Health Restrictions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Restrictions</h2>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newRestriction}
                onChange={(e) => setNewRestriction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRestriction())}
                placeholder="Add a health restriction (e.g., diabetes, allergies)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addRestriction}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.health_restrictions.map((restriction, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-md border border-red-200"
                >
                  <span className="text-sm">{restriction}</span>
                  <button
                    type="button"
                    onClick={() => removeRestriction(restriction)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reminder Frequency */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reminder Preferences</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How often would you like to receive health reminders?
              </label>
              <select
                name="reminder_frequency"
                value={formData.reminder_frequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="none">No reminders</option>
              </select>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">Add up to 3 emergency contacts</p>

            <div className="space-y-4">
              {formData.emergency_contacts.map((contact, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Contact {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => handleEmergencyContactChange(index, "name", e.target.value)}
                      placeholder="Name"
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => handleEmergencyContactChange(index, "phone", e.target.value)}
                      placeholder="Phone"
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={contact.relationship}
                      onChange={(e) => handleEmergencyContactChange(index, "relationship", e.target.value)}
                      placeholder="Relationship"
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "Saving..." : "Complete Onboarding"}
            </button>
          </div>
        </form>
      </div>
    </RoleProtection>
  );
}
