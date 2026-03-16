"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface HanaInstance {
  id: string;
  name: string;
}

interface ConnectionStatus {
  connected: boolean;
  instanceName: string;
}

interface ConnectionContextType {
  status: ConnectionStatus | null;
  setStatus: (status: ConnectionStatus | null) => void;
  instances: HanaInstance[];
  setInstances: (instances: HanaInstance[]) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  status: null,
  setStatus: () => {},
  instances: [],
  setInstances: () => {},
  selectedId: "",
  setSelectedId: () => {},
});

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [instances, setInstances] = useState<HanaInstance[]>([]);
  const [selectedId, setSelectedId] = useState("");
  return (
    <ConnectionContext.Provider value={{ status, setStatus, instances, setInstances, selectedId, setSelectedId }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionStatus() {
  return useContext(ConnectionContext);
}
