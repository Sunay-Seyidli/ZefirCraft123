import dynamic from "next/dynamic";
import Head from "next/head";

const AppWithNoSSR = dynamic(() => import("../App"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head>
        <title>ZefirCraft | Towny Sunucusu Resmi Web Sitesi</title>
        <meta name="description" content="ZefirCraft Minecraft Towny sunucusunun resmi web sitesidir. Giriş yap, marketi incele, çarkı çevir ve maceraya katıl!" />
        
        {/* Open Graph / Facebook / Discord / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zefircraft.vercel.app" />
        <meta property="og:title" content="ZefirCraft | Towny Sunucusu" />
        <meta property="og:description" content="ZefirCraft Minecraft Towny sunucusunun resmi web sitesidir. 1.16.5 - 26.2 sürümleriyle hemen katıl!" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="ZefirCraft" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ZefirCraft | Towny Sunucusu" />
        <meta name="twitter:description" content="ZefirCraft Minecraft Towny sunucusunun resmi web sitesidir. 1.16.5 - 26.2 sürümleriyle hemen katıl!" />
        <meta name="twitter:image" content="/logo.png" />

        {/* Discord/WhatsApp Embed Customize */}
        <meta name="theme-color" content="#0ea5e9" />
      </Head>
      <div className="sr-only hidden" aria-hidden="true" style={{ display: 'none' }}>
        <header>
          <h1>ZefirCraft - Minecraft Towny Sunucusu Resmi Web Sitesi</h1>
          <p>ZefirCraft Türkiye'nin en gelişmiş, dengeli ekonomiye ve yenilikçi Towny mekaniklerine sahip Minecraft sunucusudur. 1.16.5 - 26.2 sürümleriyle hemen katıl!</p>
        </header>
        <nav>
          <ul>
            <li><a href="https://zefircraft.vercel.app/#home">ZefirCraft Ana Sayfa</a></li>
            <li><a href="https://zefircraft.vercel.app/#store">ZefirCraft Towny Mağaza - VIP ve Kredi Satın Al</a></li>
            <li><a href="https://zefircraft.vercel.app/#chest">ZefirCraft Web Sandığı - Oyun İçi Eşya Deposu</a></li>
            <li><a href="https://zefircraft.vercel.app/#wheel">ZefirCraft Şans Çarkıfelek - Çevir Kazan</a></li>
            <li><a href="https://zefircraft.vercel.app/#rankings">ZefirCraft Sunucu Oyuncu Sıralamaları</a></li>
            <li><a href="https://zefircraft.vercel.app/#support">ZefirCraft Oyuncu Destek Merkezi - Destek Talebi</a></li>
            <li><a href="https://zefircraft.vercel.app/#rules">ZefirCraft Sunucu Kuralları ve Sözleşmeler</a></li>
            <li><a href="https://zefircraft.vercel.app/#apply">ZefirCraft Yetkili ve Ekip Alımları Başvuru Formu</a></li>
          </ul>
        </nav>
      </div>
      <AppWithNoSSR />
    </>
  );
}
