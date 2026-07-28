import React, { useState } from "react";
import { LogIn, Key, User, Info, AlertCircle, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginProps {
  onLoginSuccess: (user: { username: string; credits: number; isAdmin?: boolean }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ username, password })
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
        body: JSON.stringify({ username, password, code: verificationCode })
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
    <div className="py-10 max-w-md mx-auto space-y-6">
      {/* Header text */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">
          {show2FA ? "GÜVENLİK DOĞRULAMA" : "ZefirCraft Giriş Paneli"}
        </h1>
        <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
          {show2FA
            ? "Yüksek düzey yetkili hesabı algılandı. Lütfen kimliğinizi doğrulayın."
            : "Siteden sipariş vermek, şans çarkını çevirmek ve kredilerinizi yönetmek için lütfen hesabınızla oturum açın."}
        </p>
      </div>

      {/* Main Glass Box */}
      <div className="bg-[#111625]/75 rounded-3xl border border-[#1e2a40] p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2 text-xs leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!show2FA ? (
            <motion.form
              key="login_form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">
                  Kullanıcı Adı veya E-posta
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
                    placeholder="Kullanıcı adınızı veya e-posta adresinizi girin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Şifre</label>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-sky-500/10"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-[#1b3d54] border-white border-t-transparent rounded-full"
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
          )}
        </AnimatePresence>

        {/* Informative Footer Box */}
        {!show2FA && (
          <div className="bg-[#151d30] border border-[#212f4d] rounded-2xl p-4 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed shadow-inner animate-fade-in">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-white block mb-1">Hesabınız Yok Mu?</span>
              Sitemizde doğrudan kayıt paneli bulunmaz. Sunucumuza <code className="bg-[#0e1423] border border-[#212f4d] px-1 py-0.5 rounded font-mono font-bold text-sky-300">zefircraft.mcsh.io</code> adresiyle giriş yaptıktan sonra sohbete <code className="bg-[#0e1423] border border-[#212f4d] px-1 py-0.5 rounded font-mono font-bold text-sky-300">/kayitol &lt;şifre&gt; &lt;şifre&gt;</code> yazarak anında kayıt olabilir, ardından sitemizde de bu şifrenizle oturum açabilirsiniz.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
