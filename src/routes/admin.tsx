import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { Users, Clock, CheckCircle, Star, LogOut, ArrowLeft, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });
 
function Admin() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0, avgRating: 0 });
  const [services, setServices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. CEK LOGIN (Session Guard)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setLoading(false);
    });
    
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  // 2. JIKA BELUM LOGIN, TAMPILKAN HALAMAN INI
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Memuat...</p></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Halaman Admin membutuhkan akses terverifikasi. Silakan login terlebih dahulu.
          </p>
          <a href="/login" className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition active:scale-95">
            Login Admin
          </a>
          <Link to="/" className="inline-flex items-center justify-center gap-2 w-full mt-3 text-slate-600 hover:text-slate-800 px-6 py-2 rounded-xl font-semibold transition">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // 3. JIKA SUDAH LOGIN, JALANKAN FETCH DATA
  useEffect(() => {
    fetchData();
    const channel = supabase.channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Stats Harian
    const { count: total } = await supabase.from("queues").select("*", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`);
    const { count: waiting } = await supabase.from("queues").select("*", { count: "exact", head: true }).eq("status", "waiting").gte("created_at", `${today}T00:00:00`);
    const { count: completed } = await supabase.from("queues").select("*", { count: "exact", head: true }).eq("status", "completed").gte("created_at", `${today}T00:00:00`);
    
    // Rata-rata Rating
    const { data: feedbacks } = await supabase.from("feedbacks").select("rating").gte("created_at", `${today}T00:00:00`);
    const avgRating = feedbacks?.length ? (feedbacks.reduce((acc: number, curr: any) => acc + curr.rating, 0) / feedbacks.length).toFixed(1) : "0.0";

    // Grafik Layanan
    const { data: svcData } = await supabase.from("queues").select("service_type").gte("created_at", `${today}T00:00:00`);
    const svcCount: Record<string, number> = {};
    svcData?.forEach((q: any) => { svcCount[q.service_type] = (svcCount[q.service_type] || 0) + 1; });
    const maxVal = Math.max(...Object.values(svcCount), 1);
    setServices(Object.entries(svcCount).map(([name, count]) => ({ name, count, pct: (count / maxVal) * 100 })));

    // Riwayat
    const { data: hist } = await supabase.from("queues").select(`*, feedbacks(rating)`).order("created_at", { ascending: false }).limit(10);
    setHistory(hist || []);
    setStats({ total: total || 0, waiting: waiting || 0, completed: completed || 0, avgRating: parseFloat(avgRating as string) });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Pintar Panel (Admin)</h1>
              <p className="text-xs text-slate-500">Monitoring Real-time & Laporan Harian • {session.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }} 
            className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Hari Ini" value={stats.total} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Menunggu" value={stats.waiting} color="bg-amber-50 text-amber-600" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Selesai" value={stats.completed} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={<Star className="w-5 h-5" />} label="Rata-rata Rating" value={stats.avgRating} color="bg-violet-50 text-violet-600" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Grafik Layanan */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Antrean per Layanan (Hari Ini)</h3>
            <div className="space-y-4">
              {services.length === 0 ? <p className="text-sm text-slate-400">Belum ada data.</p> : services.map((s: any) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{s.name}</span>
                    <span className="text-slate-500">{s.count} orang</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Riwayat Tabel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4">Riwayat Terakhir</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr><th className="text-left p-2">No</th><th className="text-left p-2">Nama</th><th className="text-left p-2">Status</th><th className="text-left p-2">Rating</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h: any) => (
                    <tr key={h.id}>
                      <td className="p-2 font-bold text-blue-600">{h.queue_number}</td>
                      <td className="p-2 text-slate-700">{h.customer_name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${h.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {h.status === 'completed' ? 'Selesai' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="p-2 text-amber-500">
                        {h.feedbacks?.[0]?.rating ? "⭐".repeat(h.feedbacks[0].rating) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}
