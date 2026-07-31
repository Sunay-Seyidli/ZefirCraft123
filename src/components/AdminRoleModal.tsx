import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Check, X, Sparkles, UserCheck, Key, Lock, AlertCircle } from "lucide-react";

interface AdminRoleModalProps {
  targetUsername: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PERMISSION_KEYS = [
  { key: "users", label: "Kullanıcı Yönetimi", desc: "Oyuncuları görüntüleme, şifre sıfırlama, rol ve bakiye değiştirme" },
  { key: "credits", label: "Kredi Talepleri", desc: "Bakiye yükleme/eksiltme taleplerini onaylama ve reddetme" },
  { key: "store", label: "Mağaza & Ürünler", desc: "Mağazaya ürün ekleme, silme ve komutları düzenleme" },
  { key: "support-tickets", label: "Destek Talepleri", desc: "Oyuncu destek taleplerini yanıtlama ve kapatma" },
  { key: "news", label: "Duyuru & Haberler", desc: "Web sitesine duyuru ekleme ve silme" },
  { key: "categories", label: "Kategori Yönetimi", desc: "Mağaza ürün kategorilerini oluşturma ve silme" },
  { key: "chest", label: "Web Sandığı", desc: "Web sandığı içeriklerini denetleme" },
  { key: "wheel", label: "Çarkıfelek Logları", desc: "Çarkıfelek kazanım geçmişi ve ayarları" },
  { key: "applications", label: "Yetkili Başvuruları", desc: "Yetkili alım başvurularını inceleme ve onaylama" },
  { key: "settings", label: "Sistem Ayarları", desc: "Sunucu IP, Webhook ve sistem ayarlarını değiştirme" }
];

const PREDEFINED_ROLES = [
  "Kurucu",
  "Yönetici",
  "Geliştirici",
  "Moderatör",
  "Mimar",
  "Rehber",
  "Sponsor",
  "VIP Sorumlusu",
  "Oyuncu"
];

export default function AdminRoleModal({
  targetUsername,
  isOpen,
  onClose,
  onSuccess
}: AdminRoleModalProps) {
  const [role, setRole] = useState("Oyuncu");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && targetUsername) {
      loadUserData();
    }
  }, [isOpen, targetUsername]);

  const loadUserData = async () => {
    if (!targetUsername) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/players/profile/${encodeURIComponent(targetUsername)}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role || (data.isAdmin ? "Yönetici" : "Oyuncu"));
        setIsAdmin(!!data.isAdmin);
        setSelectedPermissions(data.permissions || []);
      }
    } catch (err) {
      setErrorMsg("Kullanıcı verileri çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(k => k !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPermissions.length === PERMISSION_KEYS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(PERMISSION_KEYS.map(p => p.key));
    }
  };

  const handleSave = async () => {
    if (!targetUsername) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const adminToken = localStorage.getItem("zefir_admin_token") || localStorage.getItem("koli_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          targetUsername,
          role,
          permissions: selectedPermissions,
          isAdmin
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Rol kaydedilemedi.");
      }
    } catch (err) {
      setErrorMsg("Bağlantı hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !targetUsername) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl bg-[#0d1222] border border-sky-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  Yetki ve Rol Yönetimi: <span className="text-sky-400 font-mono">{targetUsername}</span>
                </h3>
                <p className="text-xs text-slate-400">Oyuncuya özel unvan verin ve yönetici paneli izinlerini tek tek ayarlayın.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition-all cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sky-400 flex flex-col items-center gap-2">
              <Sparkles className="w-6 h-6 animate-spin" />
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <div className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Super Admin Switch */}
              <div className="bg-[#12192d] border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Süper Yönetici (Tam Yetki)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Açık seçildiğinde tüm yönetici paneline kısıtlamasız erişim sağlar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isAdmin ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isAdmin ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Custom Role Input & Quick Select Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Özel Rol / Unvan
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Örn: Moderatör, Aday Rehber..."
                  className="w-full bg-[#12182b] border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white font-semibold outline-none transition-all mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                        role === r
                          ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                          : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    Panel Sayfa İzinleri ({selectedPermissions.length}/{PERMISSION_KEYS.length})
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                  >
                    {selectedPermissions.length === PERMISSION_KEYS.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {PERMISSION_KEYS.map((item) => {
                    const isChecked = selectedPermissions.includes(item.key);
                    return (
                      <div
                        key={item.key}
                        onClick={() => togglePermission(item.key)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? "bg-sky-500/10 border-sky-500/40 text-white"
                            : "bg-[#12182b] border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? "bg-sky-500 border-sky-400 text-white" : "border-slate-600 bg-slate-800"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="text-left">
                          <span className={`text-xs font-bold block ${isChecked ? 'text-sky-300' : 'text-slate-300'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight block">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{saving ? "Kaydediliyor..." : "Ayarları Kaydet"}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
