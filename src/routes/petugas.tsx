import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Volume2 } from "lucide-react";
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

  // FUNGSI SUARA PANGGILAN
  const suaraPanggilan = (nomorAntrean: string) => {
    if ('speechSynthesis' in window) {
      // Pisahkan huruf dan angka (Contoh: "A-001" jadi "A, nol nol satu" agar terdengar natural)
      const teks = `Nomor antrean ${nomorAntrean.replace('-', ' ').replace('0', 'nol ')}, silakan menuju loket.`;
      
      const speech = new SpeechSynthesisUtterance(teks);
      speech.lang = 'id-ID'; // Set bahasa Indonesia
      speech.rate = 0.9; // Sedikit lebih lambat agar jelas
      
      // Batalkan suara sebelumnya jika sedang berbicara
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    } else {
      alert("Browser Anda tidak mendukung fitur suara.");
    }
  };

  const updateStatus = async (id: string, newStatus: string, nomor: string) => {
    const { error } = await supabase
      .from("queues")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Gagal update status: " + error.message);
    } else {
      // Jika statusnya 'called', bunyikan suara
      if (newStatus === 'called') {
        suaraPanggilan(nomor);
      }
      fetchQueues();
    }
  };

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
          <h2 className="text-lg font-semibold text-slate-800">Daftar Antrean Hari Ini</h2>
          
          {loading ? (
            <p className="text-slate-500">Memuat data antrean...</p>
          ) : queues.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <p className="text-slate-500">Belum ada antrean masuk.</p>
            </div>
          ) : (
            queues.map((q) => (
              <div 
                key={q.id} 
                className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all
                  ${q.status === 'completed' ? 'opacity-50 border-slate-100' : 'border-slate-200'}
                  ${q.status === 'called' ? 'ring-2 ring-blue-500 border-transparent' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold
                    ${q.status === 'waiting' ? 'bg-blue-50 text-blue-600' : 
                      q.status === 'called' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}
                  `}>
                    {q.queue_number}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{q.customer_name}</p>
                    <p className="text-sm text-slate-500">Layanan: {q.service_type}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {q.status === 'waiting' && (
                    <button 
                      onClick={() => updateStatus(q.id, 'called', q.queue_number)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors"
                    >
                      <Volume2 className="w-4 h-4" /> Panggil
                    </button>
                  )}

                  {q.status === 'called' && (
                    <button 
                      onClick={() => updateStatus(q.id, 'completed', q.queue_number)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-green-500/30"
                    >
                      <CheckCircle className="w-4 h-4" /> Selesai
                    </button>
                  )}

                  {q.status === 'completed' && (
                    <span className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-medium flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" /> Selesai
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
