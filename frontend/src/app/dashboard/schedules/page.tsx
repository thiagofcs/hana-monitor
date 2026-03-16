"use client";

import { useEffect, useState, FormEvent } from "react";

const API_URL = "http://localhost:3001";

interface MetricOption {
  id: string;
  name: string;
}

interface InstanceOption {
  id: string;
  name: string;
  host: string;
}

interface Schedule {
  id: string;
  metricId: string;
  instanceId: string;
  intervalSeconds: number;
  enabled: boolean;
  createdAt: string;
  metric: { id: string; name: string; unit: string };
  instance: { id: string; name: string; host: string };
}

interface ScheduleForm {
  metricId: string;
  instanceId: string;
  intervalSeconds: string;
  enabled: boolean;
}

const emptyForm: ScheduleForm = {
  metricId: "",
  instanceId: "",
  intervalSeconds: "60",
  enabled: true,
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [metrics, setMetrics] = useState<MetricOption[]>([]);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function fetchAll() {
    try {
      const [schedRes, metricRes, instRes] = await Promise.all([
        fetch(`${API_URL}/schedules`, { headers: getHeaders() }),
        fetch(`${API_URL}/metrics`, { headers: getHeaders() }),
        fetch(`${API_URL}/instances`, { headers: getHeaders() }),
      ]);
      if (schedRes.ok) setSchedules(await schedRes.json());
      if (metricRes.ok) setMetrics(await metricRes.json());
      if (instRes.ok) setInstances(await instRes.json());
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setForm({
      ...emptyForm,
      metricId: metrics[0]?.id || "",
      instanceId: instances[0]?.id || "",
    });
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(schedule: Schedule) {
    setForm({
      metricId: schedule.metricId,
      instanceId: schedule.instanceId,
      intervalSeconds: String(schedule.intervalSeconds),
      enabled: schedule.enabled,
    });
    setEditingId(schedule.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const url = editingId
        ? `${API_URL}/schedules/${editingId}`
        : `${API_URL}/schedules`;
      const method = editingId ? "PATCH" : "POST";

      const body = editingId
        ? {
            intervalSeconds: parseInt(form.intervalSeconds),
            enabled: form.enabled,
          }
        : {
            metricId: form.metricId,
            instanceId: form.instanceId,
            intervalSeconds: parseInt(form.intervalSeconds),
            enabled: form.enabled,
          };

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to save schedule");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      fetchAll();
    } catch {
      setError("Failed to connect to server");
    }
  }

  async function handleToggle(schedule: Schedule) {
    try {
      await fetch(`${API_URL}/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ enabled: !schedule.enabled }),
      });
      fetchAll();
    } catch {
      setError("Failed to update schedule");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await fetch(`${API_URL}/schedules/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      fetchAll();
    } catch {
      setError("Failed to delete schedule");
    }
  }

  function formatInterval(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60 ? `${seconds % 60}s` : ""}`.trim();
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m ? `${m}m` : ""}`.trim();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Schedules</h2>
        <button
          onClick={openAdd}
          disabled={metrics.length === 0 || instances.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Schedule
        </button>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {(metrics.length === 0 || instances.length === 0) && !loading && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 text-yellow-400 text-sm rounded-lg p-3 mb-4">
          {metrics.length === 0 && "No metrics defined. "}
          {instances.length === 0 && "No instances configured. "}
          Create them first before adding schedules.
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId ? "Edit Schedule" : "Add Schedule"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Metric
                    </label>
                    <select
                      value={form.metricId}
                      onChange={(e) =>
                        setForm({ ...form, metricId: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {metrics.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Instance
                    </label>
                    <select
                      value={form.instanceId}
                      onChange={(e) =>
                        setForm({ ...form, instanceId: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {instances.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.host})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Collection Interval (seconds)
                </label>
                <input
                  type="number"
                  value={form.intervalSeconds}
                  onChange={(e) =>
                    setForm({ ...form, intervalSeconds: e.target.value })
                  }
                  min="5"
                  max="86400"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Min 5s, max 24h (86400s)
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) =>
                    setForm({ ...form, enabled: e.target.checked })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                Enabled
              </label>

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

      {/* Schedules table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : schedules.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No schedules configured yet.</p>
          <p className="text-gray-500 text-sm mt-1">
            Click &quot;Add Schedule&quot; to start collecting historical data.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Metric</th>
                <th className="px-6 py-3 font-medium">Instance</th>
                <th className="px-6 py-3 font-medium">Interval</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-800/50 text-sm"
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(s)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        s.enabled
                          ? "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                          : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                      }`}
                    >
                      {s.enabled ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {s.metric.name}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {s.instance.name}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatInterval(s.intervalSeconds)}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
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
