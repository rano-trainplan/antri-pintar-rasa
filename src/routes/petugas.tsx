import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, CheckCircle, Volume2, Users, Clock, Activity, LogOut,
  Zap, Ticket, RefreshCw, Search, ChevronsRight, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/petugas")({ component: Petugas });

type Status = "waiting" | "called" | "completed" | "skipped";

type QueueItem = {
  id: string;
  queue_number: string;
  customer_name: string;
  customer_id: string | null;
  contact: string | null;
  service_type: string;
  status: Status;
  loket?: string | null;
  created_at: string;
  called_at?: string | null;
  completed_at?: string | null;
};

const PAGE_SIZE = 5;

function Petugas() {
  const navigate = useNavigate();
  const loket = "1";

  // SEMUA HOOKS DI SINI (harus di urutan yang sama setiap render)
  const [session, setSession] = useState<any>(null);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Session guard
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

  // Fetch queues (hanya jalan kalau sudah login)
  const fetchQueues = async () => {
    if (!session) return;
    const { data } = await supabase
      .from("queues")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setQueues(data as QueueItem[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    fetchQueues();
    const ch = supabase.channel("public:queues")
      .on("postgres_changes", { event: "*", schema: "public", table: "queues" }, fetchQueues)
      .subscribe();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => { 
      supabase.removeChannel(ch); 
      clearInterval(t); 
    };
  }, [session]);

  // Suara panggilan
  const suaraPanggilan = (nomor: string, nama: string, lk: string = loket) => {
    if (!("speechSynthesis" in window)) return;
    const teks = `Nomor antrean ${nomor.replace("-", " ").replace(/0/g, "nol ")}, atas nama ${nama}, silakan menuju ke loket ${lk}.`;
    const s = new SpeechSynthesisUtterance(teks);
    s.lang = "id-ID"; 
    s.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(s);
  };

  // Update status
  const updateStatus = async (id: string, newStatus: Status, nomor: string, nama: string, lk: string = loket) => {
    const patch: any = { status: newStatus, loket: lk };
    if (newStatus === "completed") patch.completed_at = new Date().toISOString();
    if (newStatus === "called") patch.called_at = new Date().toISOString();
    const { error } = await supabase.from("queues").update(patch).eq("id", id);
    if (!error) {
      if (newStatus === "called") suaraPanggilan(nomor, nama, lk);
      fetchQueues();
    }
  };

  const callNext = () => {
    const next = queues.find(q => q.status === "waiting");
    if (next) updateStatus(next.id, "called", next.queue_number, next.customer_name);
  };

  // Derived state
  const waiting = queues.filter(q => q.status === "waiting");
  const current = queues.find(q => q.status === "called");
  const completed = queues.filter(q => q.status === "completed");
  const skipped = queues.filter(q => q.status === "skipped");

  const avgMin = useMemo(() => {
    const withTime = completed.filter(q => q.completed_at && q.created_at);
    if (!withTime.length) return "0";
    const total = withTime.reduce((s, q) =>
      s + (new Date(q.completed_at!).getTime() - new Date(q.created_at).getTime()) / 60000, 0);
    return (total / withTime.length).toFixed(1);
  }, [completed]);

  const counts = { 
    all: queues.length, 
    waiting: waiting.length, 
    completed: completed.length, 
    skipped: skipped.length 
  };

  const visible = useMemo(() => {
    let list = filter === "all" ? queues : queues.filter(q => q.status === filter);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(q =>
        q.customer_name?.toLowerCase().includes(s) ||
        q.queue_number?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [queues, filter, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = visible.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Helpers UI
  const maskNik = (nik?: string | null) =>
    nik && nik.length >= 8 ? `${nik.slice(0, 4)}${"*".repeat(nik.length - 8)}${nik.slice(-4)}` : "—";

  const serviceBadge = (type: string) => {
    const t = (type || "").toUpperCase();
    if (t.includes("NPWP")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (t.includes("BP")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (t.includes("HR")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (t.includes("BPJS")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const statusBadge = (q: QueueItem) => {
    const currentLoket = q.loket || loket;
    switch (q.status) {
      case "called": return <span className="inline-flex items-center gap-1.5 text-blue-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Dipanggil di Loket {currentLoket}</span>;
      case "waiting": return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-semibold">Menunggu</span>;
      case "completed": return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-semibold">Selesai</span>;
      case "skipped": return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-semibold">Dilewat</span>;
      default: return null;
    }
  };

  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  const waitMin = current?.created_at ? Math.max(0, Math.round((now.getTime() - new Date(current.created_at).getTime()) / 60000)) : null;

  // CONDITIONAL RETURN SETELAH SEMUA HOOKS
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p>Memuat...</p></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-slate-200 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            Halaman Admin membutuhkan akses terverifikasi. Silakan login terlebih dahulu.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 w-full bg-[#4A7C2F] hover:bg-[#3d6826] text-white px-6 py-3 rounded-xl font-bold transition active:scale-95">
            Login Petugas
          </Link>
          <Link to="/" className="inline-flex items-center justify-center gap-2 w-full mt-3 text-slate-600 hover:text-slate-800 px-6 py-2 rounded-xl font-semibold transition">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // RENDER UTAMA
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">Dashboard Petugas</h1>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Aktif Melayani
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Loket {loket} • Petugas: {session.user?.email || "User"} • Layanan Perizinan & NPP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 capitalize">{dateStr}</p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">{timeStr} WIB</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition">
            <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Pindah Loket</span>
          </button>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }} 
            className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat icon={<Ticket className="w-5 h-5" />} tint="slate" label="Total Tiket" value={queues.length} unit="orang" />
          <Stat icon={<Activity className="w-5 h-5" />} tint="blue" label="Aktif Dipanggil" value={current?.queue_number || "—"} big />
          <Stat icon={<Clock className="w-5 h-5" />} tint="amber" label="Sisa Menunggu" value={waiting.length} unit="antrean" />
          <Stat icon={<CheckCircle className="w-5 h-5" />} tint="emerald" label="Telah Selesai" value={completed.length} unit="selesai" />
          <Stat icon={<Zap className="w-5 h-5" />} tint="violet" label="Rerata Layanan" value={`${avgMin}`} unit="menit" />
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
          <div className="flex items-center gap-6 flex-1 w-full">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 text-center shrink-0">
              <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Nomor Antrean</p>
              <p className={`text-4xl font-black leading-tight ${current ? "text-blue-600" : "text-slate-300"}`}>
                {current?.queue_number || "---"}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">Loket {loket}</p>
            </div>
            <div className="min-w-0 flex-1">
              {current ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 flex-wrap">
                    <span className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded">Sedang Dipanggil</span>
                    {current.created_at && (
                      <span>• Ambil: {new Date(current.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB {waitMin !== null && `(Tunggu ${waitMin} mnt)`}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 truncate">{current.customer_name}</h2>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Layanan: {current.service_type} &nbsp;•&nbsp; ID: {current.id.slice(0, 8).toUpperCase()}
                  </p>
                </>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-400">Belum ada antrean dipanggil</h2>
                  <p className="text-sm text-slate-400 mt-1">Tekan "Panggil Berikutnya" untuk memulai.</p>
                </div>
              )}
            </div>
          </div>

          {current && (
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button onClick={() => suaraPanggilan(current.queue_number, current.customer_name)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition active:scale-95 text-sm">
                <Volume2 className="w-4 h-4" /> Panggil
              </button>
              <button onClick={() => updateStatus(current.id, "completed", current.queue_number, current.customer_name)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold transition active:scale-95 text-sm">
                <CheckCircle className="w-4 h-4" /> Selesai
              </button>
              <button onClick={() => updateStatus(current.id, "skipped", current.queue_number, current.customer_name)} title="Lewati"
                className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition active:scale-95">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Daftar Antrean Hari Ini</h2>
              <p className="text-xs text-slate-500">Kelola urutan antrean pengunjung pada loket pelayanan aktif</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([["all", "Semua"], ["waiting", "Menunggu"], ["completed", "Selesai"], ["skipped", "Dilewat"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => { setFilter(k); setPage(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${filter === k ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                  {label} ({counts[k]})
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Cari nama atau nomor tiket..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <button onClick={callNext} disabled={!waiting.length}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-sm transition active:scale-95">
              <Volume2 className="w-4 h-4" /> Panggil Berikutnya ({waiting[0]?.queue_number || "—" })
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">No. Tiket</th>
                  <th className="text-left px-4 py-3 font-semibold">Nama Pengunjung</th>
                  <th className="text-left px-4 py-3 font-semibold">Layanan</th>
                  <th className="text-left px-4 py-3 font-semibold">Waktu Ambil</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Memuat data...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Tidak ada data antrean.</td></tr>
                ) : paged.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs">{q.queue_number}</span></td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{q.customer_name}</p>
                      <p className="text-xs text-slate-400">ID: {maskNik(q.customer_id)}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`border px-2.5 py-1 rounded-md text-xs font-semibold ${serviceBadge(q.service_type)}`}>{q.service_type}</span></td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums text-xs">{q.created_at ? new Date(q.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) : "—"} WIB</td>
                    <td className="px-4 py-3">{statusBadge(q)}</td>
                    <td className="px-4 py-3 text-right">
                      {q.status === "called" && (
                        <button onClick={() => suaraPanggilan(q.queue_number, q.customer_name)} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition"><Volume2 className="w-3.5 h-3.5" />Panggil Ulang</button>
                      )}
                      {(q.status === "waiting" || q.status === "skipped") && (
                        <button onClick={() => updateStatus(q.id, "called", q.queue_number, q.customer_name)} className="inline-flex items-center gap-1.5 text-blue-600 hover:text-white font-semibold text-xs border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-600 transition"><Volume2 className="w-3.5 h-3.5" />Panggil</button>
                      )}
                      {q.status === "completed" && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Menampilkan {visible.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, visible.length)} dari {visible.length} antrean</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"><ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="flex items-center gap-1 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Selanjutnya <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, tint, label, value, unit, big }: { icon: React.ReactNode, tint: string, label: string, value: string | number, unit?: string, big?: boolean }) {
  const map: Record<string, string> = {
    slate: "bg-slate-50 text-slate-600", blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600", emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${map[tint] || map.slate}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
        <p className={`font-black text-slate-800 leading-tight ${big ? "text-xl" : "text-2xl"}`}>
          {value} {unit && !big && <span className="text-[11px] font-medium text-slate-400 ml-0.5">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
