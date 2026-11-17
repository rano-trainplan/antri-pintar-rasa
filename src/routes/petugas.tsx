import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Volume2, Users, Clock, Activity, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/petugas")({
  component: Petugas, 
});

function Petugas() {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueues = async () => {
    const { data, error } = await supabase
      .from("queues")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setQueues(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueues();
    const subscription = supabase
      .channel('public:queues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const suaraPanggilan = (nomorAntrean: string, nama: string, loket: string = "1") => {
    if ('speechSynthesis' in window) {
      const teks = `Nomor antrean ${nomorAntrean.replace('-', ' ').replace('0', 'nol ')}, atas nama ${nama}, silakan menuju ke loket ${loket}.`;
      const speech = new SpeechSynthesisUtterance(teks);
      speech.lang = 'id-ID'; 
      speech.rate = 0.85; 
      window.speechSynthesis.cancel(); 
      window.speechSynthesis.speak(speech);
    }
  };

  const updateStatus = async (id: string, newStatus: string, nomor: string, nama: string) => {
    const { error } = await supabase
      .from("queues")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      if (newStatus === 'called') {
        suaraPanggilan(nomor, nama, "1"); 
      }
      fetchQueues();
    }
  };

  // Hitung statistik
  const totalAntrean = queues.length;
  const menunggu = queues.filter(q => q.status === 'waiting').length;
  const selesai = queues.filter(q => q.status === 'completed').length;
  
  // Ambil antrean yang sedang dipanggil (jika ada)
  const currentCalled = queues.find(q => q.status === 'called');
  const waitingList = queues.filter(q => q.status === 'waiting');

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-10">
      
      {/* HEADER TOP BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Pintar Panel</h1>
            <p className="text-xs font-medium text-slate-500">Loket 1 • Sistem Pelayanan</p>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-lg transition-all">
          <LogOut className="w-4 h-4" /> Keluar
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        
        {/* STATISTIK CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Antrean</p>
              <h3 className="text-3xl font-black text-slate-800">{totalAntrean}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Menunggu</p>
              <h3 className="text-3xl font-black text-slate-800">{menunggu}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Selesai</p>
              <h3 className="text-3xl font-black text-slate-800">{selesai}</h3>
            </div>
          </div>
        </div>

        {/* PANEL PANGGILAN AKTIF */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm font-bold text-slate-400 tracking-wider uppercase mb-2">Sedang Dipanggil</p>
              <h2 className={`text-6xl font-black tracking-tighter ${currentCalled ? 'text-blue-600' : 'text-slate-300'}`}>
                {currentCalled ? currentCalled.queue_number : "---"}
              </h2>
            </div>
            <div className="h-16 w-px bg-slate-200 hidden md:block"></div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{currentCalled ? currentCalled.customer_name : "Menunggu Antrean"}</h3>
              <p className="text-slate-500 font-medium">{currentCalled ? `Layanan: ${currentCalled.service_type}` : "Silakan panggil antrean berikutnya"}</p>
            </div>
          </div>
          
          {currentCalled && (
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => updateStatus(currentCalled.id, 'completed', currentCalled.queue_number, currentCalled.customer_name)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
              >
                <CheckCircle className="w-5 h-5" /> Selesaikan Layanan
              </button>
            </div>
          )}
        </div>

        {/* DAFTAR ANTREAN MENUNGGU */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Daftar Antrean Menunggu</h2>
            <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-sm font-bold">{waitingList.length} Antrean</span>
          </div>
          
          {loading ? (
             <div className="text-center py-10 text-slate-500">Memuat data...</div>
          ) : waitingList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-lg">Tidak ada antrean yang menunggu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingList.map((q) => (
                <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{q.customer_name}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> {q.service_type}
                      </p>
                    </div>
                    <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-black text-lg">
                      {q.queue_number}
                    </div>
                  </div>
                  <button 
                    onClick={() => updateStatus(q.id, 'called', q.queue_number, q.customer_name)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white py-3 rounded-xl font-bold transition-all active:scale-95"
                  >
                    <Volume2 className="w-5 h-5" /> Panggil ke Loket
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
