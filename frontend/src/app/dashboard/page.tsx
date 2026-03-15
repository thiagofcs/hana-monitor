"use client";

import { useEffect, useState, useRef } from "react";

const API_URL = "http://localhost:3001";

interface HanaInstance {
  id: string;
  name: string;
}

interface MemoryMetrics {
  memoryUsageGb: number;
  timestamp: string;
  error?: string;
}

export default function DashboardPage() {
  const [instances, setInstances] = useState<HanaInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [sseError, setSseError] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  function getToken() {
    return localStorage.getItem("token") || "";
  }

  useEffect(() => {
    fetch(`${API_URL}/instances`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then((res) => res.json())
      .then((data: HanaInstance[]) => {
        setInstances(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Cleanup previous connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setMetrics(null);
    setConnected(false);
    setSseError("");

    if (!selectedId) return;

    const url = `${API_URL}/instances/${selectedId}/metrics/memory?token=${encodeURIComponent(getToken())}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        setSseError(data.error);
        setConnected(false);
      } else {
        setMetrics(data);
        setConnected(true);
        setSseError("");
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        {instances.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {instances.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {instances.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No HANA instances configured.</p>
          <p className="text-gray-500 text-sm mt-1">
            Go to Manage Instances to add one.
          </p>
        </div>
      ) : (
        <>
          {sseError && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
              {sseError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connection Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-medium">
                Connection Status
              </h3>
              <p
                className={`text-2xl font-bold mt-2 ${
                  connected ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {connected ? "Connected" : "Connecting..."}
              </p>
              <p className="text-gray-500 text-sm mt-1">{instanceName}</p>
            </div>

            {/* Memory Usage */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-medium">
                Memory Usage
              </h3>
              <p className="text-2xl font-bold text-blue-400 mt-2">
                {metrics ? `${metrics.memoryUsageGb} GB` : "--"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {metrics
                  ? `Last update: ${new Date(metrics.timestamp).toLocaleTimeString()}`
                  : "Awaiting data"}
              </p>
            </div>

            {/* CPU Usage — placeholder */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-medium">CPU Usage</h3>
              <p className="text-2xl font-bold text-gray-500 mt-2">--</p>
              <p className="text-gray-500 text-sm mt-1">Coming soon</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
