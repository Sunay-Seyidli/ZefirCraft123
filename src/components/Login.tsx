import React, { useState } from "react";
import { LogIn, Key, User, Info, AlertCircle, ShieldAlert, ArrowLeft, CheckCircle2, UserPlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginProps {
  onLoginSuccess: (user: { username: string; credits: number; isAdmin?: boolean }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!username || !password) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Giriş işlemi başarısız.");
      }

      if (data.status === "2fa_required") {
        setShow2FA(true);
        setInfoMessage(data.message);
      } else {
        localStorage.setItem("koli_token", data.token);
        localStorage.setItem("zefir_token", data.token);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 16) {
      setError("Kullanıcı adı 3 ile 16 karakter arasında olmalıdır.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError("Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir.");
      return;
    }

    if (password.length < 5) {
      setError("Şifreniz en az 5 karakter uzunluğunda olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password, confirmPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kayıt işlemi başarısız.");
      }

      setInfoMessage("Kayıt başarılı! Oturumunuz açılıyor...");
      localStorage.setItem("koli_token", data.token);
      localStorage.setItem("zefir_token", data.token);
      
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Kayıt olurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode) {
      setError("Güvenlik doğrulama kodu gereklidir.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, code: verificationCode })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Doğrulama kodu geçersiz.");
      }

      localStorage.setItem("koli_token", data.token);
      localStorage.setItem("zefir_token", data.token);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Doğrulama başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShow2FA(false);
    setVerificationCode("");
    setError(null);
    setInfoMessage(null);
  };

  return (
    <div className="py-8 max-w-md mx-auto space-y-6">
      {/* Header text */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase flex items-center justify-center gap-2">
          {show2FA ? (
            "GÜVENLİK DOĞRULAMA"
          ) : activeTab === "login" ? (
            <>
              <LogIn className="w-6 h-6 text-sky-400" />
              <span>ZefirCraft Giriş</span>
            </>
          ) : (
            <>
              <UserPlus className="w-6 h-6 text-emerald-400" />
              <span>ZefirCraft Kayıt Ol</span>
            </>
          )}
        </h1>
        <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
          {show2FA
            ? "Yüksek düzey yetkili hesabı algılandı. Lütfen kimliğinizi doğrulayın."
            : activeTab === "login"
            ? "Mağazadan sipariş vermek, çarkı çevirmek ve kredilerinizi yönetmek için oturum açın."
            : "Saniyeler içinde web sitemizden doğrudan ücretsiz hesabınızı oluşturun."}
        </p>
      </div>

      {/* Main Glass Box */}
      <div className="bg-[#111625]/90 rounded-3xl border border-[#1e2a40] p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
        
        {/* Tab Switcher (Login / Register) */}
        {!show2FA && (
          <div className="grid grid-cols-2 bg-[#0c101c] p-1.5 rounded-2xl border border-[#212d45] relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setError(null);
                setInfoMessage(null);
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-900/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setError(null);
                setInfoMessage(null);
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "register"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Kayıt Ol</span>
            </button>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-start gap-2.5 text-xs leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs leading-relaxed"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{infoMessage}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {show2FA ? (
            /* 2FA Verification Form */
            <motion.form
              key="2fa_form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handle2FASubmit}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  6-Haneli Güvenlik Kodu
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="örn: 123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-sky-500/30 rounded-xl text-sm font-bold tracking-widest text-center text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-1/3 py-3 bg-[#1c263d] hover:bg-[#253252] text-slate-300 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#2b3957]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-sky-500/10"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-[#1b3d54] border-white border-t-transparent rounded-full"
                      />
                      <span>Doğrulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kodu Doğrula & Giriş Yap</span>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : activeTab === "login" ? (
            /* Login Form */
            <motion.form
              key="login_form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLoginSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Minecraft Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Oyundaki kullanıcı adınızı girin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Şifre</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer border border-sky-400/20"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Kontrol Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Hesabıma Giriş Yap</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            /* Register Form */
            <motion.form
              key="register_form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleRegisterSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Minecraft Kullanıcı Adı</span>
                  <span className="text-[10px] text-slate-500 font-normal">3-16 karakter</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Oyunda kullanacağınız nick (örn: Oyuncu123)"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Hesap Şifresi</span>
                  <span className="text-[10px] text-slate-500 font-normal">En az 5 karakter</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={5}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Güçlü bir şifre belirleyin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={5}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/20"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Hesabınız Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Ücretsiz Kayıt Ol & Giriş Yap</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Informative Footer Box */}
        {!show2FA && (
          <div className="bg-[#151d30]/80 border border-[#212f4d] rounded-2xl p-4 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed shadow-inner">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-white block mb-1">
                {activeTab === "login" ? "Hesabınız Yok Mu?" : "Oyun İçi ve Web Senkronizasyonu"}
              </span>
              Sitemizden oluşturduğunuz hesapla hem web sitemize hem de Minecraft sunucumuza (<code className="bg-[#0e1423] border border-[#212f4d] px-1 py-0.5 rounded font-mono font-bold text-sky-300">zefircraft.ddns.net</code>) doğrudan giriş yapabilirsiniz. Dilerseniz oyun içinden <code className="bg-[#0e1423] border border-[#212f4d] px-1 py-0.5 rounded font-mono font-bold text-sky-300">/kayit &lt;şifre&gt; &lt;şifre&gt;</code> komutuyla da kayıt olabilirsiniz.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
