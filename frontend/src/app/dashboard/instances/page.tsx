"use client";

import { useEffect, useState, FormEvent } from "react";

const API_URL = "http://localhost:3001";

interface HanaInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  useSsl: boolean;
  createdAt: string;
}

interface InstanceForm {
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  useSsl: boolean;
}

const emptyForm: InstanceForm = {
  name: "",
  host: "",
  port: "30015",
  username: "",
  password: "",
  useSsl: false,
};

export default function InstancesPage() {
  const [instances, setInstances] = useState<HanaInstance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InstanceForm>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  function getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function fetchInstances() {
    try {
      const res = await fetch(`${API_URL}/instances`, {
        headers: getHeaders(),
      });
      if (res.ok) setInstances(await res.json());
    } catch {
      setError("Failed to load instances");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(instance: HanaInstance) {
    setForm({
      name: instance.name,
      host: instance.host,
      port: String(instance.port),
      username: instance.username,
      password: "",
      useSsl: instance.useSsl,
    });
    setEditingId(instance.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      host: form.host,
      port: parseInt(form.port),
      username: form.username,
      ...(form.password ? { password: form.password } : {}),
      useSsl: form.useSsl,
    };

    try {
      const url = editingId
        ? `${API_URL}/instances/${editingId}`
        : `${API_URL}/instances`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to save instance");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      fetchInstances();
    } catch {
      setError("Failed to connect to server");
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setTestResult((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch(`${API_URL}/instances/${id}/test`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [id]: data }));
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, message: "Failed to reach server" } }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this instance?")) return;
    try {
      await fetch(`${API_URL}/instances/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      fetchInstances();
    } catch {
      setError("Failed to delete instance");
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Instances</h2>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Instance
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId ? "Edit Instance" : "Add Instance"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Production HANA"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Host</label>
                  <input
                    type="text"
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hana-server.example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SYSTEM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password{editingId ? " (leave blank to keep)" : ""}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...(editingId ? {} : { required: true })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useSsl}
                  onChange={(e) => setForm({ ...form, useSsl: e.target.checked })}
                  className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                Use SSL
              </label>
              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}
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

      {/* Instances table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : instances.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No HANA instances configured yet.</p>
          <p className="text-gray-500 text-sm mt-1">Click &quot;Add Instance&quot; to get started.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Host</th>
                <th className="px-6 py-3 font-medium">Port</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">SSL</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => (
                <tr key={inst.id} className="border-b border-gray-800/50 text-sm">
                  <td className="px-6 py-4 text-white font-medium">{inst.name}</td>
                  <td className="px-6 py-4 text-gray-300">{inst.host}</td>
                  <td className="px-6 py-4 text-gray-300">{inst.port}</td>
                  <td className="px-6 py-4 text-gray-300">{inst.username}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${inst.useSsl ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                      {inst.useSsl ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {testResult[inst.id] && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${testResult[inst.id].success ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                        {testResult[inst.id].message}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleTest(inst.id)}
                      disabled={testingId === inst.id}
                      className="text-yellow-400 hover:text-yellow-300 disabled:text-yellow-800 text-sm mr-3"
                    >
                      {testingId === inst.id ? "Testing..." : "Test"}
                    </button>
                    <button
                      onClick={() => openEdit(inst)}
                      className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id)}
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
