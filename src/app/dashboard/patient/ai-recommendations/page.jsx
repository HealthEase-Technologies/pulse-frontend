"use client";

import { useEffect, useMemo, useState } from "react";
import RoleProtection from "@/components/RoleProtection";
import { USER_ROLES } from "@/hooks/useUserRole";
import {
  getActiveRecommendations,
  getPatientProfile,
  getGoalCompletions,
  getBiomarkerDashboard,
  submitRecommendationFeedback,
  dismissRecommendation,
  getRecommendationById,
} from "@/services/api_calls";

const REFERENCE_RANGES = {
  blood_pressure_diastolic: {
    unit: "mmHg",
    optimal: [60, 80],
    normal: [80, 90],
    critical_low: [null, 40],
    critical_high: [120, null],
  },
  blood_pressure_systolic: {
    unit: "mmHg",
    optimal: [90, 120],
    normal: [90, 140],
    critical_low: [70, null],
    critical_high: [180, null],
  },
  glucose: {
    unit: "mg/dL",
    optimal: [70, 100],
    normal: [70, 140],
    critical_low: [54, null],
    critical_high: [200, null],
  },
  heart_rate: {
    unit: "bpm",
    optimal: [60, 80],
    normal: [60, 100],
    critical_low: [40, null],
    critical_high: [120, null],
  },
  sleep: {
    unit: "hours",
    optimal: [7, 9],
    normal: [6, 10],
    critical_low: [4, null],
    critical_high: [14, null],
  },
  steps: {
    unit: "steps",
    optimal: [7000, 10000],
    normal: [5000, 15000],
    critical_low: [0, null],
    critical_high: [50000, null],
  },
};

const categorizeRecommendation = (rec) => {
  const hint = String(rec?.type || rec?.category || rec?.recommendation_type || rec?.source || "").toLowerCase();

  if (rec?.biomarker || rec?.biomarker_type || hint.includes("biomarker")) return "biomarker";
  if (rec?.goal || rec?.goal_id || hint.includes("goal")) return "goal";
  return "other";
};

const buildGoalRecommendation = (goalObj) => {
  const goalText = goalObj?.goal || "Your goal";
  const freq = (goalObj?.frequency || "daily").toLowerCase();

  let suggestion = "Break this goal into small, trackable steps and schedule them on your calendar.";
  if (freq === "daily") {
    suggestion = "Schedule a consistent daily time, set a reminder, and keep each session 10-20 minutes to build the habit.";
  } else if (freq === "weekly") {
    suggestion = "Plan 2-3 focused sessions this week, block time in advance, and review progress every Sunday.";
  } else if (freq === "monthly") {
    suggestion = "Set a mid-month checkpoint, track weekly milestones, and adjust intensity based on energy levels.";
  }

  return {
    id: `goal-${goalText}`,
    title: `Goal: ${goalText}`,
    description: suggestion,
    goal: goalText,
    frequency: freq,
    source: "goal",
    isDerived: true,
  };
};

const buildBiomarkerRecommendation = (bm, refRange) => {
  const name = bm?.name || bm?.type || bm?.biomarker_type || "Biomarker";
  const value = bm?.value;
  const unit = bm?.unit ? ` ${bm.unit}` : "";
  const status = bm?.status || "";
  const normalizedName = normalizeType(name);

  // Get reference range for context
  const ref = refRange || REFERENCE_RANGES[normalizedName];
  const optimalRange = ref?.optimal;
  const normalRange = ref?.normal;

  let title = `${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ")}`;
  let description = "";

  const s = status.toLowerCase();
  
  if (s === "critical_high") {
    title = `⚠️ ${title} - Critical High`;
    if (normalizedName === "blood_pressure_systolic" || normalizedName === "blood_pressure_diastolic") {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is critically high. Please consult with your healthcare provider immediately. Reduce sodium intake, practice stress management, and monitor closely.`;
    } else if (normalizedName === "glucose") {
      description = `Your glucose level of ${value}${unit} is critically high. Avoid high-sugar foods, stay hydrated, and consider consulting your healthcare provider. Monitor your levels closely.`;
    } else if (normalizedName === "heart_rate") {
      description = `Your heart rate of ${value}${unit} is critically high. Rest immediately, avoid strenuous activity, practice deep breathing, and consult a healthcare provider if this persists.`;
    } else if (normalizedName === "sleep") {
      description = `Your sleep duration of ${value}${unit} is critically high. While rest is important, excessive sleep may indicate underlying health issues. Consider discussing this with your healthcare provider.`;
    } else if (normalizedName === "steps") {
      description = `Your step count of ${value}${unit} is unusually high. Ensure you're not overexerting yourself. Balance activity with adequate rest and recovery.`;
    } else {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is critically high. Please consult with your healthcare provider and take appropriate action.`;
    }
  } else if (s === "critical_low") {
    title = `⚠️ ${title} - Critical Low`;
    if (normalizedName === "blood_pressure_systolic" || normalizedName === "blood_pressure_diastolic") {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is critically low. Please consult with your healthcare provider immediately. Stay hydrated, avoid sudden position changes, and monitor closely.`;
    } else if (normalizedName === "glucose") {
      description = `Your glucose level of ${value}${unit} is critically low. Consume a quick-acting carbohydrate immediately, then follow with a balanced meal. Monitor closely and consult your healthcare provider if this persists.`;
    } else if (normalizedName === "heart_rate") {
      description = `Your heart rate of ${value}${unit} is critically low. If you're experiencing dizziness or fatigue, consult a healthcare provider. Ensure adequate hydration and nutrition.`;
    } else if (normalizedName === "sleep") {
      description = `Your sleep duration of ${value}${unit} is critically low. Prioritize sleep hygiene: maintain a consistent schedule, create a restful environment, and aim for 7-9 hours nightly.`;
    } else if (normalizedName === "steps") {
      description = `Your step count of ${value}${unit} is very low. Start with small, achievable goals. Aim for at least 5,000 steps daily, gradually increasing to 7,000-10,000 steps.`;
    } else {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is critically low. Please consult with your healthcare provider and take appropriate action.`;
    }
  } else if (s === "high") {
    title = `${title} - Elevated`;
    if (normalizedName === "blood_pressure_systolic" || normalizedName === "blood_pressure_diastolic") {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is elevated (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Reduce sodium intake, increase physical activity, manage stress, and monitor regularly.`;
    } else if (normalizedName === "glucose") {
      description = `Your glucose level of ${value}${unit} is elevated (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Focus on whole foods, reduce refined sugars, stay active, and monitor your levels.`;
    } else if (normalizedName === "heart_rate") {
      description = `Your heart rate of ${value}${unit} is elevated (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Practice stress management, ensure adequate rest, and consider light exercise to improve cardiovascular fitness.`;
    } else if (normalizedName === "sleep") {
      description = `Your sleep duration of ${value}${unit} is above optimal (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). While adequate rest is important, ensure you're maintaining a consistent sleep schedule.`;
    } else if (normalizedName === "steps") {
      description = `Your step count of ${value}${unit} is excellent! You're exceeding the optimal range (${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Keep up the great work while ensuring adequate rest and recovery.`;
    } else {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is elevated. Monitor regularly and maintain healthy lifestyle habits.`;
    }
  } else if (s === "low") {
    title = `${title} - Below Optimal`;
    if (normalizedName === "blood_pressure_systolic" || normalizedName === "blood_pressure_diastolic") {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is below optimal (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Stay hydrated, ensure adequate salt intake if advised by your doctor, and monitor regularly.`;
    } else if (normalizedName === "glucose") {
      description = `Your glucose level of ${value}${unit} is below optimal (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Ensure regular meals with balanced macronutrients, and monitor your levels.`;
    } else if (normalizedName === "heart_rate") {
      description = `Your heart rate of ${value}${unit} is below optimal (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). If you're an athlete, this may be normal. Otherwise, ensure adequate hydration and consult if you experience symptoms.`;
    } else if (normalizedName === "sleep") {
      description = `Your sleep duration of ${value}${unit} is below optimal (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Prioritize sleep: establish a bedtime routine, limit screen time before bed, and create a restful environment.`;
    } else if (normalizedName === "steps") {
      description = `Your step count of ${value}${unit} is below optimal (optimal range: ${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Start with small increases: take short walks, use stairs, and gradually build up to 7,000-10,000 steps daily.`;
    } else {
      description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is below optimal. Focus on improving this metric through healthy lifestyle choices.`;
    }
  } else if (s === "optimal") {
    title = `✓ ${title} - Optimal`;
    description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is within the optimal range (${optimalRange?.[0]}-${optimalRange?.[1]}${unit}). Excellent work! Continue maintaining your current healthy habits.`;
  } else if (s === "normal") {
    title = `${title} - Normal`;
    description = `Your ${name.replace(/_/g, " ")} reading of ${value}${unit} is within the normal range (${normalRange?.[0]}-${normalRange?.[1]}${unit}). Consider small improvements to reach the optimal range (${optimalRange?.[0]}-${optimalRange?.[1]}${unit}) for better health outcomes.`;
  } else {
    title = `${title}`;
    description = `Your ${name.replace(/_/g, " ")} reading is ${value != null ? `${value}${unit}` : "available"}. Continue monitoring and maintaining healthy lifestyle habits.`;
  }

  return {
    id: `bm-${normalizedName}-${value}`,
    title,
    description,
    biomarker_type: name,
    source: "biomarker",
    isDerived: true,
  };
};

const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

const normalizeType = (name = "") => name.toString().trim().toLowerCase().replace(/\s+/g, "_");

const classifyValue = (type, value) => {
  const key = normalizeType(type);
  const ref = REFERENCE_RANGES[key];
  if (!ref || value == null) return { status: "unknown", unit: ref?.unit };

  const [optLow, optHigh] = ref.optimal || [];
  const [normLow, normHigh] = ref.normal || [];
  const [critLow] = ref.critical_low || [];
  const [critHigh] = ref.critical_high || [];

  if (critLow != null && value <= critLow) return { status: "critical_low", unit: ref.unit };
  if (critHigh != null && value >= critHigh) return { status: "critical_high", unit: ref.unit };
  if (optLow != null && optHigh != null && value >= optLow && value <= optHigh) return { status: "optimal", unit: ref.unit };
  if (normLow != null && normHigh != null && value >= normLow && value <= normHigh) return { status: "normal", unit: ref.unit };
  if (optHigh != null && value > optHigh) return { status: "high", unit: ref.unit };
  if (optLow != null && value < optLow) return { status: "low", unit: ref.unit };
  return { status: "unknown", unit: ref.unit };
};

const FeedbackModal = ({ isOpen, onClose, onSubmit, recommendationId, isLoading = false }) => {
  const [feedback, setFeedback] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback) return;
    
    onSubmit({
      feedback,
      difficulty_experienced: difficulty || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    setFeedback("");
    setDifficulty("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Share Your Feedback</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How helpful was this recommendation? <span className="text-red-500">*</span>
              </label>
              <select
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              >
                <option value="">Select feedback...</option>
                <option value="helpful">Helpful</option>
                <option value="not_helpful">Not Helpful</option>
                <option value="already_doing">Already Doing This</option>
                <option value="too_difficult">Too Difficult</option>
                <option value="not_applicable">Not Applicable</option>
                <option value="implemented">Implemented</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Select difficulty...</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your experience or any additional thoughts..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">{notes.length}/500 characters</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!feedback || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DetailsModal = ({ isOpen, onClose, rec, isLoading = false, error = "" }) => {
  if (!isOpen || !rec) return null;
  const steps = Array.isArray(rec.action_steps) ? rec.action_steps : [];
  const metrics = Array.isArray(rec.related_metrics) ? rec.related_metrics : [];
  const displayId = !rec.isDerived ? (rec.id || rec.recommendation_id || rec._id) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">{rec.category_display?.label || rec.category || "Recommendation"}</p>
              <h3 className="text-2xl font-bold text-gray-900 leading-snug">{rec.title || rec.headline || "Recommendation Details"}</h3>
              {rec.priority_display?.label && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: rec.priority_display?.bg_color || "#f0f4ff", color: rec.priority_display?.color || "#1f2a44" }}>
                  <span>{rec.priority_display.label}</span>
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close details"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading the latest details…</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {rec.description && <p className="text-gray-800 leading-relaxed">{rec.description}</p>}
          {rec.detailed_explanation && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Why this matters</h4>
              <p className="text-gray-700 leading-relaxed">{rec.detailed_explanation}</p>
            </div>
          )}

          {(rec.expected_benefit || rec.reasoning || rec.time_to_results) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Impact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
                {rec.expected_benefit && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Expected benefit</p>
                    <p className="text-gray-800 leading-relaxed">{rec.expected_benefit}</p>
                  </div>
                )}
                {rec.reasoning && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Reasoning</p>
                    <p className="text-gray-800 leading-relaxed">{rec.reasoning}</p>
                  </div>
                )}
                {rec.time_to_results && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Time to results</p>
                    <p className="text-gray-800 leading-relaxed">{rec.time_to_results}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            {rec.best_time && <p><span className="font-semibold text-gray-900">Best time:</span> {rec.best_time}</p>}
            {rec.frequency && <p><span className="font-semibold text-gray-900">Frequency:</span> {rec.frequency}</p>}
            {rec.duration && <p><span className="font-semibold text-gray-900">Duration:</span> {rec.duration}</p>}
            {rec.time_to_results && <p><span className="font-semibold text-gray-900">Time to results:</span> {rec.time_to_results}</p>}
            {rec.effort_minutes_per_day != null && <p><span className="font-semibold text-gray-900">Effort/day:</span> {rec.effort_minutes_per_day} min</p>}
            {rec.difficulty && <p><span className="font-semibold text-gray-900">Difficulty:</span> {rec.difficulty}</p>}
            {rec.related_goal && <p className="sm:col-span-2"><span className="font-semibold text-gray-900">Related goal:</span> {rec.related_goal}</p>}
            {rec.contraindications && <p className="sm:col-span-2"><span className="font-semibold text-gray-900">Contraindications:</span> {rec.contraindications}</p>}
            {rec.safety_warning && <p className="sm:col-span-2 text-red-700"><span className="font-semibold text-gray-900">Safety:</span> {rec.safety_warning}</p>}
          </div>

          {steps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Action steps</h4>
              <ol className="space-y-2 list-decimal list-inside text-gray-700">
                {steps.map((s) => (
                  <li key={`${s.step_number}-${s.instruction}`} className="leading-relaxed">
                    <span className="font-medium">Step {s.step_number}:</span> {s.instruction}
                    {s.tip && <span className="text-gray-600"> — {s.tip}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {metrics.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Related metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                {metrics.map((m, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    {m.biomarker_type && <p className="font-semibold text-gray-900">{m.biomarker_type}</p>}
                    {m.current_value != null && <p>Current: {m.current_value}{m.unit ? ` ${m.unit}` : ""}</p>}
                    {m.target_value != null && <p>Target: {m.target_value}{m.unit ? ` ${m.unit}` : ""}</p>}
                    {m.trend && <p>Trend: {m.trend}</p>}
                    {m.target_improvement && <p>Improvement: {m.target_improvement}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
              {displayId && <p><span className="font-semibold text-gray-800">ID:</span> {displayId}</p>}
              {rec.user_id && <p><span className="font-semibold text-gray-800">User ID:</span> {rec.user_id}</p>}
              {rec.status && <p><span className="font-semibold text-gray-800">Status:</span> {rec.status}</p>}
              {rec.ai_model && <p><span className="font-semibold text-gray-800">Model:</span> {rec.ai_model}</p>}
              {rec.confidence_score != null && <p><span className="font-semibold text-gray-800">Confidence:</span> {rec.confidence_score}</p>}
              {rec.user_feedback && <p><span className="font-semibold text-gray-800">Feedback:</span> {rec.user_feedback}</p>}
              {rec.feedback_notes && <p className="sm:col-span-2"><span className="font-semibold text-gray-800">Feedback notes:</span> {rec.feedback_notes}</p>}
              {rec.progress_percentage != null && <p><span className="font-semibold text-gray-800">Progress:</span> {rec.progress_percentage}%</p>}
              {rec.snoozed_until && <p><span className="font-semibold text-gray-800">Snoozed until:</span> {rec.snoozed_until}</p>}
              {rec.valid_from && <p><span className="font-semibold text-gray-800">Valid from:</span> {rec.valid_from}</p>}
              {rec.valid_until && <p><span className="font-semibold text-gray-800">Valid until:</span> {rec.valid_until}</p>}
              {rec.created_at && <p><span className="font-semibold text-gray-800">Created:</span> {rec.created_at}</p>}
              {rec.updated_at && <p><span className="font-semibold text-gray-800">Updated:</span> {rec.updated_at}</p>}
            </div>
            {rec.disclaimer && <p>{rec.disclaimer}</p>}
            {rec.requires_professional_consultation && <p className="text-red-600 font-semibold">Consider consulting a professional for this recommendation.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const DismissConfirmModal = ({ isOpen, onClose, onConfirm, isLoading = false, title }) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1014.14 0 10 10 0 00-14.14 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Dismiss this recommendation?</h3>
              <p className="text-sm text-gray-600">
                {title ? `${title} will be removed without being marked as completed.` : "This recommendation will be removed without being marked as completed."}
              </p>
              <p className="text-xs text-gray-500">You can still receive future recommendations for similar topics.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Dismissing...
                </>
              ) : (
                "Yes, dismiss"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ rec, onFeedbackSubmit, onDismiss, isLoading = false, isDismissing = false }) => {
  const title = rec?.title || rec?.headline || "Recommendation";
  const body = rec?.description || rec?.text || rec?.content || rec?.recommendation || "";
  const created = rec?.created_at || rec?.createdAt;
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const recommendationId = rec?.id || rec?._id;
  const isDerived = Boolean(rec?.isDerived);

  useEffect(() => {
    if (!showDetailsModal) return;

    if (isDerived || !recommendationId) {
      setDetailData(rec);
      setDetailError("");
      return;
    }

    if (detailData && (detailData.id === recommendationId || detailData._id === recommendationId)) {
      return;
    }

    let cancelled = false;
    const fetchDetails = async () => {
      try {
        setDetailLoading(true);
        setDetailError("");
        const data = await getRecommendationById(recommendationId);
        if (!cancelled) {
          const normalized = data?.recommendation || data;
          const merged = { ...rec, ...normalized };
          if (!merged.id && (data?.id || data?._id)) {
            merged.id = data.id || data._id;
          }
          if (!merged.recommendation_id && data?.recommendation_id) {
            merged.recommendation_id = data.recommendation_id;
          }
          setDetailData(merged || rec);
        }
      } catch (err) {
        if (!cancelled) {
          setDetailError(err?.message || "Failed to load details");
          setDetailData(rec);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [showDetailsModal, recommendationId, isDerived, rec, detailData]);

  return (
    <>
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 space-y-3 group">
      <div className="flex items-start justify-between">
          <div className="flex-1">
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="text-left font-semibold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition-colors hover:underline"
            >
              {title}
            </button>
          {created && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(created).toLocaleString()}
              </p>
          )}
        </div>
      </div>
        {body && (
          <p className="text-gray-700 leading-relaxed text-sm">{body}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-2">
      {rec?.biomarker_type && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
          Biomarker: {rec.biomarker_type}
        </span>
      )}
      {rec?.goal && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
          Goal: {rec.goal}
        </span>
      )}
          {recommendationId && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowDismissModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-full border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading || isDismissing}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Dismiss
              </button>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading || isDismissing}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Provide Feedback
              </button>
            </div>
          )}
        </div>
    </div>

      {recommendationId && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={async (feedbackData) => {
            await onFeedbackSubmit(rec, feedbackData);
            setShowFeedbackModal(false);
          }}
          recommendationId={recommendationId}
          isLoading={isLoading}
        />
      )}

      {recommendationId && (
        <DismissConfirmModal
          isOpen={showDismissModal}
          onClose={() => setShowDismissModal(false)}
          onConfirm={async () => {
            await onDismiss(rec);
            setShowDismissModal(false);
          }}
          isLoading={isDismissing}
          title={title}
        />
      )}

      <DetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        rec={detailData || rec}
        isLoading={detailLoading}
        error={detailError}
      />
    </>
  );
};

export default function AiRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [goalRecommendations, setGoalRecommendations] = useState([]);
  const [biomarkerRecommendations, setBiomarkerRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    goal: true,
    biomarker: true,
    other: true,
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [dismissLoadingId, setDismissLoadingId] = useState(null);
  const [dismissSuccess, setDismissSuccess] = useState(false);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError("");
        const [recsData, profile, completionsData, biomarkerDashResult] = await Promise.all([
          getActiveRecommendations(),
          getPatientProfile(),
          getGoalCompletions(),
          getBiomarkerDashboard().catch((err) => {
            console.warn("Biomarker dashboard failed", err);
            return null;
          }),
        ]);

        const list = Array.isArray(recsData?.recommendations)
          ? recsData.recommendations
          : Array.isArray(recsData)
          ? recsData
          : [];
        setRecommendations(list);

        // derive goal-based recs from patient's current goals, excluding completed goals for today
        const today = new Date().toISOString().split("T")[0];
        const completedToday = new Set();
        (completionsData?.completions || []).forEach((comp) => {
          if (comp.completion_date === today && comp.status === "completed") {
            completedToday.add(comp.goal_text);
          }
        });

        let goals = profile?.health_goals || [];
        if (typeof goals === "string") {
          goals = goals
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
            .map((g) => ({ goal: g, frequency: "daily" }));
        } else if (!Array.isArray(goals)) {
          goals = [];
        }

        const goalRecs = goals
          .filter((g) => g.goal && !completedToday.has(g.goal))
          .map((g) => buildGoalRecommendation(g));

        setGoalRecommendations(goalRecs);

        // derive biomarker recs from dashboard data, cross-referencing with reference ranges
        const biomarkerRecs = [];
        
        if (biomarkerDashResult) {
          // Dashboard returns an object with biomarker types as keys (e.g., heart_rate, glucose, etc.)
          const biomarkerKeys = [
            "heart_rate",
            "blood_pressure_systolic",
            "blood_pressure_diastolic",
            "glucose",
            "steps",
            "sleep",
          ];

          biomarkerKeys.forEach((key) => {
            const bm = biomarkerDashResult[key];
            if (bm && bm.value != null) {
              const value = toNumber(bm.value);
              if (value != null) {
                // Cross-reference with reference ranges
                const { status, unit } = classifyValue(key, value);
                const refRange = REFERENCE_RANGES[normalizeType(key)];
                
                // Use the status from our classification (may differ from backend status)
                const biomarkerData = {
                  name: bm.biomarker_type || key,
                  type: key,
                  biomarker_type: key,
                  value,
                  unit: bm.unit || unit,
                  status,
                };
                
                biomarkerRecs.push(buildBiomarkerRecommendation(biomarkerData, refRange));
              }
            }
          });

          // Also handle array format if dashboard returns biomarkers as array
        if (Array.isArray(biomarkerDashResult?.biomarkers)) {
          biomarkerDashResult.biomarkers.forEach((bm) => {
            const name = bm?.type || bm?.name || bm?.biomarker_type;
              const value = toNumber(bm?.value ?? bm?.avg ?? bm?.current_value);
              if (name && value != null) {
                const normalizedName = normalizeType(name);
                const { status, unit } = classifyValue(name, value);
                const refRange = REFERENCE_RANGES[normalizedName];
                
                const biomarkerData = {
                  name,
                  type: normalizedName,
                  biomarker_type: name,
                  value,
                  unit: bm?.unit || unit,
                  status,
                };
                
                // Avoid duplicates by checking normalized biomarker type
                const exists = biomarkerRecs.some((r) => {
                  const rNormalized = normalizeType(r.biomarker_type || r.type || "");
                  return rNormalized === normalizedName;
                });
                if (!exists) {
                  biomarkerRecs.push(buildBiomarkerRecommendation(biomarkerData, refRange));
                }
              }
          });
        } else if (Array.isArray(biomarkerDashResult)) {
          biomarkerDashResult.forEach((bm) => {
            const name = bm?.type || bm?.name || bm?.biomarker_type;
              const value = toNumber(bm?.value ?? bm?.avg ?? bm?.current_value);
              if (name && value != null) {
                const normalizedName = normalizeType(name);
                const { status, unit } = classifyValue(name, value);
                const refRange = REFERENCE_RANGES[normalizedName];
                
                const biomarkerData = {
                  name,
                  type: normalizedName,
                  biomarker_type: name,
                  value,
                  unit: bm?.unit || unit,
                  status,
                };
                
                // Avoid duplicates by checking normalized biomarker type
                const exists = biomarkerRecs.some((r) => {
                  const rNormalized = normalizeType(r.biomarker_type || r.type || "");
                  return rNormalized === normalizedName;
                });
                if (!exists) {
                  biomarkerRecs.push(buildBiomarkerRecommendation(biomarkerData, refRange));
                }
              }
            });
          }
        }

        setBiomarkerRecommendations(biomarkerRecs);
      } catch (err) {
        console.error("Failed to load recommendations", err);
        setError(err?.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const grouped = useMemo(() => {
    const goal = [];
    const biomarker = [];
    const other = [];

    recommendations.forEach((rec) => {
      const type = categorizeRecommendation(rec);
      if (type === "goal") goal.push(rec);
      else if (type === "biomarker") biomarker.push(rec);
      else other.push(rec);
    });

    const mergedGoal = [...goalRecommendations, ...goal];
    const mergedBiomarker = [...biomarkerRecommendations, ...biomarker];

    return { goal: mergedGoal, biomarker: mergedBiomarker, other };
  }, [recommendations, goalRecommendations, biomarkerRecommendations]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const closeSection = (section, e) => {
    e.stopPropagation(); // Prevent toggling when clicking X
    setExpandedSections((prev) => ({
      ...prev,
      [section]: false,
    }));
  };

  const handleFeedbackSubmit = async (rec, feedbackData) => {
    if (!rec) return;
    const recommendationId = rec?.id || rec?._id;
    const isDerived = Boolean(rec?.isDerived);
    if (!recommendationId) return;
    try {
      setFeedbackLoading(true);
      setError("");
      if (isDerived) {
        setFeedbackSuccess(true);
        setTimeout(() => setFeedbackSuccess(false), 3000);
      } else {
        await submitRecommendationFeedback(recommendationId, feedbackData);
        setFeedbackSuccess(true);
        setTimeout(() => setFeedbackSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
      setError(err?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDismiss = async (rec) => {
    if (!rec) return;
    const recommendationId = rec?.id || rec?._id;
    const isDerived = Boolean(rec?.isDerived);
    if (!recommendationId) return;
    try {
      setDismissLoadingId(recommendationId);
      setError("");
      if (isDerived) {
        setGoalRecommendations((prev) => prev.filter((g) => (g.id || g._id) !== recommendationId));
        setBiomarkerRecommendations((prev) => prev.filter((b) => (b.id || b._id) !== recommendationId));
        setRecommendations((prev) => prev.filter((r) => (r.id || r._id) !== recommendationId));
        setDismissSuccess(true);
        setTimeout(() => setDismissSuccess(false), 3000);
      } else {
        await dismissRecommendation(recommendationId);
        setRecommendations((prev) => prev.filter((r) => (r.id || r._id) !== recommendationId));
        setDismissSuccess(true);
        setTimeout(() => setDismissSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to dismiss recommendation", err);
      setError(err?.message || "Failed to dismiss recommendation. Please try again.");
    } finally {
      setDismissLoadingId(null);
    }
  };

  return (
    <RoleProtection allowedRoles={[USER_ROLES.PATIENT]}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Recommendations</h1>
          </div>
          <p className="text-gray-600 ml-12">
            Personalized guidance generated from your health data and device insights.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 space-y-1">
            <p className="font-semibold">Error loading recommendations</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {feedbackSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">Feedback submitted successfully! Thank you for your input.</p>
          </div>
        )}

        {dismissSuccess && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">Recommendation dismissed. We will tailor future suggestions accordingly.</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Goals-based recommendations section */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <button
                onClick={() => toggleSection("goal")}
                className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      Goals-based recommendations
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Suggestions tailored to your health goals.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.goal && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                      {grouped.goal.length} {grouped.goal.length === 1 ? "item" : "items"}
                    </span>
                  )}
                  {expandedSections.goal && (
                    <button
                      onClick={(e) => closeSection("goal", e)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                      aria-label="Close section"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className={`p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-all duration-200 ${expandedSections.goal ? "rotate-180" : ""}`}>
                    <svg
                      className="w-5 h-5 text-gray-600 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
              </div>
              </button>

              {expandedSections.goal && (
                <div className="px-5 pb-5 transition-all duration-300 ease-in-out border-t border-gray-100 bg-gray-50/30">
              {grouped.goal.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 mt-4">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium">No goal-based recommendations yet.</p>
                      <p className="text-sm mt-1">Complete your health goals to see personalized recommendations.</p>
                </div>
              ) : (
                    <div className="grid grid-cols-1 gap-4 mt-4">
                  {grouped.goal.map((rec, idx) => (
                        <RecommendationCard 
                          key={rec.id || rec._id || idx} 
                          rec={rec} 
                          onFeedbackSubmit={handleFeedbackSubmit}
                          onDismiss={handleDismiss}
                          isLoading={feedbackLoading}
                          isDismissing={dismissLoadingId === (rec.id || rec._id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Biomarker-based recommendations section */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <button
                onClick={() => toggleSection("biomarker")}
                className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      Biomarker-based recommendations
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Insights generated from your biomarker data.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.biomarker && (
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200">
                      {grouped.biomarker.length} {grouped.biomarker.length === 1 ? "item" : "items"}
                    </span>
                  )}
                  {expandedSections.biomarker && (
                    <button
                      onClick={(e) => closeSection("biomarker", e)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                      aria-label="Close section"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className={`p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-all duration-200 ${expandedSections.biomarker ? "rotate-180" : ""}`}>
                    <svg
                      className="w-5 h-5 text-gray-600 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
              </div>
              </button>

              {expandedSections.biomarker && (
                <div className="px-5 pb-5 transition-all duration-300 ease-in-out border-t border-gray-100 bg-gray-50/30">
              {grouped.biomarker.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500 mt-4">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="font-medium">No biomarker-based recommendations yet.</p>
                      <p className="text-sm mt-1">Track your biomarkers to receive personalized insights.</p>
                </div>
              ) : (
                    <div className="grid grid-cols-1 gap-4 mt-4">
                  {grouped.biomarker.map((rec, idx) => (
                        <RecommendationCard 
                          key={rec.id || rec._id || idx} 
                          rec={rec} 
                          onFeedbackSubmit={handleFeedbackSubmit}
                          onDismiss={handleDismiss}
                          isLoading={feedbackLoading}
                          isDismissing={dismissLoadingId === (rec.id || rec._id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Other recommendations section */}
            {grouped.other.length > 0 && (
              <section className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <button
                  onClick={() => toggleSection("other")}
                  className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        Other recommendations
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">General guidance not tied to goals or biomarkers.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {expandedSections.other && (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200">
                        {grouped.other.length} {grouped.other.length === 1 ? "item" : "items"}
                      </span>
                    )}
                    {expandedSections.other && (
                      <button
                        onClick={(e) => closeSection("other", e)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                        aria-label="Close section"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <div className={`p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-all duration-200 ${expandedSections.other ? "rotate-180" : ""}`}>
                      <svg
                        className="w-5 h-5 text-gray-600 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                  </div>
                </div>
                </button>

                {expandedSections.other && (
                  <div className="px-5 pb-5 transition-all duration-300 ease-in-out border-t border-gray-100 bg-gray-50/30">
                    <div className="grid grid-cols-1 gap-4 mt-4">
                  {grouped.other.map((rec, idx) => (
                        <RecommendationCard 
                          key={rec.id || rec._id || idx} 
                          rec={rec} 
                          onFeedbackSubmit={handleFeedbackSubmit}
                          onDismiss={handleDismiss}
                          isLoading={feedbackLoading}
                          isDismissing={dismissLoadingId === (rec.id || rec._id)}
                        />
                  ))}
                </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </RoleProtection>
  );
}
