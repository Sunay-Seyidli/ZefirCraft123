import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, MessageSquare, UserPlus, Shield, Calendar, X, Sparkles, Check, AlertCircle, Coins, Heart, Clock } from "lucide-react";

interface UserProfileModalProps {
  username: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; isAdmin?: boolean } | null;
  onOpenChat?: (friendUsername: string) => void;
  onOpenAdminRoleModal?: (targetUsername: string) => void;
}

export default function UserProfileModal({
  username,
  isOpen,
  onClose,
  currentUser,
  onOpenChat,
  onOpenAdminRoleModal
}: UserProfileModalProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [friendStatusMessage, setFriendStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && username) {
      fetchProfile();
      setFriendStatusMessage(null);
    } else {
      setProfileData(null);
    }
  }, [isOpen, username]);

  const fetchProfile = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/players/profile/${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!username || !currentUser) return;
    setActionLoading(true);
    setFriendStatusMessage(null);
    try {
      const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
      const res = await fetch("/api/social/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ recipient: username })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFriendStatusMessage({ type: "success", text: data.message || "Arkadaşlık isteği gönderildi!" });
      } else {
        setFriendStatusMessage({ type: "error", text: data.message || data.error || "İstek gönderilemedi." });
      }
    } catch (err) {
      setFriendStatusMessage({ type: "error", text: "Bağlantı hatası oluştu." });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !username) return null;

  const isSelf = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#0c101d] border border-sky-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[85vh] my-auto"
        >
          {/* Top ambient glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="py-16 text-center text-sky-400 font-medium animate-pulse flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 animate-spin text-sky-400" />
              <span>Oyuncu profili yükleniyor...</span>
            </div>
          ) : profileData ? (
            <div className="flex flex-col items-center text-center">
              {/* Head Avatar */}
              <div className="relative mb-4 group">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-400 blur-sm opacity-75 group-hover:opacity-100 transition duration-500" />
                <img
                  src={`https://mc-heads.net/avatar/${profileData.username}/128`}
                  alt={profileData.username}
                  referrerPolicy="no-referrer"
                  className="relative z-10 w-28 h-28 rounded-2xl border-2 border-sky-400/50 object-cover shadow-xl bg-[#12182b]"
                />
                <div className={`absolute bottom-0 right-0 z-20 w-5 h-5 rounded-full border-2 border-[#0c101d] ${profileData.isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} title={profileData.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'} />
              </div>

              {/* Username */}
              <h3 className="text-2xl font-black text-white tracking-wide mb-1 flex items-center gap-2">
                {profileData.username}
              </h3>

              {/* Role Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                  profileData.isAdmin
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : profileData.role && profileData.role !== "Oyuncu"
                    ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}>
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  {profileData.role || (profileData.isAdmin ? "Yönetici" : "Oyuncu")}
                </span>
              </div>

              {/* Status Message alert */}
              {friendStatusMessage && (
                <div className={`w-full p-3 mb-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border ${
                  friendStatusMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                  {friendStatusMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{friendStatusMessage.text}</span>
                </div>
              )}

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                <div className="bg-[#12192c] border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-sky-400" /> Kayıt Tarihi
                  </span>
                  <span className="text-xs font-extrabold text-slate-200">
                    {profileData.registerDate ? new Date(profileData.registerDate).toLocaleDateString("tr-TR") : "Bilinmiyor"}
                  </span>
                </div>

                <div className="bg-[#12192c] border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Durum
                  </span>
                  <span className={`text-xs font-extrabold ${profileData.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {profileData.isOnline ? "Sunucuda Aktif" : "Çevrimdışı"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 w-full">
                {!isSelf && currentUser && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenChat) onOpenChat(profileData.username);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Özel Mesaj Gönder</span>
                    </button>

                    <button
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading}
                      className="w-full py-3 bg-[#172036] hover:bg-[#1f2b48] text-sky-300 border border-sky-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{actionLoading ? "Gönderiliyor..." : "Arkadaş Ekle"}</span>
                    </button>
                  </>
                )}

                {currentUser && currentUser.isAdmin && onOpenAdminRoleModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdminRoleModal(profileData.username);
                    }}
                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all mt-1"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Rol ve Yetkileri Düzenle (Admin)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              Oyuncu bulunamadı.
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
