import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Clock, Volume2 } from "lucide-react";

export const Route = createFileRoute("/petugas")({
  component: Petugas,
});

function Petugas() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard Petugas</h1>
              <p className="text-sm text-slate-500">Loket 1 • Admin</p>
            </div>
          </div>
          <Link to="/" className="text-sm font-medium text-red-500 hover:text-red-600">Keluar</Link>
        </div>

        {/* Daftar Antrean */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Antrean Menunggu</h2>
          
          {/* Card Antrean 1 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">
                A-001
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">Budi Santoso</p>
                <p className="text-sm text-slate-500">Layanan: NPP</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors">
                <Volume2 className="w-4 h-4" /> Panggil
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-green-500/30">
                <CheckCircle className="w-4 h-4" /> Selesai
              </button>
            </div>
          </div>

          {/* Card Antrean 2 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-75">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center text-xl font-bold">
                A-002
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">Siti Aminah</p>
                <p className="text-sm text-slate-500">Layanan: BPJS</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl font-medium flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" /> Menunggu
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
