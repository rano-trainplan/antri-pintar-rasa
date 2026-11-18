import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, User, CreditCard, Phone, ChevronDown, Check, Loader2, Clock, MapPin, ShieldCheck, ArrowRight, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import FeedbackForm from "../components/ui/FeedbackForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Antri Pintar | Sistem Antrean Loket" },
      { name: "description", content: "Ambil tiket dan pantau antrean layanan loket melalui Antri Pintar." },
      { property: "og:title", content: "Antri Pintar | Sistem Antrean Loket" },
      { property: "og:description", content: "Ambil tiket dan pantau antrean layanan loket melalui Antri Pintar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const SERVICES = [
  { value: "NPWP", label: "NPWP", desc: "Nomor Pokok Wajib Pajak", color: "bg-indigo-500" },
  { value: "BP", label: "BP", desc: "Berkas Pensiun", color: "bg-sky-500" },
  { value: "HR", label: "HR", desc: "Human Resources", color: "bg-violet-500" },
  { value: "BPJS", label: "BPJS", desc: "Kesehatan", color: "bg-emerald-500" },
];

function Index() {
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [form, setForm] = useState({ nama: "", nik: "", kontak: "", layanan: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("current_ticket");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTicket(parsed.ticket);
        setPosition(parsed.position);
      } catch {
        localStorage.removeItem("current_ticket");
      }
    }
  }, []);

  useEffect(() => {
    if (ticket) localStorage.setItem("current_ticket", JSON.stringify({ ticket, position }));
    else localStorage.removeItem("current_ticket");
  }, [ticket, position]);

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.nama.trim()) errs["nama"] = "Nama wajib diisi";
    if (!form.nik.trim()) errs["nik"] = "NIK wajib diisi";
    if (!form.layanan) errs["layanan"] = "Pilih layanan";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const { count } = await supabase.from("public_queue_view").select("id", { count: "exact", head: true }).eq("status", "waiting");
    const { data: noAntrean, error: rpcError } = await supabase.rpc('get_next_queue_number');
    if (rpcError || !noAntrean) {
      setLoading(false);
      setErrors({ form: "Gagal mengambil nomor antrean. Coba lagi." });
      return;
    }
    const { data, error } = await supabase.from("queues").insert([{
      queue_number: noAntrean, customer_name: form.nama, customer_id: form.nik,
      contact: form.kontak, service_type: form.layanan, status: "waiting"
    }]).select().single();

    setLoading(false);
    if (error) setErrors({ form: error.message });
    else { setPosition((count ?? 0) + 1); setTicket(data); }
  };

  const reset = () => {
    setTicket(null); setHasFeedback(false);
    setForm({ nama: "", nik: "", kontak: "", layanan: "" });
    setErrors({}); setPosition(null);
  };

  return (
    <div className="relative min-h-screen bg-[#F6F8F5] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-lime-200/50 blur-3xl" />
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@keyframes draw{to{stroke-dashoffset:0}}circle[class*="draw"],path[class*="draw"]{stroke-dasharray:120;stroke-dashoffset:120}`}</style>

      <div className="relative w-full max-w-[420px] space-y-6">
        {ticket ? (
          <>
            <TicketCard ticket={ticket} position={position} onReset={reset} />
            {ticket.status === 'completed' && !hasFeedback && (
              <FeedbackForm queueId={ticket.id} onSuccess={() => { setHasFeedback(true); alert("Terima kasih atas penilaian Anda!"); }} />
            )}
          </>
        ) : (
          <FormCard form={form} updateForm={updateForm} errors={errors} loading={loading} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}

/* ===================== FORM CARD (ala BiteBox) ===================== */
function FormCard({ form, updateForm, errors, loading, onSubmit }: any) {
  return (
    <div className="animate-[fadeUp_.5s_ease] rounded-[32px] bg-white shadow-[0_24px_70px_-30px_rgba(20,40,30,.25)] border border-emerald-50 overflow-hidden">
      {/* HEADER rata kiri */}
      <div className="px-7 pt-8 pb-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/30 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-800">Antri Pintar</span>
        </div>

        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-slate-800">
          Let's get you
          <br />
          <span className="italic text-emerald-600">Antrean cepat</span>
        </h1>
        <p className="mt-2 text-[13px] text-slate-400">Isi data diri untuk mengambil nomor antrean</p>
      </div>

      {/* HERO: preview layanan */}
      <div className="px-7 py-4">
        <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4">
          <p className="text-[13px] font-bold text-emerald-700 text-center">Layanan tersedia hari ini</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SERVICES.map(s => (
              <span key={s.value} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm">
                <span className={`h-2 w-2 rounded-full ${s.color}`} /> {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="px-7 pb-7">
        <form onSubmit={onSubmit} className="space-y-3.5">
          <Input label="Nama Lengkap" icon={<User className="h-4 w-4" />} error={errors.nama}>
            <input value={form.nama} onChange={e => updateForm("nama", e.target.value)} placeholder="Masukkan nama lengkap" className="w-full bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400" />
          </Input>
          <Input label="NIK / Nomor ID" icon={<CreditCard className="h-4 w-4" />} error={errors.nik}>
            <input value={form.nik} onChange={e => updateForm("nik", e.target.value)} placeholder="Masukkan NIK atau ID" className="w-full bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400" />
          </Input>
          <Input label="Nomor Kontak" icon={<Phone className="h-4 w-4" />} optional>
            <input type="tel" value={form.kontak} onChange={e => updateForm("kontak", e.target.value)} placeholder="Contoh: 08123456789" className="w-full bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400" />
          </Input>
          <ServiceSelect value={form.layanan} onChange={v => updateForm("layanan", v)} error={errors.layanan} />

          {errors.form && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-center">{errors.form}</p>}

          {/* Tombol ala BiteBox: hijau + panah kanan */}
          <button type="submit" disabled={loading}
            className="group relative w-full mt-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-4 text-white font-bold text-[15px] shadow-lg shadow-emerald-500/30 transition-all hover:brightness-105 active:scale-[.98] disabled:opacity-60 disabled:active:scale-100 flex items-center justify-between">
            <span className="flex items-center gap-2">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Memproses…</> : <><Sparkles className="h-5 w-5" /> Ambil Antrean</>}
            </span>
            {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Atau</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="text-center">
          <Link to="/petugas" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
            <ShieldCheck className="h-4 w-4" /> Petugas? Masuk Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ===================== INPUT (rounded ala BiteBox) ===================== */
function Input({ label, icon, error, optional, children }: any) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
        {optional && <span className="text-[10px] text-slate-400">opsional</span>}
      </div>
      <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-sm transition-all ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100"}`}>
        <span className="text-slate-400 shrink-0">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 px-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

/* ===================== DROPDOWN MOBILE-SAFE ===================== */
function ServiceSelect({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxH: 260 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = SERVICES.find(s => s.value === value);

  const updatePos = useCallback(() => {
    const btn = btnRef.current; if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const margin = 12;
    const width = Math.min(Math.max(r.width, 200), vw - margin * 2);
    const left = Math.min(Math.max(r.left, margin), vw - width - margin);
    const below = vh - r.bottom - margin;
    const above = r.top - margin;
    const need = 280;
    const openUp = below < need && above > below;
    const maxH = Math.max(140, Math.min(need, openUp ? above : below));
    setPos({ top: openUp ? r.top - maxH - 8 : r.bottom + 8, left, width, maxH });
  }, []);

  useEffect(() => { if (isOpen) { updatePos(); } }, [isOpen, updatePos]);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const reposition = () => updatePos();
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen, updatePos]);

  const handleSelect = (val: string) => { onChange(val); setTimeout(() => setIsOpen(false), 0); };

  return (
    <div>
      <label className="mb-1.5 block px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Pilih Layanan</label>
      <button ref={btnRef} type="button" onClick={() => setIsOpen(o => !o)}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left shadow-sm transition-all ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} ${isOpen ? "border-emerald-400 ring-2 ring-emerald-100" : ""}`}>
        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
        <span className={`flex-1 text-[15px] ${selected ? "text-slate-800" : "text-slate-400"}`}>{selected ? selected.label : "-- Pilih Layanan --"}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div ref={listRef}
          className="z-[9999] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-slate-300/50 animate-[pop_.18s_ease] overflow-y-auto"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxH, overscrollBehavior: "contain" }}>
          {SERVICES.map(s => (
            <button key={s.value} type="button" onClick={() => handleSelect(s.value)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${value === s.value ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.color}`} />
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold text-slate-800 truncate">{s.label}</span>
                <span className="block text-[11px] text-slate-500 truncate">{s.desc}</span>
              </span>
              {value === s.value && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
      {error && <p className="mt-1 px-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

/* ===================== TICKET CARD ===================== */
function TicketCard({ ticket, position, onReset }: any) {
  const svc = SERVICES.find(s => s.value === ticket.service_type);
  const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="animate-[fadeUp_.5s_ease] rounded-[32px] bg-white shadow-[0_24px_70px_-30px_rgba(20,40,30,.25)] border border-emerald-50 overflow-hidden">
      <div className="relative px-7 pt-8 pb-6 text-center bg-gradient-to-b from-emerald-50/70 to-white">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <svg viewBox="0 0 52 52" className="h-9 w-9">
            <circle cx="26" cy="26" r="24" fill="none" stroke="white" strokeWidth="3" className="animate-[draw_.6s_ease_.1s_both]" />
            <path fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M16 27l7 7 14-15" className="animate-[draw_.5s_ease_.5s_both]" />
          </svg>
        </div>
        <h2 className="text-lg font-extrabold text-slate-800">Antrean Berhasil Diambil!</h2>
        <p className="text-[13px] text-slate-500 mt-1">Silakan menunggu nomor Anda dipanggil</p>
      </div>

      <div className="px-7">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 py-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Nomor Antrean</p>
          <p className="mt-1 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-6xl font-black tracking-tighter text-transparent">{ticket.queue_number}</p>
        </div>
      </div>

      <div className="relative my-6 h-px border-t-2 border-dashed border-slate-200 mx-7">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-3 text-[10px] font-bold tracking-widest text-slate-300">TIKET</span>
      </div>

      <div className="px-7 flex items-center justify-between gap-4">
        <div className="space-y-2 text-[13px]">
          <Row icon={<User className="h-3.5 w-3.5" />} label="Nama" value={ticket.customer_name} />
          <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Layanan" value={svc ? `${svc.label} — ${svc.desc}` : ticket.service_type} />
          <Row icon={<Clock className="h-3.5 w-3.5" />} label="Waktu" value={`${time} WIB`} />
          {position != null && <Row icon={<Sparkles className="h-3.5 w-3.5" />} label="Posisi" value={`Antrean ke-${position}`} accent />}
        </div>
        <QrVisual seed={ticket.queue_number} />
      </div>

      <p className="px-7 mt-5 text-center text-[11px] text-slate-400">Tunjukkan kode ini saat dipanggil di loket.</p>

      <div className="px-6 pb-6 pt-5">
        <button onClick={onReset} className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 text-[15px] transition-all active:scale-[.98] flex items-center justify-center gap-2">
          <X className="h-4 w-4" /> Selesai / Antrean Baru
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, value, accent }: any) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-400">{label}:</span>
      <span className={`font-semibold ${accent ? "text-emerald-600" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function QrVisual({ seed }: { seed: string }) {
  const size = 11;
  const cells: boolean[][] = [];
  let h = 2166136261;
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      h ^= (x * 73856093) ^ (y * 19349663) ^ (seed.charCodeAt((x + y) % seed.length) || 7);
      h = Math.imul(h, 16777619);
      row.push(((h >>> 0) % 5) < 2);
    }
    cells.push(row);
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 3; y++) {
      const row = cells[oy + y]; if (!row) continue;
      for (let x = 0; x < 3; x++) row[ox + x] = x === 1 && y === 1 ? true : (x === 0 || x === 2 || y === 0 || y === 2);
    }
  };
  finder(0, 0); finder(size - 3, 0); finder(0, size - 3);

  return (
    <div className="shrink-0 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${size}, 6px)` }}>
        {cells.flat().map((on, i) => <span key={i} className={`h-1.5 w-1.5 rounded-[1px] ${on ? "bg-slate-800" : "bg-transparent"}`} />)}
      </div>
    </div>
  );
}
