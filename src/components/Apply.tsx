import React, { useState } from "react";
import { UserCheck, CheckCircle, Send, AlertCircle, Shield, Compass, Hammer, Code, Award, Clock, Mic, MessageSquare, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Apply() {
  const [formData, setFormData] = useState({
    username: "",
    realName: "",
    age: "",
    discord: "",
    position: "Moderatör",
    activeHours: "",
    experience: "",
    reason: "",
    scenario: "",
    microphone: "Evet, mikrofonum var ve Discord sesli kanallarında aktif olabilirim."
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { username, realName, age, discord, position, activeHours, experience, reason, scenario, microphone } = formData;
    if (!username || !realName || !age || !discord || !position || !activeHours || !experience || !reason || !scenario) {
      setError("Lütfen tüm başvuru sorularını eksiksiz doldurun.");
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 65) {
      setError("Lütfen geçerli bir yaş değeri girin (12 - 65 arası).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          realName,
          age: ageNum,
          discord,
          position,
          activeHours,
          experience,
          reason,
          scenario,
          microphone
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Başvuru gönderilirken hata oluştu.");
      }

      setSubmitted(true);
      setFormData({
        username: "",
        realName: "",
        age: "",
        discord: "",
        position: "Moderatör",
        activeHours: "",
        experience: "",
        reason: "",
        scenario: "",
        microphone: "Evet, mikrofonum var ve Discord sesli kanallarında aktif olabilirim."
      });
    } catch (err: any) {
      setError(err.message || "Başvurunuz kaydedilemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  const positionOptions = [
    { id: "Moderatör", title: "Moderatör", desc: "Sohbet düzeni, kural ihlalleri ve oyuncu cezalandırma", icon: <Shield className="w-4 h-4 text-sky-400" /> },
    { id: "Rehber", title: "Rehber", desc: "Yeni oyunculara yardım, komut anlatımı ve canlı destek", icon: <Compass className="w-4 h-4 text-amber-400" /> },
    { id: "Mimar", title: "Mimar (Builder)", desc: "Sunucu içi yapılar, spawn haritaları ve estetik detaylar", icon: <Hammer className="w-4 h-4 text-purple-400" /> },
    { id: "Geliştirici", title: "Geliştirici (Dev)", desc: "Eklenti konfigürasyonu, skript ve teknik hataların çözümü", icon: <Code className="w-4 h-4 text-emerald-400" /> },
    { id: "VIP Sorumlusu", title: "Etkinlik & VIP Sorumlusu", desc: "Topluluk etkinlikleri, çekilişler ve oyuncu motivasyonu", icon: <Award className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <div className="space-y-10 py-4 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101e] border border-[#22304d] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,#3b82f615,transparent_50%)]"></div>
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase px-3 py-1 rounded-md inline-block">
            EKİBE KATILIM FORMU
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">Yetkili Başvurusu</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-lg leading-relaxed mx-auto md:mx-0">
            ZefirCraft ekibine katılarak sunucu içi düzeni sağlamamıza, oyunculara rehberlik etmemize ve topluluğumuzu daha ileriye taşımamıza yardımcı olabilirsiniz!
          </p>
        </div>
        <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 text-sky-400 animate-pulse shrink-0 shadow-lg">
          <UserCheck className="w-8 h-8 text-sky-400" />
        </div>
      </div>

      <div className="bg-[#111625]/85 rounded-3xl border border-[#1e2a40] p-6 md:p-8 shadow-xl space-y-8">
        <div className="flex items-center justify-between border-b border-[#1e2a40]/70 pb-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              Yetkili Adayı Değerlendirme Formu
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-[#161f36] px-3 py-1 rounded-full border border-[#233152]">
            Kademeli Mülakat Süreci
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-2xl flex items-center gap-3 text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12 space-y-5 text-emerald-400"
          >
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="font-extrabold text-2xl text-white">
                Başvurunuz Başarıyla Kaydedildi!
              </h3>
              <p className="text-xs md:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Yönetim ekibimiz başvurunuzu detaylıca inceleyecektir. Başvurunuz kabul edildiğinde <b>oyuncu hesabınıza otomatik olarak yetki verilecek</b> ve Discord üzerinden sizinle iletişime geçilecektir.
              </p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-[#1b2236] hover:bg-[#25324e] text-slate-200 border border-[#2b3957]/55 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Yeni Bir Başvuru Doldur
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. SECTION: Kişisel Bilgiler */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">1</span>
                Kişisel & İletişim Bilgileri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">1. Minecraft Kullanıcı Adınız (IGN)</label>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="örn: ZefirPlayer"
                    className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">2. Adınız ve Soyadınız</label>
                  <input
                    type="text"
                    name="realName"
                    required
                    value={formData.realName}
                    onChange={handleInputChange}
                    placeholder="örn: Ahmet Yılmaz"
                    className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">3. Yaşınız</label>
                  <input
                    type="number"
                    name="age"
                    required
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="örn: 18"
                    className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">4. Discord Kullanıcı Adınız / Tagınız</label>
                  <input
                    type="text"
                    name="discord"
                    required
                    value={formData.discord}
                    onChange={handleInputChange}
                    placeholder="örn: zefir_admin veya ahmet#1234"
                    className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. SECTION: Pozisyon Seçimi */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">2</span>
                Başvurmak İstediğiniz Pozisyon / Görev
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {positionOptions.map(pos => {
                  const isSelected = formData.position === pos.id;
                  return (
                    <div
                      key={pos.id}
                      onClick={() => setFormData({ ...formData, position: pos.id })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? "bg-sky-600/15 border-sky-500/60 shadow-lg shadow-sky-950/50 text-white"
                          : "bg-[#182035]/60 border-[#2b3957]/70 text-slate-400 hover:bg-[#182035] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-extrabold text-xs text-white">
                          {pos.icon}
                          <span>{pos.title}</span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-sky-400 bg-sky-500" : "border-slate-600"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{pos.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SECTION: Aktiflik ve Deneyim Soruları */}
            <div className="space-y-5 pt-2">
              <h3 className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">3</span>
                Aktiflik, Deneyim ve Motivasyon Soruları
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>5. Günlük ve Haftalık Aktiflik Süreniz Nedir?</span>
                </label>
                <input
                  type="text"
                  name="activeHours"
                  required
                  value={formData.activeHours}
                  onChange={handleInputChange}
                  placeholder="örn: Hafta içi günlük 4-5 saat, Hafta sonu günlük 6-8 saat aktif olabilirim."
                  className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>6. Geçmiş Yetkililik Deneyimleriniz (Daha önce hangi sunucularda görev aldınız?)</span>
                </label>
                <textarea
                  name="experience"
                  required
                  rows={4}
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Daha önce çalışmış olduğunuz sunucu isimlerini, aldığınız yetkileri, ne kadar süre görev yaptığınızı ve ayrılma nedenlerinizi detaylandırın..."
                  className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>7. Neden ZefirCraft Ekibine Katılmak İstiyorsunuz? Kendinizi Tanıtın</span>
                </label>
                <textarea
                  name="reason"
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Karakterinizi, oyundaki yaklaşımınızı, sunucumuza katabileceğiniz katma değerleri ve hedeflerinizi yazın..."
                  className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>8. Örnek Senaryo & Kriz Yönetimi: Oyunda kışkırtma / hile şüphesi ile karşılaştığınızda ne yaparsınız?</span>
                </label>
                <textarea
                  name="scenario"
                  required
                  rows={4}
                  value={formData.scenario}
                  onChange={handleInputChange}
                  placeholder="Sohbet ortamında hakaret eden bir oyuncuyla veya makro/hile kullandığından şüphelenilen bir oyuncuyla karşılaştığınızda izleyeceğiniz adım adım süreci yazın..."
                  className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-sky-400" />
                  <span>9. Discord Sesli İletişim & Mikrofon Durumu</span>
                </label>
                <select
                  name="microphone"
                  value={formData.microphone}
                  onChange={handleInputChange}
                  className="w-full text-xs p-3.5 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
                >
                  <option value="Evet, mikrofonum var ve Discord sesli kanallarında aktif bulunabilirim.">
                    Evet, çalışan mikrofonum var ve Discord sesli kanallarda aktif bulunabilirim.
                  </option>
                  <option value="Mikrofonum var ancak sadece dinleyici olarak katabilirim.">
                    Mikrofonum var ancak genellikle dinleyici olarak katılabilirim.
                  </option>
                  <option value="Mikrofonum yok, iletişimimi yazılı kanallardan sağlarım.">
                    Mikrofonum yok, iletişimimi tamamen yazılı kanallardan sağlarım.
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer border border-sky-400/20"
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Değerlendirme Formu Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Yetkili Başvuru Formunu Tamamla ve Gönder</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
