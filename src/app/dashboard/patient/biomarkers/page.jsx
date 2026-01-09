"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllBiomarkers, getBiomarkerHistory, getBiomarkerRanges, insertBiomarkerData, getMyDevices } from "@/services/api_calls";

const TYPE_META = {
	heart_rate: { label: "Heart Rate", tag: "Vitals", accent: "from-rose-500 to-orange-500" },
	blood_pressure_systolic: { label: "Blood Pressure (Systolic)", tag: "Blood Pressure", accent: "from-indigo-500 to-blue-500" },
	blood_pressure_diastolic: { label: "Blood Pressure (Diastolic)", tag: "Blood Pressure", accent: "from-indigo-500 to-blue-500" },
	glucose: { label: "Glucose", tag: "Metabolic", accent: "from-amber-500 to-amber-600" },
	steps: { label: "Steps", tag: "Activity", accent: "from-emerald-500 to-teal-500" },
	sleep: { label: "Sleep", tag: "Recovery", accent: "from-slate-500 to-slate-600" },
};

const INFO_META = {
	steps: "Daily step count",
	sleep: "Hours of sleep per night",
};

const TYPE_UNIT = {
	heart_rate: "bpm",
	blood_pressure_systolic: "mmHg",
	blood_pressure_diastolic: "mmHg",
	glucose: "mg/dL",
	steps: "steps",
	sleep: "hours",
};

const BLOOD_PRESSURE_TYPES = ["blood_pressure_systolic", "blood_pressure_diastolic"];

const isBloodPressureType = (value) => BLOOD_PRESSURE_TYPES.includes(value);

const PRIMARY_TYPE_OPTIONS = [
	{ value: "heart_rate", label: TYPE_META.heart_rate.label },
	{ value: "blood_pressure", label: "Blood Pressure" },
	{ value: "glucose", label: TYPE_META.glucose.label },
	{ value: "steps", label: TYPE_META.steps.label },
	{ value: "sleep", label: TYPE_META.sleep.label },
];

const nowLocal = () => new Date().toISOString().slice(0, 16);

const asLabel = (value) =>
	String(value || "")
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const formatRange = (min, max, unit) => {
	const hasMin = min !== null && min !== undefined;
	const hasMax = max !== null && max !== undefined;

	if (hasMin && hasMax) return `${min} - ${max} ${unit}`;
	if (hasMin) return `>= ${min} ${unit}`;
	if (hasMax) return `<= ${max} ${unit}`;
	return "Not set";
};

const RangePill = ({ label, value, highlight }) => (
	<div
		className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
			highlight
				? "border-blue-200 bg-blue-50 text-blue-800"
				: "border-gray-200 bg-gray-50 text-gray-700"
		}`}
	>
		<span className="font-semibold">{label}</span>
		<span className="font-mono">{value}</span>
	</div>
);

const ICON_COLORS = {
	heart_rate: "text-rose-600",
	blood_pressure_systolic: "text-indigo-600",
	blood_pressure_diastolic: "text-indigo-600",
	glucose: "text-amber-600",
	steps: "text-emerald-600",
	sleep: "text-slate-600",
};

const CARD_THEME = {
	heart_rate: {
		bg: "from-rose-500 via-red-500 to-orange-400",
		ring: "focus:ring-rose-200",
		glow: "shadow-[0_16px_38px_-18px_rgba(244,63,94,0.7)]",
	},
	blood_pressure_systolic: {
		bg: "from-indigo-500 via-blue-500 to-cyan-400",
		ring: "focus:ring-indigo-200",
		glow: "shadow-[0_16px_38px_-18px_rgba(79,70,229,0.65)]",
	},
	blood_pressure_diastolic: {
		bg: "from-indigo-500 via-blue-500 to-cyan-400",
		ring: "focus:ring-indigo-200",
		glow: "shadow-[0_16px_38px_-18px_rgba(79,70,229,0.65)]",
	},
	glucose: {
		bg: "from-amber-500 via-orange-500 to-pink-400",
		ring: "focus:ring-amber-200",
		glow: "shadow-[0_16px_38px_-18px_rgba(245,158,11,0.6)]",
	},
	steps: {
		bg: "from-emerald-500 via-teal-500 to-cyan-400",
		ring: "focus:ring-emerald-200",
		glow: "shadow-[0_16px_38px_-18px_rgba(16,185,129,0.55)]",
	},
	sleep: {
		bg: "from-slate-600 via-indigo-600 to-sky-500",
		ring: "focus:ring-slate-200",
		glow: "shadow-[0_16px_38px_-18px_rgba(100,116,139,0.6)]",
	},
	default: {
		bg: "from-slate-500 via-slate-600 to-slate-700",
		ring: "focus:ring-slate-200",
		glow: "shadow-[0_16px_32px_-18px_rgba(51,65,85,0.65)]",
	},
};

const BiomarkerIcon = ({ type, className = "" }) => {
	const key = String(type || "").toLowerCase();
	const color = ICON_COLORS[key] || "text-gray-500";
	const base = `${className || "h-4 w-4"} ${color}`;
	if (key.includes("heart")) {
		return (
			<svg aria-hidden="true" viewBox="0 0 24 24" className={base}>
				<path
					fill="currentColor"
					d="M12 21s-6.5-4.35-9.14-8.38C.6 9.87 1.4 6.3 4 4.65a4.7 4.7 0 0 1 5.6.7L12 7l2.4-1.65A4.7 4.7 0 0 1 20 4.65c2.6 1.65 3.4 5.22 1.14 7.97C18.5 16.65 12 21 12 21z"
				/>
			</svg>
		);
	}
	if (key.includes("blood_pressure")) {
		return (
			<svg aria-hidden="true" viewBox="0 0 24 24" className={base}>
				<path
					fill="currentColor"
					d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9m0 1.5a7.5 7.5 0 1 1-7.5 7.5A7.5 7.5 0 0 1 12 4.5m3.54 9.15-2.72-2.72a1.75 1.75 0 1 0-2.47 2.47l2.72 2.72a5.25 5.25 0 1 1 2.47-2.47"
				/>
			</svg>
		);
	}
	if (key.includes("glucose")) {
		return (
			<svg aria-hidden="true" viewBox="0 0 24 24" className={base}>
				<path
					fill="currentColor"
					d="M12 3.5 7 9.44a6 6 0 1 0 10 0zm0 9.75a.75.75 0 0 1-.75-.75V10a.75.75 0 0 1 1.5 0v2.5A.75.75 0 0 1 12 13.25m0 2a.75.75 0 1 1 .75-.75.75.75 0 0 1-.75.75"
				/>
			</svg>
		);
	}
	if (key.includes("steps")) {
		return (
			<svg aria-hidden="true" viewBox="0 0 24 24" className={base}>
				<path
					fill="currentColor"
					d="M8.5 3.75a2.75 2.75 0 0 1 2.7 2.22l.21 1.03a2.75 2.75 0 0 1-2.32 3.27l-2.13.34a2.75 2.75 0 0 1-3.07-2l-.21-1.04A2.75 2.75 0 0 1 5.5 3.75zm8.96 5.44a2.25 2.25 0 0 1 2.64 1.66l.53 2.22a2.25 2.25 0 0 1-1.78 2.73l-4.58.93a2.25 2.25 0 0 1-2.64-1.66l-.53-2.22a2.25 2.25 0 0 1 1.78-2.73z"
				/>
			</svg>
		);
	}
	if (key.includes("sleep")) {
		return (
			<svg aria-hidden="true" viewBox="0 0 24 24" className={base}>
				<path
					fill="currentColor"
					d="M14 3a8 8 0 0 0 0 16 8 8 0 0 0 5.66-2.34.5.5 0 0 0-.48-.84 6 6 0 0 1-6.71-9.68.5.5 0 0 0-.47-.84A8 8 0 0 0 14 3"
				/>
			</svg>
		);
	}
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className={base}>
			<circle cx="12" cy="12" r="2" fill="currentColor" />
		</svg>
	);
};

export default function BiomarkerRangesPage() {
	const [ranges, setRanges] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [records, setRecords] = useState([]);
	const [recordsLoading, setRecordsLoading] = useState(false);
	const selectedType = "all";
	const [showFilters, setShowFilters] = useState(false);
	const [showInsertChoice, setShowInsertChoice] = useState(false);
	const [showManualModal, setShowManualModal] = useState(false);
	const [manualForm, setManualForm] = useState({
		biomarker_type: "heart_rate",
		value: "",
		unit: TYPE_UNIT.heart_rate,
		source: "manual",
		recorded_at: "",
		notes: "",
	});
	const [manualPrimaryType, setManualPrimaryType] = useState(
		isBloodPressureType("heart_rate") ? "blood_pressure" : "heart_rate"
	);
	const [manualSaving, setManualSaving] = useState(false);
	const [manualError, setManualError] = useState("");
	const [showDeviceModal, setShowDeviceModal] = useState(false);
	const [deviceForm, setDeviceForm] = useState({
		biomarker_type: "heart_rate",
		unit: TYPE_UNIT.heart_rate,
		recorded_at: "",
		notes: "",
	});
	const [devicePrimaryType, setDevicePrimaryType] = useState(
		isBloodPressureType("heart_rate") ? "blood_pressure" : "heart_rate"
	);
	const [deviceSaving, setDeviceSaving] = useState(false);
	const [deviceError, setDeviceError] = useState("");
	const [deviceList, setDeviceList] = useState([]);
	const [deviceLoading, setDeviceLoading] = useState(false);
	const [detailModal, setDetailModal] = useState({ open: false, biomarker: null, mode: null });
	const [detailRecords, setDetailRecords] = useState([]);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState(null);
	const [detailFrom, setDetailFrom] = useState("");
	const [detailTo, setDetailTo] = useState("");

	useEffect(() => {
		loadRanges();
	}, []);

	useEffect(() => {
		loadRecords();
	}, []);

	const latestByType = useMemo(() => {
		const map = {};
		(records || []).forEach((record) => {
			const key = record?.biomarker_type;
			if (!key) return;
			const currentTs = new Date(record.recorded_at || 0).getTime();
			const existingTs = new Date(map[key]?.recorded_at || 0).getTime();
			if (!map[key] || currentTs > existingTs) {
				map[key] = record;
			}
		});
		return map;
	}, [records]);

	const loadRanges = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getBiomarkerRanges();
			const safeData = Array.isArray(data) ? data : [];
			setRanges(safeData);
		} catch (err) {
			setError(err?.message || "Failed to load biomarker ranges");
		} finally {
			setLoading(false);
		}
	};

	const enrichedRanges = useMemo(
		() =>
			ranges
				.map((item) => {
					const meta = TYPE_META[item.biomarker_type] || {};
					return {
						...item,
						label: meta.label || asLabel(item.biomarker_type),
						tag: meta.tag || "Biomarker",
						accent: meta.accent || "from-gray-400 to-gray-500",
						info: INFO_META[item.biomarker_type],
					};
				})
				.sort((a, b) => a.label.localeCompare(b.label)),
		[ranges]
	);

	const loadRecords = async () => {
		try {
			setRecordsLoading(true);
			let data = [];
			if (selectedType === "all") {
				data = await getAllBiomarkers({ limit: 500 });
			} else {
				data = await getBiomarkerHistory(selectedType, { limit: 500 });
			}
			const safe = Array.isArray(data) ? data : [];
			setRecords(safe);
		} catch (err) {
			// intentionally silent; errors are handled in detail modals when opened
		} finally {
			setRecordsLoading(false);
		}
	};

	const handleManualSave = async () => {
		setManualError("");
		const valueNum = Number(manualForm.value);
		if (!manualForm.biomarker_type) {
			setManualError("Select a biomarker type.");
			return;
		}
		if (!Number.isFinite(valueNum)) {
			setManualError("Enter a numeric value.");
			return;
		}
		try {
			setManualSaving(true);
			const payload = {
				biomarker_type: manualForm.biomarker_type,
				value: valueNum,
				unit: manualForm.unit,
				source: "manual",
				recorded_at: manualForm.recorded_at ? new Date(manualForm.recorded_at).toISOString() : new Date().toISOString(),
				notes: manualForm.notes || undefined,
			};
			await insertBiomarkerData(payload);
			setShowManualModal(false);
			setManualForm((prev) => ({ ...prev, value: "", recorded_at: "", notes: "" }));
			await loadRecords();
		} catch (err) {
			setManualError(err?.message || "Failed to save biomarker");
		} finally {
			setManualSaving(false);
		}
	};

	const handleDeviceSave = async () => {
		setDeviceError("");
		if (!deviceForm.biomarker_type) {
			setDeviceError("Select a biomarker type.");
			return;
		}
		try {
			setDeviceSaving(true);
			const devicesData = await getMyDevices();
			const devices = Array.isArray(devicesData) ? devicesData : devicesData.devices || [];
			if (devices.length === 0) {
				setDeviceError("No connected devices found.");
				return;
			}
			const chosenId = deviceForm.device_id || devices[0].id;
			const device_id = chosenId;
			// find latest reading from this device and biomarker type
			const all = await getAllBiomarkers({ limit: 500 });
			const list = Array.isArray(all) ? all : [];
			const latest = list
				.filter((r) => r.device_id === device_id && r.biomarker_type === deviceForm.biomarker_type)
				.sort((a, b) => new Date(b.recorded_at || 0) - new Date(a.recorded_at || 0))[0];
			if (!latest) {
				setDeviceError("No readings found for this device and biomarker.");
				return;
			}
			const valueNum = Number(latest.value);
			if (!Number.isFinite(valueNum)) {
				setDeviceError("Latest device reading is invalid.");
				return;
			}
			const payload = {
				biomarker_type: deviceForm.biomarker_type,
				value: valueNum,
				unit: latest.unit || deviceForm.unit,
				source: "device",
				device_id,
				recorded_at: deviceForm.recorded_at
					? new Date(deviceForm.recorded_at).toISOString()
					: latest.recorded_at || new Date().toISOString(),
				notes: deviceForm.notes || latest.notes || undefined,
			};
			await insertBiomarkerData(payload);
			setShowDeviceModal(false);
			setDeviceForm((prev) => ({ ...prev, recorded_at: nowLocal(), notes: "", device_id }));
			await loadRecords();
		} catch (err) {
			setDeviceError(err?.message || "Failed to save device biomarker");
		} finally {
			setDeviceSaving(false);
		}
	};

	const openDetail = async (biomarker, mode = "graph") => {
		if (!biomarker) return;

		// Default quick range for graphs to last 7 days
		if (mode === "graph") {
			const today = new Date();
			const endKey = today.toISOString().slice(0, 10);
			const start = new Date(today);
			start.setDate(start.getDate() - 6);
			const startKey = start.toISOString().slice(0, 10);
			setDetailFrom(startKey);
			setDetailTo(endKey);
		} else {
			setDetailFrom("");
			setDetailTo("");
		}

		setDetailModal({ open: true, biomarker, mode });
		try {
			setDetailLoading(true);
			setDetailError(null);
			const raw = await getBiomarkerHistory(biomarker, { limit: 500 });
			const list = Array.isArray(raw) ? raw : [];
			list.sort((a, b) =>
				mode === "list"
					? new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime()
					: new Date(a.recorded_at || 0).getTime() - new Date(b.recorded_at || 0).getTime()
			);
			setDetailRecords(list);
		} catch (err) {
			setDetailError(err?.message || "Failed to load biomarker history");
		} finally {
			setDetailLoading(false);
		}
	};

	const setDetailMode = (mode) => {
		setDetailModal((prev) => ({ ...prev, mode }));
		setDetailRecords((prev) => {
			const list = Array.isArray(prev) ? [...prev] : [];
			list.sort((a, b) =>
				mode === "list"
					? new Date(b.recorded_at || 0).getTime() - new Date(a.recorded_at || 0).getTime()
					: new Date(a.recorded_at || 0).getTime() - new Date(b.recorded_at || 0).getTime()
			);
			return list;
		});
	};

	const setManualType = (type) => {
		setManualForm((prev) => ({ ...prev, biomarker_type: type, unit: TYPE_UNIT[type] || prev.unit }));
		setManualPrimaryType(isBloodPressureType(type) ? "blood_pressure" : type);
	};

	const setDeviceType = (type) => {
		setDeviceForm((prev) => ({ ...prev, biomarker_type: type, unit: TYPE_UNIT[type] || prev.unit }));
		setDevicePrimaryType(isBloodPressureType(type) ? "blood_pressure" : type);
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-3">
					<div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-400 shadow-lg flex items-center justify-center text-white">
						<svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
							<path
								fill="currentColor"
								d="M12 4a7 7 0 0 0-7 7c0 5.25 7 9 7 9s7-3.75 7-9a7 7 0 0 0-7-7m0 9.25a2.25 2.25 0 1 1 0-4.5a2.25 2.25 0 0 1 0 4.5"
							/>
						</svg>
					</div>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Biomarker Data</h1>
						<p className="text-gray-600">Bright glance at your latest readings.</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setShowInsertChoice(true)}
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
					>
						<svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-white">
							<path
								fill="currentColor"
								d="M10 3.25a.75.75 0 0 1 .75.75v5.25H16a.75.75 0 0 1 0 1.5h-5.25V16a.75.75 0 0 1-1.5 0v-5.25H4a.75.75 0 0 1 0-1.5h5.25V4a.75.75 0 0 1 .75-.75"
							/>
						</svg>
						Insert data
					</button>
					<button
						type="button"
						onClick={() => setShowFilters(true)}
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
					>
						<svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-gray-600">
							<path
								fill="currentColor"
								d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v12.5A2.75 2.75 0 0 1 17.25 21H6.75A2.75 2.75 0 0 1 4 18.25zM5.5 6.5v1.75h13V6.5A1.25 1.25 0 0 0 17.25 5.25H6.75A1.25 1.25 0 0 0 5.5 6.5m13 3.25h-13v8.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25z"
							/>
						</svg>
						Reference ranges
					</button>
				</div>
			</div>

			<div className="px-2 sm:px-4 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 bg-gradient-to-b from-white to-gray-50">
				{Object.keys(TYPE_META).map((key) => {
					const meta = TYPE_META[key];
					const theme = CARD_THEME[key] || CARD_THEME.default;
					const latest = latestByType[key];
					return (
						<button
							key={key}
							type="button"
							onClick={() => openDetail(key, "graph")}
							className={`relative overflow-hidden rounded-2xl px-5 py-6 flex items-center justify-between text-white bg-gradient-to-br ${theme.bg} ${theme.glow} transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 ${theme.ring} focus:ring-offset-0`}
						>
							<div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-150 hover:opacity-10" aria-hidden="true" />
							<div className="flex items-center gap-4">
								<div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
									<BiomarkerIcon type={key} className="h-6 w-6 text-white" />
								</div>
								<div className="flex flex-col text-left">
									<span className="text-base font-bold leading-tight drop-shadow-sm">
										{meta.label}
									</span>
								</div>
							</div>
							<div className="text-right">
								{recordsLoading ? (
									<span className="text-sm font-semibold text-white/80">Loading...</span>
								) : (
									<>
										<div className="text-3xl font-black leading-none drop-shadow-sm">
											{latest?.value !== undefined && latest?.value !== null
												? key === "steps"
													? Math.round(Number(latest.value))
													: latest.value
												: "--"}
										</div>
										<div className="text-sm font-semibold text-white/80">
											{latest?.unit || TYPE_UNIT[key] || ""}
										</div>
									</>
								)}
							</div>
						</button>
					);
				})}
			</div>

			{detailModal.open && (
				<div className="mt-6">
					<div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm">
						<div className="flex flex-col lg:flex-row">
							{/* Left Panel - Title and Controls */}
							<div className="flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 p-6 lg:w-64">
								<div className="mb-4">
									<div className="flex items-center gap-2 mb-1">
										<BiomarkerIcon type={detailModal.biomarker} className="h-6 w-6" />
										<span className="text-lg font-semibold text-gray-900">
											{TYPE_META[detailModal.biomarker]?.label || asLabel(detailModal.biomarker)}
										</span>
									</div>
									<p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
										{detailModal.mode === "graph" ? "History graph" : "History list"}
									</p>
								</div>
								<div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:gap-2">
									<div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
									<button
										type="button"
										onClick={() => setDetailMode("graph")}
										className={`px-3 py-1 text-sm font-semibold rounded ${
											detailModal.mode === "graph"
												? "bg-white text-gray-900 shadow-sm"
												: "text-gray-600 hover:text-gray-800"
										}`}
									>
										Graph
									</button>
									<button
										type="button"
										onClick={() => setDetailMode("list")}
										className={`px-3 py-1 text-sm font-semibold rounded ${
											detailModal.mode === "list"
												? "bg-white text-gray-900 shadow-sm"
												: "text-gray-600 hover:text-gray-800"
										}`}
									>
										List
									</button>
								</div>
								<button
									type="button"
									onClick={() => {
										setDetailModal({ open: false, biomarker: null, mode: null });
										setDetailRecords([]);
										setDetailError(null);
										setDetailLoading(false);
										setDetailFrom("");
										setDetailTo("");
									}}
										className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
									>
										Close
									</button>
								</div>
							</div>
							{/* Right Panel - Content */}
							<div className="flex-1 p-6 space-y-4">
						{detailModal.mode === "list" ? (
							<div className="rounded-lg border border-gray-200 bg-white max-h-[60vh] flex flex-col">
								{detailLoading && (
									<div className="flex items-center justify-center py-6 text-sm text-gray-600 border-b border-gray-100">
										Loading history...
									</div>
								)}
								{detailError && !detailLoading && (
									<div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-b border-red-200">
										{detailError}
									</div>
								)}
								<div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 text-xs text-gray-700">
									<div className="flex items-center gap-2">
										<label className="font-semibold">From</label>
										<input
											type="date"
											value={detailFrom}
											onChange={(e) => setDetailFrom(e.target.value)}
											className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
										/>
									</div>
									<div className="flex items-center gap-2">
										<label className="font-semibold">To</label>
										<input
											type="date"
											value={detailTo}
											onChange={(e) => setDetailTo(e.target.value)}
											className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
										/>
									</div>
									<button
										type="button"
										onClick={() => {
											setDetailFrom("");
											setDetailTo("");
										}}
										className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
									>
										Clear
									</button>
								</div>
								<div className="flex-1 overflow-auto">
									{!detailLoading && !detailError && detailRecords.length === 0 ? (
										<div className="flex items-center justify-center py-10 text-sm text-gray-600">
											No history found for this biomarker yet.
										</div>
									) : (
										<table className="w-full table-fixed text-sm text-gray-900">
										<colgroup>
											<col className="w-[18%]" />
											<col className="w-[12%]" />
											<col className="w-[30%]" />
											<col className="w-[20%]" />
											<col className="w-[20%]" />
										</colgroup>
										<thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
											<tr>
												<th className="px-4 py-3">Value</th>
												<th className="px-4 py-3">Unit</th>
												<th className="px-4 py-3">Recorded at</th>
												<th className="px-4 py-3">Source</th>
												<th className="px-4 py-3">Notes</th>
											</tr>
										</thead>
										<tbody>
											{detailRecords
												.filter((r) => {
													if (!detailFrom && !detailTo) return true;
													if (!r.recorded_at) return false;
													const d = new Date(r.recorded_at);
													if (Number.isNaN(d.getTime())) return false;

													const year = d.getFullYear();
													const month = String(d.getMonth() + 1).padStart(2, "0");
													const day = String(d.getDate()).padStart(2, "0");
													const key = `${year}-${month}-${day}`;

													if (detailFrom && key < detailFrom) return false;
													if (detailTo && key > detailTo) return false;
													return true;
												})
												.map((r) => {
													const displayValue = detailModal.biomarker === "steps"
														? Math.round(Number(r.value))
														: r.value;
													return (
													<tr
														key={r.id || `${r.recorded_at || ""}-${r.value}-${r.source || ""}`}
														className="border-t border-gray-100"
													>
														<td className="px-4 py-3 align-middle tabular-nums">{displayValue}</td>
														<td className="px-4 py-3 align-middle text-gray-600">{r.unit}</td>
														<td className="px-4 py-3 align-middle text-gray-600 whitespace-nowrap tabular-nums">
															{r.recorded_at ? new Date(r.recorded_at).toLocaleString() : ""}
														</td>
														<td className="px-4 py-3 align-middle text-gray-600">
															{asLabel(r.source)}
														</td>
														<td className="px-4 py-3 align-middle text-gray-500">
															{r.notes || "\u2014"}
														</td>
													</tr>
												);
												})}
										</tbody>
									</table>
									)}
								</div>
							</div>
						) : (
							(() => {
								const all = Array.isArray(detailRecords) ? detailRecords : [];
								const kindKey = String(detailModal.biomarker || "").toLowerCase();

								const filtered = all.filter((r) => {
									if (!detailFrom && !detailTo) return true;
									if (!r.recorded_at) return false;
									const d = new Date(r.recorded_at);
									if (Number.isNaN(d.getTime())) return false;

									const year = d.getFullYear();
									const month = String(d.getMonth() + 1).padStart(2, "0");
									const day = String(d.getDate()).padStart(2, "0");
									const key = `${year}-${month}-${day}`;

									if (detailFrom && key < detailFrom) return false;
									if (detailTo && key > detailTo) return false;
									return true;
								});

								const points = filtered
									.map((r) => {
										const raw = Number(r.value);
										const value = kindKey === "steps" ? Math.round(raw) : raw;
										return {
											ts: new Date(r.recorded_at || 0).getTime(),
											value,
										};
									})
									.filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.value))
									.sort((a, b) => a.ts - b.ts);

								const width = 520;
								const height = 260;
								const pad = 36;

								if (points.length === 0) {
									return (
										<div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-600">
											{detailLoading
												? "Loading history..."
												: "No data found for this biomarker in the selected range."}
										</div>
									);
								}

								const isBarOnly = kindKey === "steps" || kindKey === "sleep";
								// Everything that is not a bar chart should render as a line chart (e.g., glucose)
								const isLineOnly = !isBarOnly;

								const showBars = isBarOnly;
								const showLine = isLineOnly;

								// For bar charts, aggregate by day to avoid overlapping bars
								const barPoints = showBars
									? Array.from(
											points.reduce((map, item) => {
												const d = new Date(item.ts);
												const dayKey = d.toDateString();
												const entry = map.get(dayKey) || {
													ts: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
													value: 0,
												};
												entry.value += item.value;
												map.set(dayKey, entry);
												return map;
											}, new Map()).values()
									  ).sort((a, b) => a.ts - b.ts)
									: [];

								// Use aggregated points for bar charts, original points for line charts
								const displayPoints = showBars ? barPoints : points;
								const xs = displayPoints.map((p) => p.ts);
								const ys = displayPoints.map((p) => p.value);
								const xMin = Math.min(...xs);
								const xMax = Math.max(...xs);
								let yMin = Math.min(...ys);
								let yMax = Math.max(...ys);

								if (showBars) {
									// For bar charts we always want the baseline at 0 so bars
									// grow only upwards from the x-axis and never cross it.
									yMin = 0;
									if (yMax === 0) {
										yMax = 1;
									} else {
										yMax = yMax * 1.1;
									}
								} else {
									// Line charts keep their natural range with a tiny buffer
									if (yMin === yMax) {
										yMin -= 1;
										yMax += 1;
									} else {
										const range = yMax - yMin;
										yMin -= range * 0.05;
										yMax += range * 0.05;
									}
								}

								const scaleX = (v) =>
									pad + ((v - xMin) / (xMax - xMin || 1)) * (width - pad * 2);
								const scaleY = (v) =>
									height - pad - ((v - yMin) / (yMax - yMin || 1)) * (height - pad * 2);

								// Calculate bar width based on aggregated points
								const numBars = barPoints.length;
								const spacing = (width - pad * 2) / Math.max(numBars, 1);
								const barW = Math.max(12, Math.min(32, spacing * 0.5));

								const linePath = showLine
									? points
											.map(
												(p, idx) =>
													`${idx === 0 ? "M" : "L"}${scaleX(p.ts)},${scaleY(p.value)}`
											)
											.join(" ")
									: "";

								const baseLineY = scaleY(showBars ? 0 : yMin);
								const areaPath =
									showLine && points.length > 0
										? [
												`M${scaleX(points[0].ts)},${baseLineY}`,
												...points.map((p) => `L${scaleX(p.ts)},${scaleY(p.value)}`),
												`L${scaleX(points[points.length - 1].ts)},${baseLineY}`,
												"Z",
										  ].join(" ")
										: "";

								const xTicks =
									displayPoints.length >= 2 ? [xMin, (xMin + xMax) / 2, xMax] : [xMin];
								const yTicks = [yMin, (yMin + yMax) / 2, yMax];

								const formatDateTick = (ts) => {
									const d = new Date(ts);
									return Number.isNaN(d.getTime())
										? ""
										: d.toLocaleDateString(undefined, {
												month: "short",
												day: "numeric",
										  });
								};

								const yLabel =
									TYPE_UNIT[detailModal.biomarker] || "Values";

								return (
									<div className="space-y-3">
										<div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 mb-1">
											<span className="font-semibold mr-2">Quick ranges:</span>
											{[7, 30, 60, 90].map((days) => (
												<button
													key={days}
													type="button"
													onClick={() => {
														const today = new Date();
														const endKey = today.toISOString().slice(0, 10);
														const start = new Date(today);
														start.setDate(start.getDate() - (days - 1));
														const startKey = start.toISOString().slice(0, 10);
														setDetailFrom(startKey);
														setDetailTo(endKey);
													}}
													className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
												>
													Last {days} days
												</button>
											))}
											<span className="ml-auto text-[11px] text-gray-500">
												Or pick a custom date range below.
											</span>
										</div>
										<div className="px-3 py-2 rounded-lg border border-gray-200 bg-white flex flex-wrap items-center gap-3 text-xs text-gray-700">
											<div className="flex items-center gap-2">
												<label className="font-semibold">From</label>
												<input
													type="date"
													value={detailFrom}
													onChange={(e) => setDetailFrom(e.target.value)}
													className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
												/>
											</div>
											<div className="flex items-center gap-2">
												<label className="font-semibold">To</label>
												<input
													type="date"
													value={detailTo}
													onChange={(e) => setDetailTo(e.target.value)}
													className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
												/>
											</div>
											<button
												type="button"
												onClick={() => {
													setDetailFrom("");
													setDetailTo("");
												}}
												className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
											>
												Clear
											</button>
										</div>

										<div className="relative overflow-hidden rounded-lg border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-sm">
											<svg
												viewBox={`0 0 ${width} ${height}`}
												className="w-full h-[260px]"
											>
												<defs>
													<linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
														<stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
														<stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
													</linearGradient>
												</defs>
												{/* grid */}
												{yTicks.map((t, idx) => (
													<line
														key={`gy-${idx}`}
														x1={pad}
														x2={width - pad}
														y1={scaleY(t)}
														y2={scaleY(t)}
														stroke="#e5e7eb"
														strokeWidth="1"
														strokeDasharray="3 4"
													/>
												))}
												{ xTicks.map((t, idx) => (
													<line
														key={`gx-${idx}`}
														x1={scaleX(t)}
														x2={scaleX(t)}
														y1={pad}
														y2={height - pad}
														stroke="#e5e7eb"
														strokeWidth="1"
														strokeDasharray="3 4"
													/>
												))}

												{/* axes */}
												<line
													x1={pad}
													y1={height - pad}
													x2={width - pad}
													y2={height - pad}
													stroke="#d1d5db"
													strokeWidth="1"
												/>
												<line
													x1={pad}
													y1={pad}
													x2={pad}
													y2={height - pad}
													stroke="#d1d5db"
													strokeWidth="1"
												/>

												{/* ticks */}
												{xTicks.map((t, idx) => (
													<g key={`xt-${idx}`}>
														<line
															x1={scaleX(t)}
															x2={scaleX(t)}
															y1={height - pad}
															y2={height - pad + 6}
															stroke="#9ca3af"
															strokeWidth="1"
														/>
														<text
															x={scaleX(t)}
															y={height - pad + 18}
															textAnchor="middle"
															fontSize="10"
															fill="#4b5563"
														>
															{formatDateTick(t)}
														</text>
													</g>
												))}
												{yTicks.map((t, idx) => (
													<g key={`yt-${idx}`}>
														<line
															x1={pad - 6}
															x2={pad}
															y1={scaleY(t)}
															y2={scaleY(t)}
															stroke="#9ca3af"
															strokeWidth="1"
														/>
														<text
															x={pad - 10}
															y={scaleY(t) + 4}
															textAnchor="end"
															fontSize="10"
															fill="#4b5563"
														>
															{kindKey === "steps" ? Math.round(t) : t.toFixed(1)}
														</text>
													</g>
												))}

												{/* bars for steps / sleep */}
												{showBars &&
													barPoints.map((p, idx) => {
														const x = scaleX(p.ts);
														// Keep bars fully to the right of the Y axis and inside chart area
														const xClamped = Math.max(
															pad + barW / 2 + 2,
															Math.min(width - pad - barW / 2 - 2, x)
														);
														const y = scaleY(p.value);
														const h = height - pad - y;
														return (
															<rect
																key={`bar-${idx}`}
																x={xClamped - barW / 2}
																y={y}
																width={barW}
																height={Math.max(2, h)}
																fill="#38bdf8"
																rx={Math.min(10, barW / 2)}
															/>
														);
													})}

												{/* area fill for line charts */}
												{showLine && areaPath && (
													<path d={areaPath} fill="url(#lineArea)" stroke="none" opacity="0.85" />
												)}

												{/* line for heart rate / blood pressure */}
												{showLine && (
													<path
														d={linePath}
														fill="none"
														stroke="#2563eb"
														strokeWidth="2.5"
														strokeLinejoin="round"
														strokeLinecap="round"
													/>
												)}

												{/* dots */}
												{showLine &&
													points.map((p, idx) => (
														<circle
															key={`dot-${idx}`}
															cx={scaleX(p.ts)}
															cy={scaleY(p.value)}
															r="3"
															fill="#1d4ed8"
														/>
													))}
											</svg>
										</div>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-700">
											<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
												<span className="uppercase tracking-wide text-gray-500">
													Samples
												</span>
												<span className="font-semibold text-gray-900">
													{displayPoints.length}
												</span>
											</div>
											<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
												<span className="uppercase tracking-wide text-gray-500">
													Min
												</span>
												<span className="font-semibold text-gray-900">
													{kindKey === "steps" ? Math.round(Math.min(...ys)) : Math.min(...ys).toFixed(1)} {yLabel}
												</span>
											</div>
											<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
												<span className="uppercase tracking-wide text-gray-500">
													Max
												</span>
												<span className="font-semibold text-gray-900">
													{kindKey === "steps" ? Math.round(Math.max(...ys)) : Math.max(...ys).toFixed(1)} {yLabel}
												</span>
											</div>
											<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between">
												<span className="uppercase tracking-wide text-gray-500">
													Range
												</span>
												<span className="font-semibold text-gray-900">
													{kindKey === "steps" ? Math.round(Math.max(...ys) - Math.min(...ys)) : (Math.max(...ys) - Math.min(...ys)).toFixed(1)}{" "}
													{yLabel}
												</span>
											</div>
										</div>
									</div>
								);
							})()
						)}
							</div>
						</div>
					</div>
				</div>
			)}

			{showFilters && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-5xl min-w-[320px] max-h-[90vh] rounded-xl bg-white shadow-xl resize overflow-auto flex flex-col">
						<div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 flex-shrink-0">
							<div className="flex items-center gap-2 text-gray-900 font-semibold">
								<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-gray-700">
									<path fill="currentColor" d="M7 2.75a.75.75 0 0 1 1.5 0V4h7V2.75a.75.75 0 0 1 1.5 0V4h1.25A2.75 2.75 0 0 1 21 6.75v11.5A2.75 2.75 0 0 1 18.25 21H5.75A2.75 2.75 0 0 1 3 18.25V6.75A2.75 2.75 0 0 1 5.75 4H7zm0 3H5.75a1.25 1.25 0 0 0-1.25 1.25V8.5h15v-1.5A1.25 1.25 0 0 0 18.25 5.75H17v.5a.75.75 0 0 1-1.5 0v-.5h-7v.5a.75.75 0 0 1-1.5 0zM4.5 10v8.25c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25V10z" />
							</svg>
								Reference ranges
							</div>
							<button
								onClick={() => setShowFilters(false)}
								className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
							>
								Close
							</button>
						</div>

						<div className="flex-1 overflow-auto px-5 py-4 space-y-4">
							{error && (
								<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
									{error}
									<button onClick={loadRanges} className="ml-3 text-xs underline">
										Retry
									</button>
								</div>
							)}

							{loading ? (
								<div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white">
									<div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
								</div>
							) : enrichedRanges.length === 0 ? (
								<div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
									<p className="text-lg font-semibold text-gray-900">No biomarker ranges available</p>
									<p className="text-gray-600">Once ranges are configured, they will appear here.</p>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{enrichedRanges.map((range) => (
										<div
											key={range.id}
											className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
										>
											<div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${range.accent}`} />

											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-wide text-gray-500">{range.tag}</p>
													<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
														<BiomarkerIcon type={range.biomarker_type} />
														{range.label}
													</h3>
													<p className="text-sm text-gray-600">Unit: {range.unit}</p>
													{(range.info || range.description) && (
														<p className="text-sm text-gray-700 mt-1">
															{range.info || range.description}
														</p>
													)}
												</div>
											</div>

											<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
												<RangePill
													label="Optimal"
													value={formatRange(range.min_optimal, range.max_optimal, range.unit)}
													highlight
												/>
												<RangePill
													label="Normal"
													value={formatRange(range.min_normal, range.max_normal, range.unit)}
												/>
												<RangePill
													label="Critical Low"
													value={formatRange(range.critical_low, null, range.unit)}
												/>
												<RangePill
													label="Critical High"
													value={formatRange(null, range.critical_high, range.unit)}
												/>
											</div>

										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{showInsertChoice && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-md rounded-xl bg-white shadow-xl p-5 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Insert biomarker data</h3>
							<button
								onClick={() => setShowInsertChoice(false)}
								className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
							>
								Close
							</button>
						</div>
						<p className="text-sm text-gray-600">Choose how you want to add a new biomarker reading.</p>
						<div className="space-y-2">
							<button
								onClick={() => {
									setShowInsertChoice(false);
									setManualForm((prev) => ({ ...prev, recorded_at: nowLocal() }));
									setShowManualModal(true);
								}}
								className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 text-left"
							>
								<span className="block text-base">Enter manually</span>
								<span className="block text-xs text-gray-600">Type in a value, unit, and timestamp.</span>
							</button>
							<button
								onClick={async () => {
									setShowInsertChoice(false);
									setDeviceLoading(true);
									try {
										const devicesData = await getMyDevices();
										const devices = Array.isArray(devicesData) ? devicesData : devicesData.devices || [];
										setDeviceList(devices);
										const firstId = devices[0]?.id;
										setDeviceForm((prev) => ({ ...prev, device_id: firstId || "", recorded_at: nowLocal() }));
										setShowDeviceModal(true);
									} catch (err) {
										setDeviceError(err?.message || "Failed to load devices");
									} finally {
										setDeviceLoading(false);
									}
								}}
								className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 text-left"
							>
								<span className="block text-base">Import from device</span>
								<span className="block text-xs text-gray-600">Pull the latest reading from a connected device.</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{showManualModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-lg rounded-xl bg-white shadow-xl p-5 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Manual biomarker entry</h3>
							<button
								onClick={() => setShowManualModal(false)}
								className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
							>
								Close
							</button>
						</div>
						<div className="space-y-3">
							<div className="block text-sm font-semibold text-gray-800">
								<span>Biomarker type</span>
								<select
									value={manualPrimaryType}
									onChange={(e) => {
										const value = e.target.value;
										if (value === "blood_pressure") {
											setManualType(BLOOD_PRESSURE_TYPES[0]);
										} else {
											setManualType(value);
										}
									}}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
								>
									{PRIMARY_TYPE_OPTIONS.map((item) => (
										<option key={item.value} value={item.value}>
											{item.label}
										</option>
									))}
								</select>
							</div>
							{manualPrimaryType === "blood_pressure" && (
								<div className="block text-sm font-semibold text-gray-800 mt-3">
									<span>Blood pressure type</span>
									<select
										value={manualForm.biomarker_type}
										onChange={(e) => setManualType(e.target.value)}
										className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
									>
										{BLOOD_PRESSURE_TYPES.map((key) => (
											<option key={key} value={key}>
												{TYPE_META[key].label}
											</option>
										))}
									</select>
								</div>
							)}

							{manualError && (
								<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
									{manualError}
								</div>
							)}

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<label className="block text-sm font-semibold text-gray-800">
									Value
									<input
										type="number"
										value={manualForm.value}
										onChange={(e) => setManualForm((prev) => ({ ...prev, value: e.target.value }))}
										className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
										placeholder="Enter value"
									/>
								</label>
								<label className="block text-sm font-semibold text-gray-800">
									Unit
									<input
										value={manualForm.unit}
										readOnly
										className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm"
									/>
								</label>
							</div>

							<label className="block text-sm font-semibold text-gray-800">
								<div className="flex items-center justify-between">
									<span>Recorded at</span>
									<button
										type="button"
										onClick={() => setManualForm((prev) => ({ ...prev, recorded_at: nowLocal() }))}
										className="text-xs font-semibold text-blue-600 hover:text-blue-700"
									>
										Use now
									</button>
								</div>
								<input
									type="datetime-local"
									value={manualForm.recorded_at}
									onChange={(e) => setManualForm((prev) => ({ ...prev, recorded_at: e.target.value }))}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
								/>
							</label>

							<label className="block text-sm font-semibold text-gray-800">
								Notes (optional)
								<textarea
									value={manualForm.notes}
									onChange={(e) => setManualForm((prev) => ({ ...prev, notes: e.target.value }))}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
									rows={3}
									placeholder="Taken after morning walk"
								/>
							</label>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								onClick={() => setShowManualModal(false)}
								className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={handleManualSave}
								disabled={manualSaving}
								className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
							>
								{manualSaving ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				</div>
			)}

			{showDeviceModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
					<div className="w-full max-w-lg rounded-xl bg-white shadow-xl p-5 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold text-gray-900">Import from device</h3>
							<button
								onClick={() => setShowDeviceModal(false)}
								className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
							>
								Close
							</button>
						</div>
						<div className="space-y-3">
							<div className="block text-sm font-semibold text-gray-800">
								<span>Biomarker type</span>
								<select
									value={devicePrimaryType}
									onChange={(e) => {
										const value = e.target.value;
										if (value === "blood_pressure") {
											setDeviceType(BLOOD_PRESSURE_TYPES[0]);
										} else {
											setDeviceType(value);
										}
									}}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
								>
									{PRIMARY_TYPE_OPTIONS.map((item) => (
										<option key={item.value} value={item.value}>
											{item.label}
										</option>
									))}
								</select>
							</div>
							{devicePrimaryType === "blood_pressure" && (
								<div className="block text-sm font-semibold text-gray-800 mt-3">
									<span>Blood pressure type</span>
									<select
										value={deviceForm.biomarker_type}
										onChange={(e) => setDeviceType(e.target.value)}
										className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
									>
										{BLOOD_PRESSURE_TYPES.map((key) => (
											<option key={key} value={key}>
												{TYPE_META[key].label}
											</option>
										))}
									</select>
								</div>
							)}

							{deviceError && (
								<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
									{deviceError}
								</div>
							)}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<label className="block text-sm font-semibold text-gray-800">
								Device
								<select
									value={deviceForm.device_id || ""}
									onChange={(e) => setDeviceForm((prev) => ({ ...prev, device_id: e.target.value }))}
									disabled={deviceLoading}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none disabled:opacity-60"
								>
									{(deviceList || []).length === 0 && <option value="">No devices found</option>}
									{(deviceList || []).map((d) => (
										<option key={d.id} value={d.id}>
											{d.device_name || d.id}
										</option>
									))}
								</select>
							</label>
							<label className="block text-sm font-semibold text-gray-800">
								Unit
								<input
									value={deviceForm.unit}
									readOnly
									className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm"
								/>
							</label>
						</div>

							<label className="block text-sm font-semibold text-gray-800">
								<div className="flex items-center justify-between">
									<span>Recorded at</span>
									<button
										type="button"
										onClick={() => setDeviceForm((prev) => ({ ...prev, recorded_at: nowLocal() }))}
										className="text-xs font-semibold text-blue-600 hover:text-blue-700"
									>
										Use now
									</button>
								</div>
								<input
									type="datetime-local"
									value={deviceForm.recorded_at}
									onChange={(e) => setDeviceForm((prev) => ({ ...prev, recorded_at: e.target.value }))}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
								/>
							</label>

							<label className="block text-sm font-semibold text-gray-800">
								Notes (optional)
								<textarea
									value={deviceForm.notes}
									onChange={(e) => setDeviceForm((prev) => ({ ...prev, notes: e.target.value }))}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
									rows={3}
									placeholder="Optional note"
								/>
							</label>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								onClick={() => setShowDeviceModal(false)}
								className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onClick={handleDeviceSave}
								disabled={deviceSaving}
								className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
							>
								{deviceSaving ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
