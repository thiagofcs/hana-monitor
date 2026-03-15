export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium">Database Status</h3>
          <p className="text-2xl font-bold text-yellow-400 mt-2">Not Connected</p>
          <p className="text-gray-500 text-sm mt-1">SAP HANA connection pending</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium">CPU Usage</h3>
          <p className="text-2xl font-bold text-gray-500 mt-2">--</p>
          <p className="text-gray-500 text-sm mt-1">Awaiting data source</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium">Memory Usage</h3>
          <p className="text-2xl font-bold text-gray-500 mt-2">--</p>
          <p className="text-gray-500 text-sm mt-1">Awaiting data source</p>
        </div>
      </div>
    </div>
  );
}
