"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";

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
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-end">
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
  );
}
