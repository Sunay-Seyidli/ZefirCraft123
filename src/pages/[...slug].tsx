import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

const AppWithNoSSR = dynamic(() => import("../App"), {
  ssr: false,
});

const pageMeta: Record<string, { title: string; desc: string }> = {
  store: {
    title: "ZefirCraft • Mağaza & VIP Market",
    desc: "ZefirCraft Towny Mağaza: Minecraft VIP paketleri, spawnerlar, kasa anahtarları ve kredi satın alımı.",
  },
  earn: {
    title: "ZefirCraft • Ücretsiz Kredi Kazan & Anket Portalı",
    desc: "ZefirCraft anket ve testleri çözerek ücretsiz kredi kazanın, mağazada harcayın!",
  },
  wheel: {
    title: "ZefirCraft • Şans Çarkı & Günlük Ödüller",
    desc: "Her gün ZefirCraft şans çarkını çevirin, VIP, kredi ve sürpriz oyun içi ödüller kazanın.",
  },
  rankings: {
    title: "ZefirCraft • Oyuncu Sıralamaları & En İyiler",
    desc: "ZefirCraft en zengin kasabalar, en çok kredi kazananlar ve aktif oyuncu liderlik tablosu.",
  },
  chest: {
    title: "ZefirCraft • Web Sandığı & Teslimat",
    desc: "ZefirCraft Web Sandığınızdaki eşyaları ve ödülleri Minecraft oyun içine teslim alın.",
  },
  friends: {
    title: "ZefirCraft • Sosyal & Arkadaşlık & Özel Mesajlar",
    desc: "ZefirCraft oyuncuları ile arkadaş ekleşin, özel mesajlaşın ve birlikte oynayın.",
  },
  rules: {
    title: "ZefirCraft • Sunucu Kuralları & Oyun Rehberi",
    desc: "ZefirCraft topluluk, kasaba ve genel oyun kuralları kılavuzu.",
  },
  support: {
    title: "ZefirCraft • Destek Talebi & Oyuncu İletişim",
    desc: "ZefirCraft teknik destek ve oyuncu yardım merkezi.",
  },
  apply: {
    title: "ZefirCraft • Yetkili & Ekip Alımları",
    desc: "Rehber, Moderatör ve Mimar kadrosuna katılmak için yetkili başvuru formu.",
  },
  login: {
    title: "ZefirCraft • Giriş Yap & Kayıt Ol",
    desc: "ZefirCraft hesabınıza giriş yapın veya yeni bir hesap oluşturun.",
  },
  map: {
    title: "ZefirCraft • Towny Canlı Haritası",
    desc: "ZefirCraft Towny sunucusunun canlı haritası. Kasabaları, arsaları ve oyuncuları harita üzerinden canlı takip edin.",
  },
};

export default function SubPage() {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : (router.query.slug || "");

  const currentMeta = pageMeta[slug] || {
    title: "ZefirCraft • Türkiye'nin En İyi Minecraft Towny Sunucusu",
    desc: "ZefirCraft Minecraft Towny Web Portalı: Market, VIP paketleri, ücretsiz kredi kazanma, günlük şans çarkı ve sıralamalar.",
  };

  return (
    <>
      <Head>
        <title>{currentMeta.title}</title>
        <meta name="description" content={currentMeta.desc} />
        
        {/* Open Graph / Facebook / Discord / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://zefircraft.vercel.app/${slug}`} />
        <meta property="og:title" content={currentMeta.title} />
        <meta property="og:description" content={currentMeta.desc} />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="ZefirCraft" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={currentMeta.title} />
        <meta name="twitter:description" content={currentMeta.desc} />
        <meta name="twitter:image" content="/logo.png" />

        {/* Theme */}
        <meta name="theme-color" content="#0ea5e9" />
      </Head>
      <AppWithNoSSR />
    </>
  );
}
