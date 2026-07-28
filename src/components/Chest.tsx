import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Inbox, Calendar, Play, Snowflake, Sparkles, CheckCircle, AlertCircle, 
  ChevronRight, ArrowRight, X, Clock, HelpCircle
} from "lucide-react";

interface ChestItem {
  _id: string;
  username: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  commands: string[];
  status: "in_chest" | "delivered";
  createdAt: string;
  deliveredAt?: string;
}

export default function Chest() {
  const [chestItems, setChestItems] = useState<ChestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchChest = async () => {
    try {
      const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/chest", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChestItems(data);
      }
    } catch (err) {
      console.error("Chest fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChest();
  }, []);

  const handleDeliver = async (itemId: string) => {
    setActionLoading(itemId);
    setMessage(null);
    try {
      const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
      const res = await fetch("/api/chest/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        await fetchChest();
      } else {
        setMessage({ text: data.error || "Teslimat sırasında bir hata oluştu.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Sunucu bağlantı hatası oluştu.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const activeItems = chestItems.filter(item => item.status === "in_chest");
  const deliveredItems = chestItems.filter(item => item.status === "delivered");

  const isLoggedIn = !!(localStorage.getItem("koli_token") || localStorage.getItem("zefir_token"));

  if (!isLoggedIn) {
    return (
      <div className="bg-[#111625]/80 backdrop-blur-md rounded-3xl p-12 text-center border border-[#1f293d] shadow-2xl max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#1b2336] text-sky-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-[#2e3c56]">
          <Inbox className="w-8 h-8" />
        </div>
        <div className="space-y-4 mt-6">
          <h2 className="text-2xl font-black text-white">Web Sandığı</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Satın aldığınız rütbe, kasa anahtarı ve özel paketlerinizi görüntüleyip oyuna teslim edebilmek için lütfen oyuncu hesabınızla giriş yapın.
          </p>
          <div className="pt-2">
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                window.location.reload(); // Re-trigger normal page setup or trigger click
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md inline-block"
            >
              Giriş Sayfasına Git
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101e] border border-[#22304d] p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,#3b82f615,transparent_50%)]"></div>
        <div className="absolute top-4 right-4 p-8 opacity-5">
          <Snowflake className="w-32 h-32 animate-spin" style={{ animationDuration: '20s' }} />
        </div>
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md inline-block">
            KİŞİSEL ENVANTER
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">Web Sandığım</h1>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            ZefirCraft mağazasından satın aldığınız VIP rütbeleri, kasa anahtarları veya özel set paketleri bu bölmede güvenle saklanır. Oyuna girdiğinizde tek bir tuşla anında teslim alabilirsiniz!
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl border flex items-start gap-3 shadow-md ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="text-xs font-bold leading-relaxed flex-1">
              {message.text}
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Snowflake className="w-10 h-10 animate-spin text-sky-400 mb-3" />
          <span className="text-xs font-bold text-sky-300">Sandığınız yükleniyor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-[#1b3d54] border-[#1b253b] pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-sky-400" />
                Aktif Bekleyen Eşyalar ({activeItems.length})
              </h2>
            </div>

            {activeItems.length === 0 ? (
              <div className="bg-[#111625]/60 border border-[#1b253b] rounded-3xl p-12 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 bg-[#1b2336] text-slate-500 rounded-xl flex items-center justify-center mx-auto border border-[#2d3a5a]/50">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-white text-sm">Sandığınız Boş</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Şu anda web sandığınızda teslim edilmeyi bekleyen bir ürün bulunmamaktadır. Mağazamızdan ayrıcalıklar satın aldığınızda buraya otomatik eklenecektir.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeItems.map((item) => (
                  <motion.div
                    key={item._id}
                    whileHover={{ y: -3 }}
                    className="bg-[#111625]/75 border border-[#1e2a40] rounded-2xl p-4 shadow-lg flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-[#23314a] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="font-extrabold text-xs md:text-sm text-white truncate" title={item.productName}>
                          {item.productName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                          <span>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-md mt-1 border border-emerald-500/10 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          <span>Kullanıma Hazır</span>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={actionLoading === item._id}
                      onClick={() => handleDeliver(item._id)}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-500/10"
                    >
                      {actionLoading === item._id ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin text-sky-400" />
                          <span>Karaktere Aktarılıyor...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Oyuna Teslim Et</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Delivered List */}
          <div className="lg:col-span-4 space-y-6 bg-[#111625]/60 rounded-3xl p-6 border border-[#1e2a40] shadow-lg">
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Son Teslim Edilenler ({deliveredItems.length})
            </h2>

            {deliveredItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Daha önce teslim edilmiş bir eşya bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {deliveredItems.slice(0, 8).map((item) => (
                  <div key={item._id} className="bg-[#171f33] border border-[#212d46] rounded-xl p-3 flex gap-2.5 items-center">
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 object-cover rounded-lg bg-slate-900 border border-[#22304d] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-slate-200 truncate">{item.productName}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                        {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString("tr-TR") : "Teslim edildi"}
                      </div>
                    </div>
                    <div className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                      Aktif
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
