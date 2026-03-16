"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { ConnectionProvider, useConnectionStatus } from "@/components/connection-context";

function HeaderLeft() {
  const { status, instances, selectedId, setSelectedId } = useConnectionStatus();
  return (
    <div className="flex items-center gap-4">
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
      {status && (
        <div className={`text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-2 ${
          status.connected
            ? "bg-green-900/20 text-green-400 border border-green-800/50"
            : "bg-yellow-900/20 text-yellow-400 border border-yellow-800/50"
        }`}>
          <span className={`inline-block w-2 h-2 rounded-full ${status.connected ? "bg-green-400" : "bg-yellow-400"}`} />
          {status.connected ? "Connected" : "Connecting..."}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (!token || !storedUsername) {
      router.push("/");
      return;
    }
    setUsername(storedUsername);
    setReady(true);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/");
  }

  if (!ready) return null;

  return (
    <ConnectionProvider>
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <HeaderLeft />
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              Logged in as{" "}
              <span className="text-white font-medium">{username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
    </ConnectionProvider>
  );
}
