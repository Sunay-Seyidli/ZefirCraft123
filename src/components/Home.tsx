import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import LazyImage from "./LazyImage";
import ScrollReveal from "./ScrollReveal";
import {
  Copy, Users, Shield, Server, Award, Sparkles, Check, ChevronRight,
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

  const ip = "zefircraft.mcsh.io";

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
    <div className="space-y-12 py-4">
      {/* Centered High-Fidelity MineTruth Style Hero Section */}
      <div className="flex flex-col items-center justify-center pt-8 pb-14 text-center relative overflow-hidden bg-[#102042]/70 rounded-3xl border border-sky-400/35 p-6 md:p-12 shadow-2xl backdrop-blur-xl">
        {/* Ambient glows and frost particles */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(14,165,233,0.22),transparent_65%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-sky-400/20 rounded-full blur-[90px] pointer-events-none glow-ambient"></div>
        
        {/* Particle/Snowy floating icons decorations */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          <div className="absolute top-10 left-1/4 w-2 h-2 bg-sky-300 rounded-full animate-ping" />
          <div className="absolute top-24 left-3/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-16 left-12 w-3 h-3 bg-sky-400 rounded-full blur-xs animate-bounce" style={{ animationDuration: '6s' }} />
        </div>

        {/* High-fidelity Logo Centerpiece (Mimicking animated 3D launcher / GIF) */}
        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center group mb-6">
            {/* Rotating magic halo circle 1 */}
            <div className="absolute inset-0 border-2 border-dashed border-sky-400/40 rounded-full animate-[spin_25s_linear_infinite] pointer-events-none"></div>
            {/* Rotating neon star/gear circle 2 */}
            <div className="absolute inset-3 border border-cyan-400/40 rounded-full animate-[spin_12s_linear_infinite_reverse] pointer-events-none"></div>
            {/* Pulsing glow ring */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-sky-400 via-cyan-400 to-amber-400 rounded-full opacity-40 blur-xl group-hover:opacity-70 transition-opacity animate-pulse duration-1000"></div>
            
            {/* Floating Logo with Harmonious Backdrop Badge */}
            <div className="w-[136px] h-[136px] md:w-[160px] md:h-[160px] logo-container logo-shine flex items-center justify-center rounded-full p-2.5 logo-badge-backdrop shadow-2xl hover:scale-105 transition-transform duration-300 relative z-10">
              <img
                src={logoSrc}
                alt="ZefirCraft Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </div>

          {/* Metallic 3D Display Typography */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-sky-500/20 px-3.5 py-1.5 rounded-full border border-sky-400/40 text-[10px] font-black text-sky-200 tracking-wider uppercase shadow-md shadow-sky-950/30">
              <Package className="w-3.5 h-3.5 text-sky-300 animate-bounce" />
              ZefirCraft Aktif!
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-sky-200 to-cyan-400 uppercase drop-shadow-[0_4px_16px_rgba(14,165,233,0.5)] font-sans">
              ZEFIRCRAFT
            </h1>
            <p className="text-xs md:text-sm font-extrabold text-cyan-300 tracking-widest uppercase font-mono">
              EFSANEVİ TOWNY SUNUCUSU
            </p>
            <p className="text-slate-200 text-xs md:text-sm max-w-lg mx-auto leading-relaxed pt-1">
              ZefirCraft Towny sunucumuz 1.16.5 - 26.2 sürümlerini desteklemektedir! Birbirinden heyecanlı kasabalar, dengeli bir ekonomi, rütbe kasaları ve yenilenmiş teslimat sistemi sizleri bekliyor.
            </p>
          </div>

          {/* Majestic Server Copy Connection Capsule & Vote Button */}
          <div className="mt-8 w-full max-w-2xl px-1 space-y-2.5">
            <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
              {/* Server IP Copy Capsule */}
              <button
                onClick={handleCopyIp}
                className={`flex-1 group relative flex flex-col justify-between gap-3 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xl min-w-0 ${
                  copied
                    ? "bg-emerald-500/20 border-emerald-400/60 shadow-emerald-950/40"
                    : "bg-[#132348]/90 hover:bg-[#182b56] border-sky-400/40 hover:border-sky-400/70"
                }`}
              >
                {/* Top Row: IP Details & Copy Action Button */}
                <div className="flex items-center justify-between gap-2.5 w-full min-w-0">
                  {/* IP Details */}
                  <div className="text-left leading-tight min-w-0 flex-1">
                    <span className="text-[10px] text-cyan-300 block font-black uppercase tracking-widest">SUNUCU ADRESİ</span>
                    <span className="font-mono text-xs xs:text-sm sm:text-base md:text-lg text-white font-black tracking-wide sm:tracking-wider group-hover:text-sky-300 transition-colors break-all select-all block mt-0.5">
                      {ip}
                    </span>
                  </div>

                  {/* Copy Button Badge (Icon Only) */}
                  <div 
                    title={copied ? "Kopyalandı!" : "IP Adresini Kopyala"}
                    className={`p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-center shrink-0 border ${
                      copied
                        ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/60 scale-105"
                        : "bg-[#1c305c] text-sky-200 group-hover:text-white group-hover:bg-sky-500/30 group-hover:border-sky-400/60 border-sky-400/30"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
                    )}
                  </div>
                </div>

                {/* Bottom Row (Under IP Address): Online Counters */}
                <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-sky-400/20 w-full">
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1.5 shadow-sm" title="Tüm sayfalarda anlık gezinen web ziyaretçileri">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>{webVisitorsCount} Web Aktif</span>
                  </span>
                  <span className="text-[11px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>{loadingStats ? "..." : `${serverStats.players.online} / ${serverStats.players.max} Oyuncu Aktif`}</span>
                  </span>
                </div>
              </button>

              {/* Direct Vote Button */}
              <a
                href="https://minecraft-mp.com/server/361439/vote/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200/60 shrink-0"
              >
                <Flame className="w-4 h-4 text-slate-950 fill-slate-950 animate-bounce" />
                <span className="uppercase tracking-wider whitespace-nowrap font-black">OY VER</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-300 font-bold tracking-wider px-1">
              <span>Giriş yapmak için IP adresine tıkla!</span>
              <a
                href="https://minecraft-mp.com/server/361439/vote/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Minecraft-MP Sunucumuza Oy Ver</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Glowing Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full max-w-md">
            <button
              onClick={() => onNavigate("store")}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:via-sky-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-sky-950/40 hover:shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/40"
            >
              <ShoppingBag className="w-4 h-4" />
              MAĞAZAYI KEŞFET
            </button>
            {wheelEnabled && (
              <button
                onClick={() => onNavigate("wheel")}
                className="w-full py-3 bg-[#17274c] hover:bg-[#1e3464] border border-sky-400/40 hover:border-sky-400/70 text-slate-100 hover:text-white font-bold rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                ŞANS ÇARKINI ÇEVİR!
              </button>
            )}
            {earnEnabled && (
              <button
                onClick={() => onNavigate("earn")}
                className="w-full py-3 bg-[#17274c] hover:bg-[#1e3464] border border-amber-400/40 hover:border-amber-400/70 text-amber-300 hover:text-amber-200 font-bold rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
                KREDİ KAZAN
              </button>
            )}
          </div>
        </div>
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
                Sitemize giriş yapıp sipariş verebilmek veya web sandığınızı kullanabilmek için öncelikle oyun içinden kayıt olmanız gerekmektedir.
              </p>
              <div className="bg-[#0e1b38] border border-sky-400/25 rounded-2xl p-4 space-y-3 shadow-inner text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold flex items-center justify-center shrink-0 border border-sky-400/40">1</span>
                  <p className="text-slate-200">Minecraft'ı açın ve sunucu adresine <b className="text-sky-300 select-all font-mono font-extrabold">zefircraft.mcsh.io</b> yazıp giriş yapın.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold flex items-center justify-center shrink-0 border border-sky-400/40">2</span>
                  <p className="text-slate-200">Sohbet penceresine <code className="text-sky-300 font-bold bg-[#17274c] px-1.5 py-0.5 rounded border border-sky-400/20">/kayit [sifre] [sifre]</code> yazıp kaydolun.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 font-extrabold flex items-center justify-center shrink-0 border border-sky-400/40">3</span>
                  <p className="text-slate-200">Sitedeki "Giriş Yap" panelinden aynı kullanıcı adı ve şifrenizle oturum açın.</p>
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
                href="https://discord.gg/invite-placeholder"
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
