declare module 'hdb' {
  interface ClientOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    useTLS?: boolean;
  }

  interface Client {
    connect(callback: (err: Error | null) => void): void;
    exec(sql: string, callback: (err: Error | null, rows: Record<string, unknown>[]) => void): void;
    end(): void;
    disconnect(): void;
  }

  export function createClient(options: ClientOptions): Client;
}
