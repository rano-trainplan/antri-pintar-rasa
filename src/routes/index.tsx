import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, Ticket, ChevronRight, User, CreditCard, Phone } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Container utama: Mobile-first, dibatasi lebarnya agar rapi di Desktop */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden relative">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-8 text-center text-white relative">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Antri Pintar</h1>
          <p className="text-blue-100 mt-2 text-sm">
            Sistem Pelayanan Loket Cepat & Modern
          </p>
        </div>

        {/* Form Section */}
        <div className="p-6 space-y-5">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Ambil Antrean Anda</h2>
            <p className="text-sm text-slate-500">Isi data diri untuk mendapatkan nomor antrean</p>
          </div>

          <div className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            {/* NIK / ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">NIK / Nomor ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Masukkan NIK atau ID"
                />
              </div>
            </div>

            {/* Nomor HP */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Kontak</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Contoh: 08123456789"
                />
              </div>
            </div>

            {/* Pilih Layanan */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Layanan</label>
              <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none">
                <option value="">-- Pilih Layanan --</option>
                <option value="NPP">NPP (Nomor Pokok Pegawai)</option>
                <option value="BP">BP (Berkas Pensiun)</option>
                <option value="HR">HR (Human Resources)</option>
                <option value="BPJS">BPJS Kesehatan</option>
              </select>
            </div>
          </div>

          {/* Tombol Submit */}
          <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95">
            <QrCode className="w-5 h-5" />
            Ambil Nomor Antrean
          </button>

          {/* Link ke Petugas */}
          <div className="text-center mt-6">
            <Link to="/petugas" className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
              Masuk sebagai Petugas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
