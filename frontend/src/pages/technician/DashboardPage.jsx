export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard Technicien</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="text-lg font-bold">Tickets en cours</h3><p className="text-3xl font-bold text-orange-600">0</p></div>
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="text-lg font-bold">Résolus</h3><p className="text-3xl font-bold text-green-600">0</p></div>
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="text-lg font-bold">Demandes pièces</h3><p className="text-3xl font-bold text-blue-600">0</p></div>
      </div>
    </div>
  );
}
