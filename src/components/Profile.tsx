import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, Calendar, Coins, Key, Shield, Inbox, AlertCircle, CheckCircle, 
  Sparkles, ShieldAlert, Award, ArrowRight, UserCheck
} from "lucide-react";

interface ProfileProps {
  user: { username: string; credits: number; registerDate?: string; isAdmin?: boolean } | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function Profile({ user, onLogout, onNavigate }: ProfileProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [chestCount, setChestCount] = useState(0);
  const [purchasesCount, setPurchasesCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch stats
    const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
    if (token) {
      // Get chest item count
      fetch("/api/chest", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setChestCount(data.filter((item: any) => item.status === "in_chest").length);
          }
        })
        .catch(() => {});

      // Get total purchases
      fetch("/api/purchases/my", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPurchasesCount(data.length);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Tüm alanları doldurmanız gerekmektedir.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler uyuşmuyor.");
      return;
    }

    if (newPassword.length < 4) {
      setError("Şifreniz en az 4 karakter uzunluğunda olmalıdır.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Şifreniz başarıyla değiştirildi! Bir sonraki girişinizde yeni şifrenizi kullanın.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Şifre değiştirme işlemi başarısız.");
      }
    } catch (err) {
      setError("Sunucu bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#111625]/80 backdrop-blur-md rounded-3xl p-12 text-center border border-[#1f293d] shadow-2xl max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-[#1b2336] text-[#60a5fa] rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-[#2e3c56]">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-4 mt-6">
          <h2 className="text-2xl font-black text-white">Profil Sayfası</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Oyuncu istatistiklerinizi görmek, oyun içi karakter görünümünüzü incelemek ve şifre işlemlerinizi yönetmek için lütfen önce giriş yapın.
          </p>
          <button
            onClick={() => onNavigate("login")}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Formatting date helper
  const formattedRegDate = user.registerDate
    ? new Date(user.registerDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "Bilinmiyor";

  return (
    <div className="space-y-8 py-4">
      {/* Upper Navigation Card / Hero block */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101e] border border-[#22304d] p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3b82f61a,transparent_45%)]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Minecraft 3D Head representation with gradient background */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#1b2336] to-[#2a3754] border border-[#3b4c73] p-1 flex items-center justify-center overflow-hidden shadow-xl group">
                <img
                  src={`https://mc-heads.net/avatar/${user.username}/80`}
                  alt={user.username}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-[#1b3d54] border-[#0c101e] w-5 h-5 rounded-full flex items-center justify-center" title="Oyuncu Aktif">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-3xl font-black text-white tracking-tight">{user.username}</h1>
                {user.isAdmin ? (
                  <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    YÖNETİCİ
                  </span>
                ) : (
                  <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    OYUNCU
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs flex items-center justify-center md:justify-start gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Kayıt Tarihi: <b className="text-slate-200">{formattedRegDate}</b></span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-black transition-all shadow-lg shadow-red-950/20"
          >
            Oturumu Kapat
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: 3D Body Visualizer & Stats (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 3D Skin Render Panel */}
          <div className="bg-[#111625]/75 backdrop-blur-md rounded-3xl border border-[#1e293b] p-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1d4ed811,transparent_70%)]"></div>
            <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase mb-4 block">3D Karakter Görünümü</span>
            
            <div className="h-64 flex items-center justify-center relative z-10 py-4">
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                src={`https://mc-heads.net/body/${user.username}/180`}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="h-full object-contain filter drop-shadow-[0_10px_20px_rgba(59,130,246,0.25)] hover:rotate-6 transition-transform duration-300"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Skinseniz otomatik olarak Mojang API üzerinden yüklenir.
            </div>
          </div>

          {/* Stats widgets inside glass panel */}
          <div className="bg-[#111625]/75 backdrop-blur-md rounded-3xl border border-[#1e293b] p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Oyuncu İstatistikleri</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1b2236]/60 border border-[#283552]/50 rounded-2xl p-4 text-center">
                <Coins className="w-5 h-5 text-sky-500 mx-auto mb-2 animate-pulse" />
                <div className="text-[10px] text-slate-400 font-bold uppercase">Hesap Bakiyesi</div>
                <div className="font-black text-white text-base mt-1">
                  {user.credits} <span className="text-[10px] text-slate-400 font-normal">Kr.</span>
                </div>
              </div>

              <div className="bg-[#1b2236]/60 border border-[#283552]/50 rounded-2xl p-4 text-center">
                <Inbox className="w-5 h-5 text-sky-400 mx-auto mb-2" />
                <div className="text-[10px] text-slate-400 font-bold uppercase">Web Sandığı</div>
                <div className="font-black text-white text-base mt-1">
                  {chestCount} <span className="text-[10px] text-slate-400 font-normal">Eşya</span>
                </div>
              </div>

              <div className="bg-[#1b2236]/60 border border-[#283552]/50 rounded-2xl p-4 text-center col-span-2">
                <Award className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <div className="text-[10px] text-slate-400 font-bold uppercase">Toplam Satın Alınan Ürün</div>
                <div className="font-black text-emerald-400 text-lg mt-1">
                  {purchasesCount} <span className="text-xs text-slate-400 font-normal">Adet</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Password change & Security Form (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111625]/75 backdrop-blur-md rounded-3xl border border-[#1e293b] p-6 md:p-8 shadow-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-sky-400" />
                Şifre Güncelleme İşlemi
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minecraft sunucusundaki ve bu web sitesindeki giriş şifrenizi buradan anında güncelleyebilirsiniz.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Mevcut Şifre</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin..."
                  className="w-full bg-[#182035] border border-[#2b3957] rounded-xl text-white text-xs px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Yeni Şifre</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifreniz..."
                    className="w-full bg-[#182035] border border-[#2b3957] rounded-xl text-white text-xs px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifreniz tekrar..."
                    className="w-full bg-[#182035] border border-[#2b3957] rounded-xl text-white text-xs px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-[#1b3d54] border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Şifre Güncelleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Şifreyi Güncelle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#111625]/75 backdrop-blur-md rounded-3xl border border-[#1e293b] p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-extrabold text-sm text-white flex items-center justify-center sm:justify-start gap-1.5">
                <Inbox className="w-4 h-4 text-sky-400" />
                Bekleyen Eşyalarınız Mı Var?
              </h4>
              <p className="text-xs text-slate-400">Web sandığı sayfasından dilediğiniz an eşyalarınızı oyuna aktarabilirsiniz.</p>
            </div>
            <button
              onClick={() => onNavigate("chest")}
              className="px-4 py-2 bg-[#1b2336] hover:bg-[#25324e] text-sky-400 border border-[#2d3a56] font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
            >
              Sandığı Aç
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
