// -*- coding: utf-8 -*-
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function TechnicianLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-60 bg-teal-800 text-white flex flex-col flex-shrink-0">
        <div className="p-5">
          <h2 className="text-lg font-bold tracking-tight">Technicien</h2>
        </div>
        <nav className="flex flex-col flex-1 px-3 space-y-0.5">
          <Link to="/technician" className="py-2.5 px-3 rounded-lg hover:bg-teal-700 transition text-sm">Dashboard</Link>
          <Link to="/technician/tickets" className="py-2.5 px-3 rounded-lg hover:bg-teal-700 transition text-sm">Tickets</Link>
          <Link to="/technician/parts" className="py-2.5 px-3 rounded-lg hover:bg-teal-700 transition text-sm">Demandes pieces</Link>
        </nav>
        <div className="p-4 border-t border-teal-700">
          <p className="text-xs mb-2">{user?.full_name}</p>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-xs">
            Deconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  );
}
