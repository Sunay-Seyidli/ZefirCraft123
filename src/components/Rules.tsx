import React, { useState } from "react";
import { ShieldAlert, BookOpen, MessageSquare, Landmark, Ban, Snowflake } from "lucide-react";
import { motion } from "motion/react";

export default function Rules() {
  const [activeTab, setActiveTab] = useState<string>("general");

  const rulesData = {
    general: {
      title: "Genel Kurallar",
      icon: <BookOpen className="w-5 h-5 text-sky-400" />,
      items: [
        { r: "Hile, makro ve haksız avantaj sağlayıcı üçüncü parti yazılımların kullanımı kesinlikle yasaktır.", p: "Sınırsız uzaklaştırma cezası (IP Ban)." },
        { r: "Herhangi bir oyun açığı (bug) bulup bundan çıkar sağlamak yasaktır. Tespit edilen açıklar derhal yetkililere bildirilmelidir.", p: "Geriye dönük hesap sıfırlanması ve duruma göre süreli/süresiz ban." },
        { r: "Başka oyuncuların hesap güvenliğini tehdit etmek veya çalmaya çalışmak yasaktır.", p: "Süresiz uzaklaştırma." },
        { r: "Sunucu üyelerini tehdit etmek, şantaj yapmak veya kişisel verilerini (doxxing) paylaşmak kesinlikle suçtur.", p: "Süresiz ban ve adli işlem bildirimi." }
      ]
    },
    chat: {
      title: "Sohbet ve Chat Kuralları",
      icon: <MessageSquare className="w-5 h-5 text-sky-400" />,
      items: [
        { r: "Ailevi değerlere, dini ve milli unsurlara yönelik küfür, hakaret veya aşağılama kesinlikle yasaktır.", p: "3 günden başlayarak süresiz uzaklaştırmaya kadar uzanan cezalar." },
        { r: "Sohbet ekranında (global chat) spam, flood yapmak veya aşırı büyük harf kullanımı (caps lock) yasaktır.", p: "Önce sözlü uyarı, ardından 15 dakikadan başlayan susturma (mute) cezası." },
        { r: "Başka Minecraft sunucularının, sitelerin veya discord sunucularının reklamını yapmak kesinlikle yasaktır.", p: "Süresiz susturma veya süresiz ban." },
        { r: "Siyaset, ırkçılık, cinsiyetçilik veya nefret söylemi içeren sohbetler yürütmek yasaktır.", p: "1 günden başlayan susturma veya sunucudan uzaklaştırma." }
      ]
    },
    economy: {
      title: "Ekonomi ve Mağaza Kuralları",
      icon: <Landmark className="w-5 h-5 text-sky-400" />,
      items: [
        { r: "Mağazadan alınan kredileri veya oyun içi eşyaları gerçek para (TL vb.) karşılığında oyuncular arasında satmak yasaktır.", p: "İlgili tüm hesapların tamamen kapatılması." },
        { r: "Oyun içi takas sistemini suistimal ederek dolandırıcılık yapmak yasaktır.", p: "Oyun içi para sıfırlanması ve 3 gün uzaklaştırma." },
        { r: "Kredi yüklemelerinde sahte fatura veya çalıntı kart kullanımı kesinlikle yasaktır.", p: "Süresiz IP uzaklaştırması ve yasal süreç takibi." }
      ]
    },
    punishment: {
      title: "Ceza Sistemi ve İtiraz",
      icon: <Ban className="w-5 h-5 text-sky-400" />,
      items: [
        { r: "Cezalara itiraz etmek sadece Discord destek talebi açarak mümkündür. Oyun içi veya sohbetten itiraz etmek yasaktır.", p: "Ek mute cezası." },
        { r: "Cezalı olan bir oyuncunun yan hesap (alt account) açarak sunucuya girmesi ve oynamaya devam etmesi yasaktır.", p: "Açılan tüm yeni hesapların süresiz banlanması." },
        { r: "Yetkilileri asılsız yere meşgul etmek, yalan beyanda bulunarak şikayette bulunmak cezaya tabidir.", p: "Susturma veya süreli uzaklaştırma." }
      ]
    }
  };

  const currentRules = rulesData[activeTab as keyof typeof rulesData];

  return (
    <div className="space-y-12 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101e] border border-[#22304d] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,#3b82f615,transparent_50%)]"></div>
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md inline-block">
            SUNUCU REHBERİ
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">Sunucu Kuralları</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
            ZefirCraft'ta tüm oyuncularımıza huzurlu, adil ve kaliteli bir oyun ortamı sağlamak en büyük önceliğimizdir. Sunucumuzda oynayan herkes buradaki kuralları okumuş ve kabul etmiş sayılır.
          </p>
        </div>
        <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 text-sky-400 animate-pulse shrink-0 shadow-lg">
          <ShieldAlert className="w-8 h-8 text-sky-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full text-left p-4 rounded-xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer border ${
              activeTab === "general"
                ? "bg-sky-600/15 text-sky-400 border-sky-500/35 shadow-md"
                : "bg-[#111625]/60 hover:bg-[#182035] border-[#23324f]/40 text-slate-400"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Genel Kurallar</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full text-left p-4 rounded-xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer border ${
              activeTab === "chat"
                ? "bg-sky-600/15 text-sky-400 border-sky-500/35 shadow-md"
                : "bg-[#111625]/60 hover:bg-[#182035] border-[#23324f]/40 text-slate-400"
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Sohbet Kuralları</span>
          </button>

          <button
            onClick={() => setActiveTab("economy")}
            className={`w-full text-left p-4 rounded-xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer border ${
              activeTab === "economy"
                ? "bg-sky-600/15 text-sky-400 border-sky-500/35 shadow-md"
                : "bg-[#111625]/60 hover:bg-[#182035] border-[#23324f]/40 text-slate-400"
            }`}
          >
            <Landmark className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Ekonomi Kuralları</span>
          </button>

          <button
            onClick={() => setActiveTab("punishment")}
            className={`w-full text-left p-4 rounded-xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer border ${
              activeTab === "punishment"
                ? "bg-sky-600/15 text-sky-400 border-sky-500/35 shadow-md"
                : "bg-[#111625]/60 hover:bg-[#182035] border-[#23324f]/40 text-slate-400"
            }`}
          >
            <Ban className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Ceza Sistemi & İtiraz</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="md:col-span-8 lg:col-span-9 bg-[#111625]/75 rounded-3xl border border-[#1e2a40] p-6 shadow-lg space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1e2a40]/55 pb-4">
            <div className="p-2.5 bg-[#172035] border border-[#2b3a5a] rounded-xl text-sky-400">
              {currentRules.icon}
            </div>
            <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">
              {currentRules.title}
            </h2>
          </div>

          <div className="divide-y divide-[#1e2a40]/45">
            {currentRules.items.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="w-5.5 h-5.5 rounded-lg bg-[#182035] border border-[#2b3a5a] text-sky-400 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs md:text-sm font-extrabold text-slate-200 leading-relaxed">
                    {item.r}
                  </p>
                </div>
                <div className="pl-8 sm:pl-9 flex items-center gap-1.5 text-xs font-bold text-sky-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Cezası: <b className="text-sky-500 font-extrabold">{item.p}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
