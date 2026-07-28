import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Mail, Send, CheckCircle, MessageSquare, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: "Siteden satın aldığım ürün ne zaman teslim edilir?",
      a: "Sunucu eklentimiz (McDelivery) siteyi her 15 saniyede bir otomatik olarak sorgular. Bu sebeple satın aldığınız ürünler genellikle oyun içinde 15-30 saniye içerisinde envanterinize teslim edilir."
    },
    {
      q: "Kredi bakiye yüklemesini nasıl yaparım?",
      a: "Hesabınıza bakiye yüklemek için destek ekibimizle iletişime geçebilir veya yetkililerimiz aracılığıyla güvenli bakiye tanımlatabilirsiniz."
    },
    {
      q: "Satın aldığım ürün envanterime gelmedi, ne yapmalıyım?",
      a: "İlk olarak envanterinizde boş yer olduğundan emin olun. Eğer envanteriniz doluyken alım yaptıysanız, yer açtıktan sonra teslimat gerçekleşecektir. Sorun devam ederse Discord sunucumuzdan destek talebi açabilirsiniz."
    },
    {
      q: "Minecraft oyun içi kayıt işlemini nasıl gerçekleştiririm?",
      a: "Sitemizde doğrudan kayıt paneli yoktur. Sunucumuza 'zefircraft.mcsh.io' adresiyle giriş yaptıktan sonra sohbete '/kayitol <şifre> <şifre>' komutunu yazarak anında kayıt olabilirsiniz. Ardından bu şifreyle siteye giriş yapabilirsiniz."
    },
    {
      q: "Sunucuda hile bildirimini nereden yapabilirim?",
      a: "Hile, küfür, hakaret veya oyun içi hataları bildirmek için en hızlı yol Discord sunucumuzdaki '#destek-talebi' veya '#raporlama' kanallarıdır."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.message) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      });
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        const errData = await res.json();
        alert(errData.error || "Destek talebi gönderilirken hata oluştu.");
      }
    } catch (err) {
      alert("Sunucuya bağlanırken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101e] border border-[#22304d] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,#3b82f615,transparent_50%)]"></div>
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md inline-block">
            ZEFIRCRAFT YARDIM MERKEZİ
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">Destek Hattı</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-lg leading-relaxed">
            Yardıma mı ihtiyacınız var? Sıkça sorulan soruları aşağıdan detaylı inceleyebilir veya doğrudan bilet oluşturarak destek ekibimizle görüşebilirsiniz.
          </p>
        </div>
        <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 text-sky-400 animate-pulse shrink-0 shadow-lg">
          <HelpCircle className="w-8 h-8 text-sky-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FAQs Accordions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#111625]/75 border border-[#1e2a40] rounded-2xl overflow-hidden shadow-lg transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4.5 flex items-center justify-between text-left hover:bg-[#182035]/40 cursor-pointer"
                  >
                    <span className="font-extrabold text-slate-200 text-sm md:text-base pr-4">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-sky-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4.5 pt-0 border-t border-[#1e2a40]/55 text-xs md:text-sm text-slate-400 leading-relaxed bg-[#0d111d]/50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Discord Card */}
          <div className="bg-gradient-to-r from-blue-600 via-[#1b253b] to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#233355] mt-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="font-extrabold text-lg flex items-center justify-center sm:justify-start gap-2">
                <MessageSquare className="w-5 h-5 text-sky-300 animate-bounce" />
                Discord Canlı Destek
              </div>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                Web destek taleplerine göre Discord üzerinde 7/24 anlık sesli ve yazılı destek hizmeti sunuyoruz. Sadece birkaç saniyede bilet açabilirsiniz!
              </p>
            </div>
            <a
              href="https://discord.gg/invite-placeholder"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-black rounded-xl transition-all shadow-md inline-block text-center cursor-pointer whitespace-nowrap"
            >
              Hemen Destek Al
            </a>
          </div>
        </div>

        {/* Support Form */}
        <div className="lg:col-span-5 bg-[#111625]/75 rounded-3xl border border-[#1e2a40] p-6 shadow-lg space-y-6">
          <div className="flex items-center gap-2 border-[#1b3d54] border-[#1e2a40]/55 pb-4">
            <Mail className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              Destek Bildirimi Gönder
            </h2>
          </div>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8 space-y-4 text-emerald-400"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-white">Bildiriminiz Alındı!</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Destek talebiniz sistemimize başarıyla kaydedildi. En kısa sürede belirttiğiniz iletişim kanalları üzerinden dönüş sağlanacaktır.
                </p>
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="px-5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Yeni Bildirim Oluştur
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Adınız / Minecraft Kullanıcı Adınız</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="örn: ZefirPlayer"
                  className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">E-Posta VEYA Discord ID</label>
                <input
                  type="text"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="örn: zefircraft#1234 veya email@adres.com"
                  className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Konu</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="örn: Kredi Alım Sorunu"
                  className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Detaylı Mesajınız</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                  className="w-full text-xs p-3 bg-[#182035] border border-[#2b3957] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-sky-500/10"
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-[#1b3d54] border-white border-t-transparent rounded-full"
                    />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Mesajı Gönder</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
