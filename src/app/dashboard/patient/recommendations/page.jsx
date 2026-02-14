"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMyRecommendations,
  generateRecommendations,
  startRecommendation,
  toggleActionStep,
  completeRecommendation,
  dismissRecommendation,
  submitRecommendationFeedback,
} from "@/services/api_calls";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";

const CATEGORIES = [
  { key: "all", label: "All", icon: "M4 6h16M4 12h16M4 18h16" },
  { key: "nutrition", label: "Nutrition", color: "#22c55e", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { key: "exercise", label: "Exercise", color: "#3b82f6", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { key: "sleep", label: "Sleep", color: "#8b5cf6", icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" },
  { key: "hydration", label: "Hydration", color: "#06b6d4", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" },
  { key: "mental_health", label: "Mental", color: "#14b8a6", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { key: "lifestyle", label: "Lifestyle", color: "#ec4899", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
];

const PRIORITY_COLORS = {
  urgent: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", bar: "bg-red-500" },
  high: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", bar: "bg-orange-500" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", bar: "bg-yellow-500" },
  low: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", bar: "bg-green-500" },
};

const STATUS_BADGES = {
  active: { bg: "bg-blue-100", text: "text-blue-700", label: "New" },
  in_progress: { bg: "bg-indigo-100", text: "text-indigo-700", label: "In Progress" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
  dismissed: { bg: "bg-gray-100", text: "text-gray-500", label: "Dismissed" },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setError("");
      const category = activeCategory === "all" ? null : activeCategory;
      const data = await getMyRecommendations(category);
      if (data && !data.detail) {
        setRecommendations(data.recommendations || []);
        setStats({
          total: data.total_count || 0,
          byCategory: data.by_category || {},
          byPriority: data.by_priority || {},
          byStatus: data.by_status || {},
          urgent: data.urgent_count || 0,
          newCount: data.new_count || 0,
          inProgress: data.in_progress_count || 0,
        });
      }
    } catch (err) {
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await generateRecommendations({ force_regenerate: true, max_recommendations: 5 });
      if (data && !data.detail) {
        await fetchRecommendations();
      } else {
        setError(data?.detail || "Failed to generate recommendations");
      }
    } catch (err) {
      setError("Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  };

  const handleStart = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await startRecommendation(id);
      if (updated && !updated.detail) {
        setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err) {
      setError("Failed to start recommendation");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleStep = async (recId, stepNumber) => {
    setActionLoading((prev) => ({ ...prev, [`${recId}-step-${stepNumber}`]: true }));
    try {
      const updated = await toggleActionStep(recId, stepNumber);
      if (updated && !updated.detail) {
        setRecommendations((prev) => prev.map((r) => (r.id === recId ? updated : r)));
      }
    } catch (err) {
      setError("Failed to update step");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${recId}-step-${stepNumber}`]: false }));
    }
  };

  const handleComplete = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await completeRecommendation(id);
      if (updated && !updated.detail) {
        setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err) {
      setError("Failed to complete recommendation");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDismiss = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await dismissRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError("Failed to dismiss recommendation");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleFeedback = async (id, feedback) => {
    setActionLoading((prev) => ({ ...prev, [`${id}-fb`]: true }));
    try {
      const updated = await submitRecommendationFeedback(id, { feedback });
      if (updated && !updated.detail) {
        setRecommendations((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err) {
      setError("Failed to submit feedback");
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${id}-fb`]: false }));
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Health Insights</h1>
              <p className="text-sm text-gray-500 mt-1">
                Personalized recommendations based on your health data
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate New
                </>
              )}
            </button>
          </div>

          {/* Stats Bar */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">{stats.inProgress || 0}</div>
                <div className="text-xs text-gray-500">In Progress</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-red-600">{stats.urgent || 0}</div>
                <div className="text-xs text-gray-500">Urgent</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.newCount || 0}</div>
                <div className="text-xs text-gray-500">New Today</div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                }`}
              >
                {cat.key !== "all" && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                {cat.label}
                {cat.key !== "all" && stats.byCategory?.[cat.key] > 0 && (
                  <span className="text-xs opacity-70">({stats.byCategory[cat.key]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
              <button onClick={() => setError("")} className="ml-2 font-medium underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-full mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && recommendations.length === 0 && (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Generate personalized health recommendations based on your biomarker data, health goals, and activity patterns.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
              >
                {generating ? "Generating..." : "Generate Recommendations"}
              </button>
            </div>
          )}

          {/* Recommendation Cards */}
          {!loading && recommendations.length > 0 && (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const priority = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium;
                const statusBadge = STATUS_BADGES[rec.status] || STATUS_BADGES.active;
                const catDisplay = rec.category_display || {};
                const progress = rec.progress_percentage || 0;
                const isExpanded = expandedCard === rec.id;
                const steps = rec.action_steps || [];
                const completedSteps = steps.filter((s) => s.completed).length;
                const isCompleted = rec.status === "completed";
                const isInProgress = rec.status === "in_progress";

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-xl border shadow-sm transition-all hover:shadow-md ${
                      isCompleted ? "border-green-200 opacity-75" : priority.border
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Category Icon */}
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: catDisplay.color || "#6b7280" }}
                          >
                            {(catDisplay.label || rec.category || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className={`font-semibold text-gray-900 ${isCompleted ? "line-through" : ""}`}>
                              {rec.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: catDisplay.bg_color || "#f3f4f6",
                                  color: catDisplay.color || "#6b7280",
                                }}
                              >
                                {catDisplay.label || rec.category}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
                                {rec.priority_display?.label || rec.priority}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.label}
                              </span>
                              {rec.is_new && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500 text-white">
                                  NEW
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse */}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : rec.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

                      {/* Progress Bar */}
                      {(isInProgress || isCompleted || progress > 0) && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500 font-medium">Progress</span>
                            <span className={`font-bold ${progress >= 100 ? "text-green-600" : "text-blue-600"}`}>
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {steps.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              {completedSteps} of {steps.length} steps completed
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quick Info Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {rec.effort_minutes_per_day && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {rec.effort_minutes_per_day} min/day
                          </span>
                        )}
                        {rec.frequency && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md capitalize">
                            {rec.frequency.replace("_", " ")}
                          </span>
                        )}
                        {rec.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded-md capitalize ${
                            rec.difficulty === "easy" ? "bg-green-100 text-green-700" :
                            rec.difficulty === "moderate" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {rec.difficulty}
                          </span>
                        )}
                        {rec.time_to_results && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                            Results in {rec.time_to_results}
                          </span>
                        )}
                        {rec.best_time && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                            Best: {rec.best_time}
                          </span>
                        )}
                      </div>

                      {/* Action Steps (always visible for in-progress) */}
                      {steps.length > 0 && (isInProgress || isExpanded) && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Action Steps
                          </h4>
                          <div className="space-y-2">
                            {steps.map((step) => {
                              const stepLoading = actionLoading[`${rec.id}-step-${step.step_number}`];
                              return (
                                <div
                                  key={step.step_number}
                                  className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                                    step.completed ? "bg-green-50" : "bg-white"
                                  }`}
                                >
                                  <button
                                    onClick={() => handleToggleStep(rec.id, step.step_number)}
                                    disabled={stepLoading || isCompleted}
                                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                      step.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-blue-500"
                                    } ${stepLoading ? "opacity-50" : ""}`}
                                  >
                                    {step.completed && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {stepLoading && (
                                      <svg className="w-3 h-3 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${step.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
                                      <span className="font-medium text-gray-500 mr-1">{step.step_number}.</span>
                                      {step.instruction}
                                    </p>
                                    {step.tip && (
                                      <p className="text-xs text-blue-500 mt-0.5 italic">
                                        Tip: {step.tip}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                          {rec.reasoning && (
                            <div className="bg-amber-50 rounded-lg p-3">
                              <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                                Why This Recommendation
                              </h4>
                              <p className="text-sm text-amber-900">{rec.reasoning}</p>
                            </div>
                          )}

                          {rec.expected_benefit && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                                Expected Benefits
                              </h4>
                              <p className="text-sm text-green-900">{rec.expected_benefit}</p>
                            </div>
                          )}

                          {rec.detailed_explanation && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Details
                              </h4>
                              <p className="text-sm text-gray-600">{rec.detailed_explanation}</p>
                            </div>
                          )}

                          {rec.safety_warning && (
                            <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <p className="text-sm text-red-700">{rec.safety_warning}</p>
                            </div>
                          )}

                          {rec.requires_professional_consultation && (
                            <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-blue-700">Consult your healthcare provider before starting this recommendation.</p>
                            </div>
                          )}

                          {/* Feedback Buttons */}
                          {!rec.user_feedback && !isCompleted && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Was this helpful?
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { key: "helpful", label: "Helpful", emoji: "" },
                                  { key: "already_doing", label: "Already doing this", emoji: "" },
                                  { key: "too_difficult", label: "Too difficult", emoji: "" },
                                  { key: "not_applicable", label: "Not relevant", emoji: "" },
                                ].map((fb) => (
                                  <button
                                    key={fb.key}
                                    onClick={() => handleFeedback(rec.id, fb.key)}
                                    disabled={actionLoading[`${rec.id}-fb`]}
                                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                                  >
                                    {fb.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {rec.user_feedback && (
                            <p className="text-xs text-gray-400">
                              Feedback: <span className="capitalize">{rec.user_feedback.replace("_", " ")}</span>
                            </p>
                          )}

                          {rec.disclaimer && (
                            <p className="text-xs text-gray-400 italic">{rec.disclaimer}</p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!isCompleted && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          {rec.status === "active" && (
                            <button
                              onClick={() => handleStart(rec.id)}
                              disabled={actionLoading[rec.id]}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              onClick={() => handleComplete(rec.id)}
                              disabled={actionLoading[rec.id]}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Mark Complete
                            </button>
                          )}

                          <button
                            onClick={() => handleDismiss(rec.id)}
                            disabled={actionLoading[rec.id]}
                            className="flex items-center gap-1.5 px-3 py-2 text-gray-500 text-sm hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors ml-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleProtection>
  );
}
