import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="google-site-verification" content="kHuocewu1mEsehpTxEdJlRkNQnVLLZFvEF9RJDJ_ADM" />
        <meta name="google-adsense-account" content="ca-pub-6123498802688262" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        
        {/* Google Sitelinks & Organization Schema (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://zefircraft.vercel.app/#website",
                  "url": "https://zefircraft.vercel.app/",
                  "name": "ZefirCraft",
                  "description": "ZefirCraft Minecraft Towny sunucusunun resmi web sitesidir. Giriş yap, marketi incele, çarkı çevir ve maceraya katıl!",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "https://zefircraft.vercel.app/?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://zefircraft.vercel.app/#organization",
                  "name": "ZefirCraft",
                  "url": "https://zefircraft.vercel.app/",
                  "logo": "https://zefircraft.vercel.app/logo.png",
                  "sameAs": [
                    "https://discord.gg/zefircraft"
                  ],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer support",
                    "email": "sunayseyidli01@gmail.com"
                  }
                },
                {
                  "@type": "ItemList",
                  "@id": "https://zefircraft.vercel.app/#sitelinks",
                  "name": "ZefirCraft Hızlı Bağlantılar",
                  "itemListElement": [
                    {
                      "@type": "SiteNavigationElement",
                      "position": 1,
                      "name": "Ana Sayfa",
                      "url": "https://zefircraft.vercel.app/#home"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 2,
                      "name": "Mağaza",
                      "url": "https://zefircraft.vercel.app/#store"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 3,
                      "name": "Web Sandığı",
                      "url": "https://zefircraft.vercel.app/#chest"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 4,
                      "name": "Çarkıfelek",
                      "url": "https://zefircraft.vercel.app/#wheel"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 5,
                      "name": "Sıralama",
                      "url": "https://zefircraft.vercel.app/#rankings"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 6,
                      "name": "Destek",
                      "url": "https://zefircraft.vercel.app/#support"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 7,
                      "name": "Kurallar",
                      "url": "https://zefircraft.vercel.app/#rules"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 8,
                      "name": "Başvuru",
                      "url": "https://zefircraft.vercel.app/#apply"
                    }
                  ]
                }
              ]
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
