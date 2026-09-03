import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import LazyImage from "./LazyImage";
import ScrollReveal from "./ScrollReveal";
import {
  Copy, Users, Shield, Server, Award, Sparkles, Check, ChevronRight, ChevronDown,
  Calendar, Eye, Trash2, PlusCircle, Volume2, Package, Inbox, HelpCircle, 
  ArrowRight, MessageSquare, AlertCircle, CheckCircle, X, ShoppingBag, Gamepad2, Flame, Boxes, ExternalLink, Coins
} from "lucide-react";
const logoSrc = "/logo.png";

interface Article {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  views: number;
}

interface TopUser {
  rank: number;
  username: string;
  credits: number;
}

interface HomeProps {
  onNavigate: (page: string) => void;
  wheelEnabled?: boolean;
  earnEnabled?: boolean;
}

export default function Home({ onNavigate, wheelEnabled = true, earnEnabled = true }: HomeProps) {
  const [copied, setCopied] = useState(false);
  const [serverStats, setServerStats] = useState({
    online: true,
    players: { online: 34, max: 150 },
    version: "1.21.4"
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [webVisitorsCount, setWebVisitorsCount] = useState<number>(1);

  // LeaderOS dynamic data
  const [articles, setArticles] = useState<Article[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [chestCount, setChestCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // New Article Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Detailed article modal state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [ip, setIp] = useState("zefircraft.ddns.net");

  // Fetch dynamic server IP from server-status
  useEffect(() => {
    fetch("/api/server-status")
      .then(res => res.json())
      .then(data => {
        if (data && data.serverIp) {
          setIp(data.serverIp);
        }
      })
      .catch(() => {});
  }, []);

  // Check Admin & logged-in player
  useEffect(() => {
    const adminToken = localStorage.getItem("koli_admin_token") || localStorage.getItem("zefir_admin_token");
    if (adminToken) {
      setIsAdmin(true);
    }

    const playerToken = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
    if (playerToken) {
      // Get current player chest items count
      fetch("/api/chest", {
        headers: { Authorization: `Bearer ${playerToken}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          if (Array.isArray(data)) {
            const inChest = data.filter((item: any) => item.status === "in_chest").length;
            setChestCount(inChest);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch News & Stats
  const fetchNewsAndStats = async () => {
    try {
      const artRes = await fetch("/api/articles");
      if (artRes.ok) {
        const data = await artRes.json();
        setArticles(data);
      }

      const statRes = await fetch("/api/stats/top-credits");
      if (statRes.ok) {
        const data = await statRes.json();
        setTopUsers(data);
      }

      const purchaseRes = await fetch("/api/purchases/recent");
      if (purchaseRes.ok) {
        const data = await purchaseRes.json();
        setRecentPurchases(data);
      }
    } catch (err) {
      console.error("Home data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNewsAndStats();

    const fetchVisitors = async () => {
      try {
        const res = await fetch("/api/stats/online-visitors");
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.total === "number") {
            setWebVisitorsCount(data.total);
          }
        }
      } catch (e) {}
    };

    fetchVisitors();
    const visitorInterval = setInterval(fetchVisitors, 6000);
    return () => clearInterval(visitorInterval);
  }, []);

  // Fetch live Minecraft server stats
  useEffect(() => {
    let active = true;
    fetch("/api/stats/server")
      .then(res => res.json())
      .then(data => {
        if (active) {
          if (data && data.online !== undefined) {
            setServerStats({
              online: data.online,
              players: {
                online: data.players?.online || 0,
                max: data.players?.max || 100
              },
              version: data.version || "1.21.4"
            });
          }
          setLoadingStats(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoadingStats(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newTitle.trim() || !newContent.trim()) {
      setFormError("Başlık ve içerik alanları boş bırakılamaz.");
      return;
    }

    try {
      const adminToken = localStorage.getItem("zefir_admin_token");
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          imageUrl: newImage.trim() || "https://images.unsplash.com/photo-1607988795691-3d0147b43231?w=800"
        })
      });

      if (res.ok) {
        setFormSuccess("Duyuru başarıyla eklendi.");
        setNewTitle("");
        setNewContent("");
        setNewImage("");
        fetchNewsAndStats();
        setTimeout(() => setShowAddForm(false), 1200);
      } else {
        const errData = await res.json();
        setFormError(errData.error || "Duyuru eklenirken bir hata oluştu.");
      }
    } catch {
      setFormError("Duyuru eklenirken sistemsel bir hata oluştu.");
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Bu duyuruyu tamamen silmek istediğinizden emin misiniz?")) return;

    try {
      const adminToken = localStorage.getItem("zefir_admin_token");
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.ok) {
        fetchNewsAndStats();
      } else {
        alert("Duyuru silinemedi.");
      }
    } catch {
      alert("Hata oluştu.");
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-16">
      {/* Immersive MineTruth Style Hero Section */}
      <section className="min-h-[82vh] md:min-h-[88vh] flex flex-col items-center justify-center text-center relative px-4 py-8 md:py-14">
        {/* Soft atmospheric radial lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] md:w-[500px] h-[340px] md:h-[500px] bg-sky-500/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] md:w-[380px] h-[260px] md:h-[380px] bg-cyan-400/20 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Centerpiece Content */}
        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto w-full my-auto">
          {/* Glowing Animated Logo */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 flex items-center justify-center group mb-6 md:mb-8"
          >
            {/* Ambient rotating halos */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-sky-400 via-cyan-400 to-indigo-500 opacity-40 blur-2xl group-hover:opacity-75 transition-opacity duration-700 animate-pulse"></div>
            <div className="absolute inset-0 border-2 border-dashed border-sky-400/30 rounded-full animate-[spin_30s_linear_infinite] pointer-events-none"></div>
            <div className="absolute inset-4 border border-cyan-400/30 rounded-full animate-[spin_18s_linear_infinite_reverse] pointer-events-none"></div>
            
            {/* Logo Emblem */}
            <div className="w-[155px] h-[155px] sm:w-[185px] sm:h-[185px] md:w-[220px] md:h-[220px] flex items-center justify-center p-3 rounded-full logo-badge-backdrop shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.4)] hover:scale-105 transition-transform duration-300 relative z-10">
              <img
                src={logoSrc}
                alt="ZefirCraft"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]"
              />
            </div>
          </motion.div>

          {/* Clean Main Server IP Button (MineTruth Style) */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-sm sm:max-w-md px-2 space-y-3.5"
          >
            {/* Big Primary Copy IP Pill */}
            <button
              onClick={handleCopyIp}
              className={`w-full group relative py-3.5 sm:py-4 px-6 rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.6)] cursor-pointer active:scale-[0.98] ${
                copied
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 border-2 border-emerald-300"
                  : "bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:via-sky-500 hover:to-indigo-500 text-white border-2 border-sky-300/60 hover:border-sky-200 shadow-sky-950/80 hover:shadow-sky-500/40 hover:scale-[1.02]"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-white animate-bounce" />
                  <span className="font-mono">KOPYALANDI!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-sky-200 group-hover:scale-110 transition-transform" />
                  <span className="font-mono tracking-wide">{ip}</span>
                </>
              )}
            </button>

            {/* Online Stats Pill (Under IP) */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="bg-[#0b162e]/85 backdrop-blur-md border border-sky-400/30 hover:border-sky-400/60 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg transition-all">
                <Users className="w-4 h-4 text-sky-400" />
                <span className="font-mono font-black text-xs sm:text-sm text-white">
                  {loadingStats ? "-/-" : `${serverStats.players.online} / ${serverStats.players.max}`}
                </span>
                <span className="text-[11px] text-sky-300 font-bold hidden xs:inline">Oyuncu</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
              </div>

              <div className="bg-[#0b162e]/85 backdrop-blur-md border border-emerald-400/30 hover:border-emerald-400/60 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-lg text-[11px] font-bold text-emerald-300 transition-all">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{webVisitorsCount} Web Aktif</span>
              </div>

              <a
                href="https://minecraft-mp.com/server/361439/vote/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 hover:border-amber-300 px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Oy Ver</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area (Unfolds as user scrolls down) */}
      <div id="main-content" className="pt-2 scroll-mt-24 space-y-12">
        {/* Quick Access Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate("store")}
            className="p-5 rounded-3xl bg-[#0e1c3a]/85 hover:bg-[#13264f] border border-sky-400/30 hover:border-sky-400/70 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left group cursor-pointer flex items-center gap-4"
          >
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/60 shrink-0 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-sky-300 uppercase tracking-wider">ÖZEL AVANTAJLAR</div>
              <div className="text-base font-black text-white group-hover:text-sky-200 transition-colors">Mağaza & VIP</div>
            </div>
          </button>

          {wheelEnabled ? (
            <button
              onClick={() => onNavigate("wheel")}
              className="p-5 rounded-3xl bg-[#0e1c3a]/85 hover:bg-[#13264f] border border-sky-400/30 hover:border-sky-400/70 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left group cursor-pointer flex items-center gap-4"
            >
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-950/60 shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider">ŞANSINI DENE</div>
                <div className="text-base font-black text-white group-hover:text-cyan-200 transition-colors">Şans Çarkı</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onNavigate("rankings")}
              className="p-5 rounded-3xl bg-[#0e1c3a]/85 hover:bg-[#13264f] border border-sky-400/30 hover:border-sky-400/70 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left group cursor-pointer flex items-center gap-4"
            >
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-950/60 shrink-0 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider">LİDERLİK TABLOSU</div>
                <div className="text-base font-black text-white group-hover:text-cyan-200 transition-colors">Zenginler & Rütbeler</div>
              </div>
            </button>
          )}

          {earnEnabled ? (
            <button
              onClick={() => onNavigate("earn")}
              className="p-5 rounded-3xl bg-[#0e1c3a]/85 hover:bg-[#13264f] border border-amber-400/30 hover:border-amber-400/70 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left group cursor-pointer flex items-center gap-4"
            >
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-950/60 shrink-0 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6 fill-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">ÜCRETSİZ ÖDÜLLER</div>
                <div className="text-base font-black text-white group-hover:text-amber-200 transition-colors">Kredi Kazan</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => onNavigate("friends")}
              className="p-5 rounded-3xl bg-[#0e1c3a]/85 hover:bg-[#13264f] border border-amber-400/30 hover:border-amber-400/70 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left group cursor-pointer flex items-center gap-4"
            >
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-950/60 shrink-0 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider">TOPLULUK & SOHBET</div>
                <div className="text-base font-black text-white group-hover:text-purple-200 transition-colors">Arkadaş Sistemi</div>
              </div>
            </button>
          )}
        </div>

      {/* Main Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: News / Announcements (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-[#1b3d54] border-[#1b253b] pb-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-sky-400 animate-pulse" />
              Duyurular ve Güncellemeler
            </h2>

            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Haber Ekle
              </button>
            )}
          </div>

          {/* Add Article Form (Admin only) */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateArticle}
                className="bg-[#111625]/85 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 shadow-lg space-y-4 overflow-hidden"
              >
                <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Yeni Duyuru Yayınla
                </h3>
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{formSuccess}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Haber Başlığı</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Duyuru başlığını girin..."
                      className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Görsel URL (Opsiyonel)</label>
                    <input
                      type="text"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="Görsel linkini girin..."
                      className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Duyuru İçeriği</label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Detaylı haberi buraya yazın..."
                    className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-[#1b2236] hover:bg-[#25324e] text-slate-300 text-xs font-bold rounded-xl cursor-pointer border border-[#2b3957]/55 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-md"
                  >
                    Yayınla
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Announcements Feed */}
          {articles.length === 0 ? (
            <div className="bg-[#122347]/70 border border-sky-400/30 p-12 text-center rounded-3xl text-slate-300">
              Şu an yayınlanmış duyuru bulunmuyor.
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((art, index) => (
                <ScrollReveal key={art._id} delay={index * 0.08} direction="up">
                  <motion.article
                    whileHover={{ y: -3 }}
                    className="bg-[#122347]/80 border border-sky-400/30 rounded-3xl overflow-hidden shadow-lg hover:border-sky-400/70 transition-all flex flex-col md:flex-row group backdrop-blur-md"
                  >
                    {/* cover image */}
                    <div className="md:w-1/3 aspect-video md:aspect-auto relative bg-[#0b162c] shrink-0 overflow-hidden">
                      <LazyImage
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        containerClassName="w-full h-full"
                      />
                    </div>

                    {/* content */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-[10px] text-sky-300 font-extrabold">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            {formatTime(art.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            {art.views || 42} Görüntülenme
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-white leading-tight group-hover:text-sky-300 transition-colors">
                          {art.title}
                        </h3>

                        <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
                          {art.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-sky-400/20">
                        <button
                          onClick={() => setSelectedArticle(art)}
                          className="text-xs font-bold text-sky-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Devamını Oku
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art._id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer border border-red-500/20 transition-all"
                            title="Duyuruyu Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Widgets (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Sunucuya Nasıl Katılırım? (Kayıt Rehberi) */}
          <ScrollReveal delay={0.1} direction="left">
            <div className="bg-[#122347]/80 border border-sky-400/30 rounded-3xl p-6 shadow-lg space-y-4 backdrop-blur-md">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 font-sans">
                <Gamepad2 className="w-4 h-4 text-sky-400" />
                Nasıl Kayıt Olurum?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ZefirCraft hesabınızı ister web sitemizden saniyeler içinde doğrudan oluşturun, isterseniz oyun içinden kayıt olun.
              </p>
              <div className="bg-[#0e1b38] border border-sky-400/25 rounded-2xl p-4 space-y-3 shadow-inner text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center justify-center shrink-0 border border-emerald-400/40">A</span>
                  <p className="text-slate-200"><b className="text-emerald-300">Web'den Kayıt:</b> Sitemizin üstündeki <span className="text-white font-bold">Kayıt Ol</span> sekmesinden kullanıcı adı ve şifrenizi girerek anında başlayın.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold flex items-center justify-center shrink-0 border border-sky-400/40">B</span>
                  <p className="text-slate-200"><b className="text-sky-300">Oyundan Kayıt:</b> Minecraft'ta <b className="text-sky-300 select-all font-mono">{ip}</b> adresine girip sohbete <code className="text-sky-300 font-bold bg-[#17274c] px-1 py-0.5 rounded border border-sky-400/20">/kayit [sifre] [sifre]</code> yazın.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Widget 2: Web Sandığı (Web Chest Status) */}
          <ScrollReveal delay={0.15} direction="left">
            <div className="bg-gradient-to-br from-[#122347] to-[#0f1d3b] border border-sky-400/30 rounded-3xl p-6 shadow-lg space-y-4 relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(14,165,233,0.15),transparent_50%)]"></div>
              <div className="flex items-center gap-2 relative z-10">
                <Inbox className="w-5 h-5 text-sky-400 animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Web Sandığım</h3>
              </div>

              {localStorage.getItem("koli_token") || localStorage.getItem("zefir_token") ? (
                <div className="space-y-3 relative z-10">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sandığınızda teslim edilmeyi bekleyen <b className="text-white text-sm font-black">{chestCount}</b> adet eşya bulunuyor.
                  </p>
                  <button
                    onClick={() => onNavigate("chest")}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Sandığımı Aç
                  </button>
                </div>
              ) : (
                <div className="space-y-3 relative z-10">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hesabınıza giriş yaparak web sandığınızdaki rütbe ve eşyaları oyuna teslim edebilirsiniz.
                  </p>
                  <button
                    onClick={() => onNavigate("login")}
                    className="w-full py-2.5 bg-[#17274c] hover:bg-[#1f3564] text-sky-300 border border-sky-400/40 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Hesaba Giriş Yap
                  </button>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Widget: Son Alışverişler (Dynamic Rolling Recent Purchases) */}
          <ScrollReveal delay={0.2} direction="left">
            <div className="bg-[#122347]/80 border border-sky-400/30 rounded-3xl p-6 shadow-lg space-y-4 backdrop-blur-md">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2 font-sans">
                <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
                Son Alışverişler
              </h3>
              
              <div className="space-y-3">
                {recentPurchases.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 italic">
                    Henüz bir alışveriş yapılmadı.
                  </div>
                ) : (
                  recentPurchases.map((sale, idx) => {
                    const date = new Date(sale.createdAt);
                    const minutesAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
                    let timeStr = "";
                    if (isNaN(minutesAgo)) {
                      timeStr = "Yeni";
                    } else if (minutesAgo < 1) {
                      timeStr = "Az önce";
                    } else if (minutesAgo < 60) {
                      timeStr = `${minutesAgo} dakika önce`;
                    } else if (minutesAgo < 1440) {
                      timeStr = `${Math.floor(minutesAgo / 60)} saat önce`;
                    } else {
                      timeStr = `${Math.floor(minutesAgo / 1440)} gün önce`;
                    }

                    return (
                      <div key={idx} className="flex items-center justify-between bg-[#162850] border border-sky-400/25 rounded-2xl p-3 hover:bg-[#1b3162] hover:border-sky-400/50 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <LazyImage
                            src={`https://mc-heads.net/avatar/${sale.username}/28`}
                            alt={sale.username}
                            className="w-7 h-7 rounded-lg border border-sky-400/40"
                            containerClassName="w-7 h-7 shrink-0 rounded-lg"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate">{sale.username}</div>
                            <div className="text-[10px] text-sky-200 truncate">{sale.productName}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-black text-sky-300">{sale.price} Kr.</div>
                          <div className="text-[9px] text-slate-400 font-bold">{timeStr}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Widget 3: Kredi Sıralaması (Top Credits Donators) */}
          <ScrollReveal delay={0.25} direction="left">
            <div className="bg-[#122347]/80 border border-sky-400/30 rounded-3xl p-6 shadow-lg space-y-4 backdrop-blur-md">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                Zenginler Sıralaması
              </h3>

              {topUsers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sıralama verisi şu an boş.</p>
              ) : (
                <div className="space-y-2.5">
                  {topUsers.map((u) => (
                    <div key={u.rank} className="flex items-center justify-between bg-[#162850] border border-sky-400/25 rounded-xl p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                          u.rank === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-400/40" :
                          u.rank === 2 ? "bg-slate-300/20 text-slate-200 border border-slate-300/40" :
                          u.rank === 3 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40" : "bg-sky-500/10 text-sky-300"
                        }`}>
                          {u.rank}
                        </span>
                        
                        <LazyImage
                          src={`https://mc-heads.net/avatar/${u.username}/24`}
                          alt={u.username}
                          className="w-6 h-6 rounded-md border border-sky-400/30"
                          containerClassName="w-6 h-6 shrink-0 rounded-md"
                        />
                        <span className="font-extrabold text-xs text-slate-200 truncate">{u.username}</span>
                      </div>
                      <span className="text-xs font-black text-sky-300 shrink-0 bg-[#0e1b38] border border-sky-400/25 px-2 py-0.5 rounded-lg">
                        {u.credits} <span className="text-[9px] font-normal text-sky-400/80">Kr</span>
                      </span>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => onNavigate("rankings")}
                    className="w-full mt-2 py-2.5 bg-[#17274c] hover:bg-[#1f3564] text-slate-200 hover:text-white border border-sky-400/40 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    Tüm Sıralamayı Gör
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Widget 4: Discord Banner */}
          <ScrollReveal delay={0.3} direction="left">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5865F2] to-[#3a47d2] text-white p-6 shadow-lg space-y-4">
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-sm font-black flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 animate-bounce" />
                  Discord Topluluğumuz
                </h3>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Etkinlikleri takip et, özel çekilişlere katıl ve sunucunun güncel sohbetlerine ortak ol!
                </p>
              </div>
              <a
                href="https://discord.gg/yH52952uCq"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-white text-[#5865F2] font-black text-center text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-md relative z-10"
              >
                Topluluğa Katıl
              </a>
            </div>
          </ScrollReveal>

        </div>

      </div>
      </div>

      {/* Reader Modal Overlay */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#122347] border border-sky-400/40 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10"
            >
              {/* Cover image banner */}
              <div className="h-48 md:h-64 relative bg-[#0b162c] overflow-hidden shrink-0">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content block */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-4">
                <div className="flex items-center gap-4 text-[10px] text-sky-300 font-extrabold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    {formatTime(selectedArticle.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedArticle.views || 42} Görüntülenme
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {selectedArticle.title}
                </h2>

                <p className="text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {selectedArticle.content}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#0e1b38] border-t border-sky-400/25 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 bg-[#17274c] hover:bg-[#1f3564] text-white font-bold text-xs rounded-xl border border-sky-400/35 transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
