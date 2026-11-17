import { useState } from "react";
import { Star, Send } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

export default function FeedbackForm({ queueId, onSuccess }: { queueId: string; onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return alert("Pilih rating bintang dulu!");
    setLoading(true);
    const { error } = await supabase.from("feedbacks").insert({ queue_id: queueId, rating, comment });
    setLoading(false);
    if (!error) onSuccess();
    else alert("Gagal mengirim feedback: " + error.message);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-100 max-w-md mx-auto mt-6 animate-[fadeUp_.5s_ease]">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Bagaimana pelayanan kami?</h3>
      <p className="text-sm text-slate-500 mb-4">Beri rating untuk membantu kami meningkatkan layanan.</p>
      
      <div className="flex gap-2 mb-4 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
            <Star className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Komentar (opsional)..."
        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4 resize-none"
        rows={3}
      />

      <button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition active:scale-95 disabled:opacity-50">
        <Send className="w-4 h-4" /> {loading ? "Mengirim..." : "Kirim Penilaian"}
      </button>
    </div>
  );
}
