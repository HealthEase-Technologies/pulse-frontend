"use client";

import { useState, useEffect } from "react";
import {
  getPatientProfile,
  updatePatientProfile,
  markGoalComplete,
  unmarkGoalComplete,
  getGoalCompletions,
  getGoalStats,
  initializeDailyGoals,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

export default function MyGoalsPage() {
  // Existing states
  const [healthGoals, setHealthGoals] = useState([]);
  const [healthRestrictions, setHealthRestrictions] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [newGoalFrequency, setNewGoalFrequency] = useState("daily");
  const [newRestriction, setNewRestriction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit states
  const [editingGoalIndex, setEditingGoalIndex] = useState(null);
  const [editGoalText, setEditGoalText] = useState("");
  const [editGoalFrequency, setEditGoalFrequency] = useState("daily");
  const [editingRestrictionIndex, setEditingRestrictionIndex] = useState(null);
  const [editRestrictionText, setEditRestrictionText] = useState("");

  // New tracking states
  const [todayCompletions, setTodayCompletions] = useState(new Set());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadGoalsAndTracking();
  }, []);

  const loadGoalsAndTracking = async () => {
    setLoading(true);
    try {
      // Load profile and initialize today's goals
      const profile = await getPatientProfile();

      // Handle both TEXT and JSONB formats
      let goals = profile.health_goals || [];
      if (typeof goals === "string") {
        goals = goals
          .split(",")
          .filter((g) => g.trim())
          .map((g) => ({ goal: g.trim(), frequency: "daily" }));
      } else if (!Array.isArray(goals)) {
        goals = [];
      }
      setHealthGoals(goals);
      setHealthRestrictions(profile.health_restrictions || []);

      // Initialize today's tracking
      await initializeDailyGoals();

      // Load completions and stats
      await loadCompletionsAndStats();
    } catch (err) {
      setError(err.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const loadCompletionsAndStats = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Load completions for today
      const completionsData = await getGoalCompletions();

      // Find today's completed goals
      const todayCompleted = new Set();
      (completionsData.completions || []).forEach((comp) => {
        if (comp.completion_date === today && comp.status === "completed") {
          todayCompleted.add(comp.goal_text);
        }
      });
      setTodayCompletions(todayCompleted);

      // Load stats
      setStatsLoading(true);
      const statsData = await getGoalStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load completions/stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleGoalToggle = async (goalObj) => {
    const { goal, frequency } = goalObj;
    const isCompleted = todayCompletions.has(goal);

    try {
      if (isCompleted) {
        // Unmark as complete
        await unmarkGoalComplete(goal);
        setTodayCompletions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(goal);
          return newSet;
        });
      } else {
        // Mark as complete
        await markGoalComplete(goal, frequency);
        setTodayCompletions((prev) => new Set(prev).add(goal));
      }

      // Reload completions and stats
      await loadCompletionsAndStats();
      setSuccess(
        isCompleted ? "Goal unmarked" : "Great job! Goal completed! 🎉"
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update goal");
    }
  };

  const saveGoals = async (goals, restrictions) => {
    try {
      await updatePatientProfile({
        health_goals: goals,
        health_restrictions: restrictions,
      });

      // Reinitialize today's goals with new goals
      await initializeDailyGoals();
      await loadCompletionsAndStats();
    } catch (err) {
      setError(err.message || "Failed to save goals");
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      const updatedGoals = [
        ...healthGoals,
        { goal: newGoal.trim(), frequency: newGoalFrequency },
      ];
      setHealthGoals(updatedGoals);
      setNewGoal("");
      setNewGoalFrequency("daily");
      saveGoals(updatedGoals, healthRestrictions);
    }
  };

  const removeGoal = (goalObj) => {
    const updatedGoals = healthGoals.filter((g) => g.goal !== goalObj.goal);
    setHealthGoals(updatedGoals);
    saveGoals(updatedGoals, healthRestrictions);
  };

  const startEditGoal = (index) => {
    setEditingGoalIndex(index);
    setEditGoalText(healthGoals[index].goal);
    setEditGoalFrequency(healthGoals[index].frequency);
  };

  const saveEditGoal = () => {
    if (editGoalText.trim()) {
      const updatedGoals = [...healthGoals];
      updatedGoals[editingGoalIndex] = {
        goal: editGoalText.trim(),
        frequency: editGoalFrequency,
      };
      setHealthGoals(updatedGoals);
      setEditingGoalIndex(null);
      setEditGoalText("");
      setEditGoalFrequency("daily");
      saveGoals(updatedGoals, healthRestrictions);
    }
  };

  const cancelEditGoal = () => {
    setEditingGoalIndex(null);
    setEditGoalText("");
    setEditGoalFrequency("daily");
  };

  const addRestriction = () => {
    if (newRestriction.trim()) {
      const updatedRestrictions = [...healthRestrictions, newRestriction.trim()];
      setHealthRestrictions(updatedRestrictions);
      setNewRestriction("");
      saveGoals(healthGoals, updatedRestrictions);
    }
  };

  const removeRestriction = (restriction) => {
    const updatedRestrictions = healthRestrictions.filter((r) => r !== restriction);
    setHealthRestrictions(updatedRestrictions);
    saveGoals(healthGoals, updatedRestrictions);
  };

  const startEditRestriction = (index) => {
    setEditingRestrictionIndex(index);
    setEditRestrictionText(healthRestrictions[index]);
  };

  const saveEditRestriction = () => {
    if (editRestrictionText.trim()) {
      const updatedRestrictions = [...healthRestrictions];
      updatedRestrictions[editingRestrictionIndex] = editRestrictionText.trim();
      setHealthRestrictions(updatedRestrictions);
      setEditingRestrictionIndex(null);
      setEditRestrictionText("");
      saveGoals(healthGoals, updatedRestrictions);
    }
  };

  const cancelEditRestriction = () => {
    setEditingRestrictionIndex(null);
    setEditRestrictionText("");
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Health Goals</h1>
          <p className="text-gray-600">
            Track your daily progress and build healthy habits
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Current Streak</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.current_streak}
                <span className="text-lg text-gray-500 ml-1">days</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Longest Streak</div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.longest_streak}
                <span className="text-lg text-gray-500 ml-1">days</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Completion Rate</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.completion_rate}
                <span className="text-lg text-gray-500 ml-1">%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Completed</div>
              <div className="text-3xl font-bold text-emerald-600">
                {stats.total_completed}
                <span className="text-lg text-gray-500 ml-1">goals</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500 mb-1">Total Missed</div>
              <div className="text-3xl font-bold text-red-600">
                {stats.total_missed}
                <span className="text-lg text-gray-500 ml-1">goals</span>
              </div>
            </div>
          </div>
        )}

        {/* Today's Goals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Goals</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading goals...</span>
            </div>
          ) : healthGoals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No health goals yet. Add your first goal below!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {healthGoals.map((goalObj, index) => (
                <div key={index}>
                  {editingGoalIndex === index ? (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-300 px-4 py-3 rounded-lg">
                      <input
                        type="text"
                        value={editGoalText}
                        onChange={(e) => setEditGoalText(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Edit goal..."
                      />
                      <select
                        value={editGoalFrequency}
                        onChange={(e) => setEditGoalFrequency(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <button
                        onClick={saveEditGoal}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditGoal}
                        className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg hover:shadow-md transition-shadow">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleGoalToggle(goalObj)}
                        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          todayCompletions.has(goalObj.goal)
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-green-500"
                        }`}
                      >
                        {todayCompletions.has(goalObj.goal) && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Goal text */}
                      <div className="flex-1">
                        <span
                          className={`text-lg ${
                            todayCompletions.has(goalObj.goal)
                              ? "line-through text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {goalObj.goal}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 uppercase">
                          {goalObj.frequency}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditGoal(index)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit goal"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeGoal(goalObj)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete goal"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new goal */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Goal</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addGoal()}
                placeholder="e.g., Exercise for 30 minutes"
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
                onClick={addGoal}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>

        {/* Health Restrictions (existing code) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Restrictions</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading restrictions...</span>
            </div>
          ) : healthRestrictions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No health restrictions yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {healthRestrictions.map((restriction, index) => (
                <div key={index}>
                  {editingRestrictionIndex === index ? (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 px-3 py-2 rounded-lg">
                      <input
                        type="text"
                        value={editRestrictionText}
                        onChange={(e) => setEditRestrictionText(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Edit restriction..."
                      />
                      <button
                        onClick={saveEditRestriction}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditRestriction}
                        className="text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg">
                      <span className="text-orange-700">{restriction}</span>
                      <button
                        onClick={() => startEditRestriction(index)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeRestriction(restriction)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new restriction */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Add Health Restriction
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newRestriction}
                onChange={(e) => setNewRestriction(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addRestriction()}
                placeholder="e.g., No dairy products"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addRestriction}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Add Restriction
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleProtection>
  );
}
