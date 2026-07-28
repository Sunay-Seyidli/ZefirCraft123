import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Coins, Gift, Clock, RotateCcw, Trophy, History, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface LuckyWheelProps {
  user: { username: string; credits: number; registerDate?: string; isAdmin?: boolean; lastWheelSpin?: string } | null;
  onUpdateCredits: (newCredits: number) => void;
  onNavigate: (page: string) => void;
}

interface WheelLog {
  _id?: string;
  id?: string;
  username: string;
  reward: string;
  createdAt?: string;
  date?: string;
}

const WHEEL_SLICES = [
  { value: 2, label: "2 Kredi", color: "#ef4444", bg: "from-red-600 to-red-800" },
  { value: 5, label: "5 Kredi", color: "#f97316", bg: "from-orange-600 to-orange-800" },
  { value: 10, label: "10 Kredi", color: "#eab308", bg: "from-amber-500 to-amber-700" },
  { value: 20, label: "20 Kredi", color: "#3b82f6", bg: "from-blue-600 to-blue-800" },
  { value: 50, label: "50 Kredi", color: "#10b981", bg: "from-emerald-600 to-emerald-800" },
  { value: 100, label: "100 DEVASA!", color: "#a855f7", bg: "from-purple-600 to-purple-800" },
];

export default function LuckyWheel({ user, onUpdateCredits, onNavigate }: LuckyWheelProps) {
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logs, setLogs] = useState<WheelLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [cooldownHoursLeft, setCooldownHoursLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (user && user.lastWheelSpin) {
      const last = new Date(user.lastWheelSpin);
      const now = new Date();
      const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        setCooldownHoursLeft(Math.ceil(24 - diffHours));
      } else {
        setCooldownHoursLeft(null);
      }
    } else {
      setCooldownHoursLeft(null);
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/lucky-wheel/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Fetch wheel logs error:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSpin = async () => {
    if (!user) {
      onNavigate("login");
      return;
    }

    if (spinning || cooldownHoursLeft !== null) return;

    setSpinning(true);
    setResultMessage(null);

    try {
      const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
      const res = await fetch("/api/lucky-wheel/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setResultMessage({ type: "error", text: data.error || "Çark çevrilirken bir hata oluştu." });
        setSpinning(false);
        return;
      }

      // Calculate degrees to land on slice
      const targetIndex = data.rewardIndex !== undefined ? data.rewardIndex : 0;
      const numSlices = WHEEL_SLICES.length;
      const sliceDeg = 360 / numSlices;
      
      // Pointer is at top (270 deg or 90 deg offset depending on wheel orientation)
      // Extra full rotations (5 full turns = 1800 deg)
      const extraTurns = 5 * 360;
      // Slice center angle offset
      const targetAngle = 360 - (targetIndex * sliceDeg + sliceDeg / 2);
      const newDeg = rotationDegrees + extraTurns + (targetAngle - (rotationDegrees % 360));

      setRotationDegrees(newDeg);

      // Wait for spin animation (4 seconds)
      setTimeout(() => {
        setSpinning(false);
        setResultMessage({ type: "success", text: data.message });
        if (data.newCredits !== undefined) {
          onUpdateCredits(data.newCredits);
        }
        setCooldownHoursLeft(24);
        fetchLogs();
      }, 4000);

    } catch (err) {
      console.error("Spin error:", err);
      setResultMessage({ type: "error", text: "Ağ hatası oluştu, lütfen tekrar deneyin." });
      setSpinning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#0f1629] border border-[#202d4a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Günlük Ücretsiz Şans Çarkı
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Çarkıfelek & Kredi Kazanım Portalı
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Her 24 saatte bir şans çarkını tamamen ücretsiz çevirin, 2 ile 100 Kredi arasında anında ücretsiz bakiye kazanın!
          </p>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-4 relative z-10 shrink-0">
          <div className="bg-[#151d36] border border-[#27385e] rounded-2xl px-6 py-4 text-center shadow-lg">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mevcut Bakiyeniz</span>
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-amber-400 mt-1">
              <Coins className="w-6 h-6" />
              <span>{user ? user.credits : 0} Kredi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Message Alert */}
      {resultMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 shadow-lg ${
            resultMessage.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              : "bg-red-950/80 border-red-500/50 text-red-200"
          }`}
        >
          {resultMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{resultMessage.text}</span>
        </motion.div>
      )}

      {/* Main Grid: Wheel + Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Interactive Wheel (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f1629] border border-[#202d4a] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-xl relative min-h-[500px]">
          
          {/* Wheel Pointer Indicator */}
          <div className="z-30 -mb-5 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 filter drop-shadow-[0_4px_10px_rgba(245,158,11,0.6)]" />
          </div>

          {/* Wheel Disc (SVG) */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 my-4 flex items-center justify-center">
            <div
              className="w-full h-full transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.25, 1) drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]"
              style={{ transform: `rotate(${rotationDegrees}deg)` }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full select-none">
                <defs>
                  {/* Wheel outer border gradient */}
                  <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                  {/* Slice gradients */}
                  <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                  <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#9a3412" />
                  </linearGradient>
                  <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </linearGradient>
                  <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e3a8a" />
                  </linearGradient>
                  <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#064e3b" />
                  </linearGradient>
                  <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#581c87" />
                  </linearGradient>
                </defs>

                {/* Outer Golden Ring */}
                <circle cx="200" cy="200" r="195" fill="url(#goldBorder)" />
                <circle cx="200" cy="200" r="185" fill="#0f172a" />

                {/* Slices */}
                {WHEEL_SLICES.map((slice, idx) => {
                  const numSlices = WHEEL_SLICES.length;
                  const sliceAngle = 360 / numSlices;
                  const startAngle = -90 + idx * sliceAngle;
                  const endAngle = -90 + (idx + 1) * sliceAngle;

                  const a1 = (startAngle * Math.PI) / 180;
                  const a2 = (endAngle * Math.PI) / 180;

                  const r = 182;
                  const x1 = 200 + r * Math.cos(a1);
                  const y1 = 200 + r * Math.sin(a1);
                  const x2 = 200 + r * Math.cos(a2);
                  const y2 = 200 + r * Math.sin(a2);

                  const pathD = `M 200 200 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

                  const gradIds = ["grad-red", "grad-orange", "grad-amber", "grad-blue", "grad-emerald", "grad-purple"];
                  const fillGrad = `url(#${gradIds[idx % gradIds.length]})`;

                  const midAngle = startAngle + sliceAngle / 2;
                  const rotateGroupDeg = midAngle + 90;

                  return (
                    <g key={idx}>
                      <path d={pathD} fill={fillGrad} stroke="#0f172a" strokeWidth="2.5" />
                      <g transform={`rotate(${rotateGroupDeg}, 200, 200)`}>
                        <text
                          x="200"
                          y="80"
                          fill="#ffffff"
                          fontSize="15"
                          fontWeight="900"
                          textAnchor="middle"
                          className="font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                          style={{ fontFamily: 'sans-serif' }}
                        >
                          {slice.label}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Decorative Pins around outer rim */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const pAngle = (i * 30 * Math.PI) / 180;
                  const px = 200 + 190 * Math.cos(pAngle);
                  const py = 200 + 190 * Math.sin(pAngle);
                  return <circle key={i} cx={px} cy={py} r="3.5" fill="#fef08a" stroke="#78350f" strokeWidth="1" />;
                })}

                {/* Center Hub */}
                <circle cx="200" cy="200" r="42" fill="url(#goldBorder)" />
                <circle cx="200" cy="200" r="36" fill="#0b101d" />
              </svg>

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Gift className="w-9 h-9 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]" />
              </div>
            </div>
          </div>

          {/* Spin Action Control Button */}
          <div className="w-full max-w-sm mt-4 text-center space-y-3">
            {!user ? (
              <button
                onClick={() => onNavigate("login")}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Çevirmek İçin Giriş Yapın
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : cooldownHoursLeft !== null ? (
              <div className="bg-[#151d36] border border-[#27385e] rounded-2xl p-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-xs">
                  <Clock className="w-4 h-4 animate-spin" />
                  Günlük Çevirme Hakkınız Kullanıldı
                </div>
                <p className="text-[11px] text-slate-400">
                  Tekrar çevirmek için yaklaşık <strong>{cooldownHoursLeft} saat</strong> beklemeniz gerekiyor.
                </p>
              </div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className={`w-full py-4 font-black rounded-2xl text-sm uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  spinning
                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-300 shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {spinning ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin text-slate-400" />
                    Çark Dönüyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-slate-950" />
                    ÇARKI ÜCRETSİZ ÇEVİR!
                  </>
                )}
              </button>
            )}
            <p className="text-[10px] text-slate-400 font-medium">
              * Çarkıfelek günde 1 kez çevrilebilir ve kazandığınız krediler anında profilinize tanımlanır.
            </p>
          </div>
        </div>

        {/* Right Col: Live Recent Wins Log (5 cols) */}
        <div className="lg:col-span-5 bg-[#0f1629] border border-[#202d4a] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#202d4a] pb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Son Kazanılan Çark Ödülleri
            </h2>
            <span className="text-[10px] text-slate-400 font-bold bg-[#151d36] px-2.5 py-1 rounded-lg border border-[#27385e]">
              Canlı Akış
            </span>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <RotateCcw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
              <p>Ödül geçmişi yükleniyor...</p>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-8">Henüz çark kazanım kaydı bulunmuyor.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {logs.map((log, idx) => (
                <div
                  key={log._id || log.id || idx}
                  className="bg-[#131b31] border border-[#212f52] p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://mc-heads.net/avatar/${log.username}/28`}
                      alt={log.username}
                      className="w-7 h-7 rounded-lg border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <span className="font-extrabold text-white block">{log.username}</span>
                      <span className="text-[10px] text-slate-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : log.date || "Bugün"}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black rounded-xl text-xs">
                    +{log.reward}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
