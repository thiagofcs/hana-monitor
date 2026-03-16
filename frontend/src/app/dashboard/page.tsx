"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useConnectionStatus } from "@/components/connection-context";
import { ResponsiveGridLayout, useContainerWidth, type ResponsiveLayouts, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";

const API_URL = "http://localhost:3001";
const LAYOUT_STORAGE_KEY = "dashboard-layouts";

const COLOR_MAP: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  orange: "text-orange-400",
  pink: "text-pink-400",
};

interface MetricDefinition {
  id: string;
  name: string;
  unit: string;
  color: string;
  defaultW: number;
  defaultH: number;
}

interface MetricResult {
  metricId: string;
  value: number | null;
  timestamp: string;
  error?: string;
}

function loadLayouts(): ResponsiveLayouts | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function buildDefaultLayouts(metrics: MetricDefinition[]): ResponsiveLayouts {
  const lg: Layout[number][] = [];
  const sm: Layout[number][] = [];
  let xPos = 0;
  let yPos = 0;

  for (const m of metrics) {
    if (xPos + m.defaultW > 12) {
      xPos = 0;
      yPos += 3;
    }
    lg.push({ i: m.id, x: xPos, y: yPos, w: m.defaultW, h: m.defaultH, minW: 2, minH: 2 });
    xPos += m.defaultW;

    sm.push({ i: m.id, x: 0, y: sm.length * 3, w: 6, h: m.defaultH, minW: 2, minH: 2 });
  }

  return { lg, sm };
}

export default function DashboardPage() {
  const [metricDefs, setMetricDefs] = useState<MetricDefinition[]>([]);
  const [metricValues, setMetricValues] = useState<Record<string, MetricResult>>({});
  const [connected, setConnected] = useState(false);
  const [sseError, setSseError] = useState("");
  const [layouts, setLayouts] = useState<ResponsiveLayouts>({});
  const [ready, setReady] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { containerRef, width, mounted } = useContainerWidth();
  const { setStatus, instances, setInstances, selectedId, setSelectedId } = useConnectionStatus();

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  const handleLayoutChange = useCallback((_current: Layout, allLayouts: ResponsiveLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(allLayouts));
  }, []);

  function resetLayout() {
    const defaults = buildDefaultLayouts(metricDefs);
    setLayouts(defaults);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  }

  // Load instances and metric definitions
  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    Promise.all([
      fetch(`${API_URL}/instances`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/metrics`, { headers }).then((r) => r.json()),
    ])
      .then(([instData, metricData]: [{ id: string; name: string }[], MetricDefinition[]]) => {
        setInstances(instData);
        setMetricDefs(metricData);
        if (instData.length > 0) setSelectedId(instData[0].id);

        // Use saved layouts or build from metric defaults
        const saved = loadLayouts();
        if (saved) {
          setLayouts(saved);
        } else {
          setLayouts(buildDefaultLayouts(metricData));
        }
        setReady(true);
      })
      .catch(() => {});
  }, []);

  // SSE connection for the selected instance
  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setMetricValues({});
    setConnected(false);
    setSseError("");

    if (!selectedId) return;

    const url = `${API_URL}/instances/${selectedId}/metrics/stream?token=${encodeURIComponent(getToken())}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data: MetricResult = JSON.parse(event.data);
      if (data.error && !data.metricId) {
        setSseError(data.error);
        setConnected(false);
      } else {
        setConnected(true);
        setSseError("");
        setMetricValues((prev) => ({ ...prev, [data.metricId]: data }));
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [selectedId]);

  const instanceName =
    instances.find((i) => i.id === selectedId)?.name || "—";

  // Sync connection status to header
  useEffect(() => {
    if (selectedId && instanceName) {
      setStatus({ connected, instanceName });
    } else {
      setStatus(null);
    }
    return () => setStatus(null);
  }, [connected, instanceName, selectedId, setStatus]);

  return (
    <div className="max-w-6xl mx-auto" ref={containerRef}>
      {metricDefs.length > 0 && (
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={resetLayout}
            className="px-3 py-2 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            Reset Layout
          </button>
        </div>
      )}

      {sseError && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
          {sseError}
        </div>
      )}

      {instances.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No HANA instances configured.</p>
          <p className="text-gray-500 text-sm mt-1">
            Go to Manage Instances to add one.
          </p>
        </div>
      ) : metricDefs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No metrics defined.</p>
          <p className="text-gray-500 text-sm mt-1">
            Go to Manage Metrics to create your first dashboard metric.
          </p>
        </div>
      ) : ready && mounted ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, sm: 0 }}
          cols={{ lg: 12, sm: 6 }}
          rowHeight={40}
          width={width}
          onLayoutChange={handleLayoutChange}
          dragConfig={{ enabled: true, handle: ".drag-handle" }}
          resizeConfig={{ enabled: true, handles: ["se"] }}
        >
          {metricDefs.map((metric) => {
            const result = metricValues[metric.id];
            const colorClass = COLOR_MAP[metric.color] || "text-gray-400";

            return (
              <div
                key={metric.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="drag-handle flex items-center justify-between px-4 pt-3 pb-1 cursor-grab active:cursor-grabbing">
                  <h3 className="text-gray-400 text-sm font-medium">
                    {metric.name}
                  </h3>
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col justify-center px-4 pb-4">
                  {result?.error ? (
                    <p className="text-red-400 text-sm">{result.error}</p>
                  ) : (
                    <>
                      <p className={`text-2xl font-bold ${colorClass}`}>
                        {result
                          ? `${result.value}${metric.unit ? ` ${metric.unit}` : ""}`
                          : "--"}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {result
                          ? `Last update: ${new Date(result.timestamp).toLocaleTimeString()}`
                          : "Awaiting data"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      ) : null}
    </div>
  );
}
