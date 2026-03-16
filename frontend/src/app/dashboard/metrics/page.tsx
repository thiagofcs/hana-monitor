"use client";

import { useEffect, useState, FormEvent } from "react";

const API_URL = "http://localhost:3001";

const COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-400" },
  { value: "green", label: "Green", class: "bg-green-400" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-400" },
  { value: "red", label: "Red", class: "bg-red-400" },
  { value: "purple", label: "Purple", class: "bg-purple-400" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-400" },
  { value: "orange", label: "Orange", class: "bg-orange-400" },
  { value: "pink", label: "Pink", class: "bg-pink-400" },
];

interface Metric {
  id: string;
  name: string;
  query: string;
  unit: string;
  refreshInterval: number;
  color: string;
  defaultW: number;
  defaultH: number;
}

interface MetricForm {
  name: string;
  query: string;
  unit: string;
  refreshInterval: string;
  color: string;
  defaultW: string;
  defaultH: string;
}

const emptyForm: MetricForm = {
  name: "",
  query: "",
  unit: "",
  refreshInterval: "5",
  color: "blue",
  defaultW: "4",
  defaultH: "3",
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MetricForm>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function fetchMetrics() {
    try {
      const res = await fetch(`${API_URL}/metrics`, { headers: getHeaders() });
      if (res.ok) setMetrics(await res.json());
    } catch {
      setError("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(metric: Metric) {
    setForm({
      name: metric.name,
      query: metric.query,
      unit: metric.unit,
      refreshInterval: String(metric.refreshInterval),
      color: metric.color,
      defaultW: String(metric.defaultW),
      defaultH: String(metric.defaultH),
    });
    setEditingId(metric.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      query: form.query,
      unit: form.unit,
      refreshInterval: parseInt(form.refreshInterval),
      color: form.color,
      defaultW: parseInt(form.defaultW),
      defaultH: parseInt(form.defaultH),
    };

    try {
      const url = editingId
        ? `${API_URL}/metrics/${editingId}`
        : `${API_URL}/metrics`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to save metric");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      fetchMetrics();
    } catch {
      setError("Failed to connect to server");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this metric?")) return;
    try {
      await fetch(`${API_URL}/metrics/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      fetchMetrics();
    } catch {
      setError("Failed to delete metric");
    }
  }

  const colorDot = (color: string) => {
    const c = COLORS.find((c) => c.value === color);
    return c ? c.class : "bg-gray-400";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Metrics</h2>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Metric
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId ? "Edit Metric" : "Add Metric"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Memory Usage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  SQL Query
                </label>
                <textarea
                  value={form.query}
                  onChange={(e) => setForm({ ...form, query: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder={'SELECT ROUND(...) AS "Value"\nFROM M_HOST_RESOURCE_UTILIZATION'}
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Query must return a single row with one numeric column.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="GB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Refresh (seconds)
                  </label>
                  <input
                    type="number"
                    value={form.refreshInterval}
                    onChange={(e) =>
                      setForm({ ...form, refreshInterval: e.target.value })
                    }
                    min="1"
                    max="300"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Color
                  </label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Default Width (grid units)
                  </label>
                  <input
                    type="number"
                    value={form.defaultW}
                    onChange={(e) =>
                      setForm({ ...form, defaultW: e.target.value })
                    }
                    min="2"
                    max="12"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Default Height (grid units)
                  </label>
                  <input
                    type="number"
                    value={form.defaultH}
                    onChange={(e) =>
                      setForm({ ...form, defaultH: e.target.value })
                    }
                    min="2"
                    max="8"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : metrics.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No metrics defined yet.</p>
          <p className="text-gray-500 text-sm mt-1">
            Click &quot;Add Metric&quot; to create your first dashboard metric.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="px-6 py-3 font-medium">Color</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Interval</th>
                <th className="px-6 py-3 font-medium">Size</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-gray-800/50 text-sm"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${colorDot(m.color)}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {m.name}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {m.unit || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{m.refreshInterval}s</td>
                  <td className="px-6 py-4 text-gray-300">
                    {m.defaultW}x{m.defaultH}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
