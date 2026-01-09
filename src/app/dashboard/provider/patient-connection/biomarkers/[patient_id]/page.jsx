"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPatientHistoryForProvider } from "@/services/api_calls";

const TYPE_META = {
	heart_rate: { label: "Heart Rate", unit: "bpm" },
	blood_pressure_systolic: { label: "Blood Pressure (Systolic)", unit: "mmHg" },
	blood_pressure_diastolic: { label: "Blood Pressure (Diastolic)", unit: "mmHg" },
	glucose: { label: "Glucose", unit: "mg/dL" },
	steps: { label: "Steps", unit: "steps" },
	sleep: { label: "Sleep", unit: "hours" },
};

const order = [
	"heart_rate",
	"blood_pressure_systolic",
	"blood_pressure_diastolic",
	"glucose",
	"steps",
	"sleep",
];

export default function ProviderPatientBiomarkersPage() {
	const { patient_id: patientId } = useParams();
	const router = useRouter();
	const [historyModal, setHistoryModal] = useState({ open: false, type: null });
	const [historyData, setHistoryData] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState("");
	const [historyMode, setHistoryMode] = useState("list");
	const [rangeFrom, setRangeFrom] = useState("");
	const [rangeTo, setRangeTo] = useState("");

	const openHistory = async (type) => {
		setHistoryModal({ open: true, type });
		setHistoryMode("list");
		setRangeFrom("");
		setRangeTo("");
		try {
			setHistoryLoading(true);
			setHistoryError("");
			const raw = await getPatientHistoryForProvider(patientId, type, { limit: 200 });
			const list = Array.isArray(raw) ? raw : [];
			list.sort((a, b) => new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0));
			setHistoryData(list);
		} catch (err) {
			setHistoryError(err?.message || "Failed to load history");
			setHistoryData([]);
		} finally {
			setHistoryLoading(false);
		}
	};

	const filteredHistory = useMemo(() => {
		return historyData.filter((row) => {
			if (!rangeFrom && !rangeTo) return true;
			if (!row.recorded_at) return false;
			const d = new Date(row.recorded_at);
			if (Number.isNaN(d.getTime())) return false;
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			const key = `${year}-${month}-${day}`;
			if (rangeFrom && key < rangeFrom) return false;
			if (rangeTo && key > rangeTo) return false;
			return true;
		});
	}, [historyData, rangeFrom, rangeTo]);

	const chartPath = useMemo(() => {
		if (historyMode !== "graph" || !filteredHistory.length) return null;
		const points = filteredHistory
			.map((row) => ({
				x: new Date(row.recorded_at || 0).getTime(),
				y: Number(row.value),
			}))
			.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
			.sort((a, b) => a.x - b.x);
		if (!points.length) return null;
		const width = 420;
		const height = 200;
		const pad = 28;
		const xs = points.map((p) => p.x);
		const ys = points.map((p) => p.y);
		const xMin = Math.min(...xs);
		const xMax = Math.max(...xs);
		let yMin = Math.min(...ys);
		let yMax = Math.max(...ys);
		if (yMin === yMax) {
			yMin -= 1;
			yMax += 1;
		} else {
			const span = yMax - yMin;
			yMin -= span * 0.05;
			yMax += span * 0.05;
		}
		const scaleX = (v) => pad + ((v - xMin) / (xMax - xMin || 1)) * (width - pad * 2);
		const scaleY = (v) => height - pad - ((v - yMin) / (yMax - yMin || 1)) * (height - pad * 2);
		const path = points
			.map((p, idx) => `${idx === 0 ? "M" : "L"}${scaleX(p.x)},${scaleY(p.y)}`)
			.join(" ");
		const xTicks = points.length >= 2 ? [xMin, (xMin + xMax) / 2, xMax] : [xMin];
		const yTicks = [yMin, (yMin + yMax) / 2, yMax];
		return {
			width,
			height,
			d: path,
			points: points.map((p) => ({ x: scaleX(p.x), y: scaleY(p.y) })),
			xTicks,
			yTicks,
			scaleX,
			scaleY,
			yLabel: TYPE_META[historyModal.type]?.unit || "",
		};
	}, [filteredHistory, historyMode, historyModal.type]);

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Patient Biomarker History</h1>
					<p className="text-gray-600">Choose a biomarker to review historical readings.</p>
				</div>
				<button
					type="button"
					onClick={() => router.back()}
					className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
				>
					Back
				</button>
			</div>

			<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{order.map((key) => {
						const meta = TYPE_META[key];
						return (
							<div key={key} className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm flex flex-col gap-3">
								<div>
									<p className="text-xs uppercase tracking-wide text-gray-500">{meta.label}</p>
								</div>
								<button
									type="button"
									onClick={() => openHistory(key)}
									className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
								>
									View history
								</button>
							</div>
						);
					})}
				</div>
			</div>

			{historyModal.open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
					<div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl p-6 space-y-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-xs uppercase tracking-wide text-gray-500">History</p>
								<p className="text-lg font-semibold text-gray-900">
									{TYPE_META[historyModal.type]?.label || "Biomarker"}
								</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setHistoryModal({ open: false, type: null });
									setHistoryData([]);
									setHistoryError("");
								}}
								className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
							>
								Close
							</button>
						</div>

						<div className="flex flex-wrap items-center gap-2 text-sm">
							<button
								type="button"
								onClick={() => setHistoryMode("list")}
								className={`rounded-md px-3 py-2 font-semibold border ${historyMode === "list" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
							>
								List view
							</button>
							<button
								type="button"
								onClick={() => setHistoryMode("graph")}
								className={`rounded-md px-3 py-2 font-semibold border ${historyMode === "graph" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
							>
								Graph view
							</button>
						</div>

						<div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
							<span className="font-semibold">Quick ranges:</span>
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
										setRangeFrom(startKey);
										setRangeTo(endKey);
									}}
									className="rounded-full border border-gray-200 bg-white px-2.5 py-1 font-semibold hover:bg-gray-50"
								>
									Last {days} days
								</button>
							))}
						</div>

						<div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
							<div className="flex items-center gap-2">
								<label className="font-semibold">From</label>
								<input
									type="date"
									value={rangeFrom}
									onChange={(e) => setRangeFrom(e.target.value)}
									className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm focus:border-blue-500 focus:outline-none"
								/>
							</div>
							<div className="flex items-center gap-2">
								<label className="font-semibold">To</label>
								<input
									type="date"
									value={rangeTo}
									onChange={(e) => setRangeTo(e.target.value)}
									className="rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm focus:border-blue-500 focus:outline-none"
								/>
							</div>
							<button
								type="button"
								onClick={() => {
									setRangeFrom("");
									setRangeTo("");
								}}
								className="rounded-md border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50"
							>
								Clear
							</button>
						</div>

						{historyLoading && (
							<div className="flex items-center justify-center py-6 text-gray-600">Loading history...</div>
						)}

						{historyError && (
							<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
								{historyError}
							</div>
						)}

						{!historyLoading && !historyError && !filteredHistory.length && (
							<div className="text-sm text-gray-600">No history found.</div>
						)}

						{!historyLoading && !historyError && filteredHistory.length > 0 && (
							<div className="space-y-4">
								{historyMode === "graph" && chartPath && (
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
										<div className="flex items-center justify-between text-xs text-gray-600 px-1">
											<span className="font-semibold">Value over time</span>
											<span>{TYPE_META[historyModal.type]?.unit || ""}</span>
										</div>
										<svg viewBox={`0 0 ${chartPath.width} ${chartPath.height}`} className="w-full h-52">
											{chartPath.yTicks.map((t, idx) => (
												<line
													key={`gy-${idx}`}
													x1={chartPath.scaleX(chartPath.xTicks[0]) - 4}
													x2={chartPath.width - 8}
													y1={chartPath.scaleY(t)}
													y2={chartPath.scaleY(t)}
													stroke="#e5e7eb"
													strokeWidth="1"
													strokeDasharray="3 4"
												/>
											))}
											<path d={`M0,${chartPath.height - 28} H${chartPath.width}`} stroke="#e5e7eb" strokeWidth="1" fill="none" />
											<path d={chartPath.d} stroke="#2563eb" strokeWidth="2" fill="none" />
											{chartPath.points.map((p, idx) => (
												<circle key={idx} cx={p.x} cy={p.y} r="3" fill="#2563eb" />
											))}
											{chartPath.xTicks.map((t, idx) => (
												<text
													key={`xt-${idx}`}
													x={chartPath.scaleX(t)}
													y={chartPath.height - 12}
													textAnchor="middle"
													fontSize="10"
													fill="#6b7280"
												>
													{new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
												</text>
											))}
											{chartPath.yTicks.map((t, idx) => (
												<text
													key={`yt-${idx}`}
													x={14}
													y={chartPath.scaleY(t) + 4}
													textAnchor="start"
													fontSize="10"
													fill="#6b7280"
												>
													{t.toFixed(1)}
												</text>
											))}
											<text
												x={chartPath.width / 2}
												y={chartPath.height - 2}
												textAnchor="middle"
												fontSize="11"
												fill="#4b5563"
											>
												Date
											</text>
											<text
												x={-chartPath.height / 2}
												y={12}
												transform="rotate(-90)"
												textAnchor="middle"
												fontSize="11"
												fill="#4b5563"
											>
												Hours
											</text>
										</svg>
									</div>
								)}

								{historyMode === "list" && (
									<div className="max-h-64 overflow-y-auto divide-y divide-gray-200 rounded-lg border border-gray-200">
										{filteredHistory
											.slice()
											.reverse()
											.map((row) => (
												<div key={row.id} className="px-4 py-3 flex items-center justify-between text-sm">
													<div>
														<p className="font-medium text-gray-900">{row.value} {row.unit}</p>
														<p className="text-xs text-gray-500">{row.source}</p>
													</div>
													<span className="text-xs text-gray-500">{new Date(row.recorded_at).toLocaleString()}</span>
												</div>
											))}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
