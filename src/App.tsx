import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, Coins, Sparkles, Menu, X, LogOut, ShieldCheck,
  Home as HomeIcon, ShoppingBag, HelpCircle, FileText, UserCheck, LogIn,
  Inbox, Gift, Award, User as UserIcon, Copy, Check, CheckCheck, Boxes,
  MessageSquare, Bell, ArrowRight, MessageCircle, ExternalLink
} from "lucide-react";

import Home from "./components/Home";
import Store from "./components/Store";
import Support from "./components/Support";
import Rules from "./components/Rules";
import Apply from "./components/Apply";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import Chest from "./components/Chest";
import Rankings from "./components/Rankings";
import Profile from "./components/Profile";
import Friends from "./components/Friends";
import UserProfileModal from "./components/UserProfileModal";
import AdminRoleModal from "./components/AdminRoleModal";
import EarnCredits from "./components/EarnCredits";
import LuckyWheel from "./components/LuckyWheel";
import { Users } from "lucide-react";

const logoSrc = "/logo.png";

// Gentle modern notification sound synthesis (Web Audio API)
function playMessageNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // First bell chime (880Hz -> 1320Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1760, now + 0.08);
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Silent fail if audio blocked by browser policy
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [user, setUser] = useState<{ username: string; credits: number; registerDate?: string; isAdmin?: boolean; lastWheelSpin?: string } | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [ipCopied, setIpCopied] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  // Social & Messaging States
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [profileModalUsername, setProfileModalUsername] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [chatInitialFriend, setChatInitialFriend] = useState<string | null>(null);
  const [adminRoleModalTarget, setAdminRoleModalTarget] = useState<string | null>(null);
  const [adminRoleModalOpen, setAdminRoleModalOpen] = useState<boolean>(false);

  // Online Web Visitor Stats & Page Breakdown (100% Real-time)
  const [visitorStats, setVisitorStats] = useState<{
    total: number;
    pages: { home: number; store: number; earn: number; wheel: number; chest: number; rankings: number; friends?: number; other: number };
  }>({
    total: 1,
    pages: { home: 1, store: 0, earn: 0, wheel: 0, chest: 0, rankings: 0, friends: 0, other: 0 }
  });
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [wheelEnabled, setWheelEnabled] = useState(true);
  const [earnEnabled, setEarnEnabled] = useState(true);

  const serverIP = "zefircraft.mcsh.io";

  // Check Wheel & Earn Enabled status
  useEffect(() => {
    fetch("/api/lucky-wheel/settings")
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.enabled === "boolean") {
          setWheelEnabled(data.enabled);
        }
      })
      .catch(() => {});

    fetch("/api/earn/quiz/status")
      .then(res => res.json())
      .then(data => {
        if (data && data.settings && typeof data.settings.enabled === "boolean") {
          setEarnEnabled(data.settings.enabled);
        }
      })
      .catch(() => {});
  }, []);

  // Heartbeat & Online Visitor Stats Polling
  useEffect(() => {
    let sessionId = sessionStorage.getItem("zefir_session_id");
    if (!sessionId) {
      sessionId = "sess_" + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem("zefir_session_id", sessionId);
    }

    const sendHeartbeatAndFetchStats = async () => {
      try {
        await fetch("/api/stats/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, page: currentPage })
        });

        const res = await fetch("/api/stats/online-visitors");
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.total === "number") {
            setVisitorStats(data);
          }
        }
      } catch (err) {
        // silent
      }
    };

    sendHeartbeatAndFetchStats();
    const interval = setInterval(sendHeartbeatAndFetchStats, 6000);
    return () => clearInterval(interval);
  }, [currentPage]);

  // Real-time Web Notification API & Unread message tracking
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const initialUnreadLoadedRef = useRef<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  // Check and sync notification permission state
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }
  }, []);

  // Register Service Worker for Mobile (Android Chrome & iOS Safari PWA) Native Notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
        // SW registered
        if (reg.update) reg.update();
      }).catch((err) => {
        console.warn("SW Registration:", err);
      });

      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "OPEN_CHAT" && event.data.sender) {
          setChatInitialFriend(event.data.sender);
          changePageWithLoader("friends");
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    }
  }, []);

  // Request native Web Notification API permission on Mobile & Desktop
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === "granted") {
          // Play test chime and trigger device vibration feedback
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try { navigator.vibrate([100, 50, 100]); } catch (e) {}
          }
          playMessageNotificationChime();
        }
      } catch (err) {
        // Fallback for older browsers
        Notification.requestPermission((p) => {
          setNotifPermission(p);
        });
      }
    }
  };

  // Automatically request notification permission on user's first touch/click interaction
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      const handleFirstInteraction = () => {
        Notification.requestPermission().then((p) => {
          setNotifPermission(p);
        }).catch(() => {});
      };
      window.addEventListener("click", handleFirstInteraction, { once: true });
      window.addEventListener("touchstart", handleFirstInteraction, { once: true });
      return () => {
        window.removeEventListener("click", handleFirstInteraction);
        window.removeEventListener("touchstart", handleFirstInteraction);
      };
    }
  }, []);

  // Cross-platform native notification dispatcher (Android Chrome SW, iOS PWA, Windows/Mac Desktop)
  const sendCrossPlatformNotification = async (sender: string, messageText: string) => {
    // 1. Mobile Physical Vibration Feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([180, 80, 180]);
      } catch (e) {}
    }

    // 2. Play Web Audio Harmonic Chime
    playMessageNotificationChime();

    // 3. Native OS/Device Notification (Android Chrome, iOS PWA, Windows/Mac Desktop)
    if (typeof window !== "undefined" && "Notification" in window) {
      let currentPerm = Notification.permission;
      if (currentPerm === "default") {
        try {
          currentPerm = await Notification.requestPermission();
          setNotifPermission(currentPerm);
        } catch (e) {}
      }

      if (currentPerm === "granted") {
        const playerAvatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(sender)}/128`;
        const serverBadgeUrl = `/badge.svg`;

        let swNotificationSent = false;

        // Primary: Service Worker Registration (Mandatory on Android Chrome & iOS Safari PWA!)
        if ("serviceWorker" in navigator) {
          try {
            const swPromise = (async () => {
              const reg = await navigator.serviceWorker.ready;
              if (reg && "showNotification" in reg) {
                await reg.showNotification(`${sender} • Yeni Mesaj`, {
                  body: messageText,
                  icon: playerAvatarUrl,
                  badge: serverBadgeUrl,
                  tag: `dm_${sender}_${Date.now()}`,
                  data: {
                    url: `/#friends`,
                    sender: sender,
                  },
                  renotify: true,
                  vibrate: [200, 100, 200],
                } as any);
                swNotificationSent = true;
              }
            })();

            // Don't let SW wait indefinitely
            await Promise.race([
              swPromise,
              new Promise((resolve) => setTimeout(resolve, 600))
            ]);
          } catch (swErr) {
            console.warn("ServiceWorker showNotification error:", swErr);
          }
        }

        // Secondary Desktop Browser Notification Fallback (if SW didn't fire)
        if (!swNotificationSent) {
          try {
            const browserNotif = new Notification(`${sender} • Yeni Mesaj`, {
              body: messageText,
              icon: playerAvatarUrl,
              badge: serverBadgeUrl,
              tag: `dm_${sender}_${Date.now()}`,
              renotify: true,
            } as any);

            browserNotif.onclick = () => {
              window.focus();
              setChatInitialFriend(sender);
              changePageWithLoader("friends");
              try { browserNotif.close(); } catch (e) {}
            };
          } catch (notifErr) {
            console.warn("Window Notification constructor fallback:", notifErr);
            // Retry with standard icon
            try {
              new Notification(`${sender} • Yeni Mesaj`, {
                body: messageText,
                icon: "/logo.png",
                badge: "/logo.png",
              } as any);
            } catch (e) {}
          }
        }
      }
    }
  };

  // Poll latest unread messages for real-time native OS/Desktop notifications (Web Notification API)
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      seenMessageIdsRef.current.clear();
      initialUnreadLoadedRef.current = false;
      return;
    }

    const checkLatestUnread = async () => {
      try {
        const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
        if (!token) return;

        const res = await fetch("/api/social/latest-unread", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const count = typeof data.unreadCount === "number" ? data.unreadCount : 0;
          setUnreadCount(count);

          const messages: Array<{ _id?: string; sender: string; message: string; createdAt: string }> = data.messages || [];

          // On first run, record existing unread messages
          if (!initialUnreadLoadedRef.current) {
            messages.forEach(m => {
              const mId = m._id ? m._id.toString() : `${m.sender}_${m.createdAt}`;
              seenMessageIdsRef.current.add(mId);
            });
            initialUnreadLoadedRef.current = true;
            return;
          }

          // Check for brand new incoming messages
          const newMessages = messages.filter(m => {
            const mId = m._id ? m._id.toString() : `${m.sender}_${m.createdAt}`;
            return !seenMessageIdsRef.current.has(mId) && m.sender.toLowerCase() !== user.username.toLowerCase();
          });

          if (newMessages.length > 0) {
            newMessages.forEach(m => {
              const mId = m._id ? m._id.toString() : `${m.sender}_${m.createdAt}`;
              seenMessageIdsRef.current.add(mId);
              sendCrossPlatformNotification(m.sender, m.message);
            });
          }
        }
      } catch (err) {
        // silent
      }
    };

    checkLatestUnread();
    const interval = setInterval(checkLatestUnread, 1800);
    window.addEventListener("focus", checkLatestUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkLatestUnread);
    };
  }, [user]);

  // Sync page state with URL hash for search engine indexing and direct linking (Sitelinks)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validPages = ["home", "store", "wheel", "chest", "earn", "rankings", "support", "rules", "apply", "login", "admin", "profile", "friends", "social"];
      if (hash && validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    // Initial check on load
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update hash when page changes (supports Sitelinks crawling)
  useEffect(() => {
    if (currentPage) {
      const currentHash = window.location.hash.replace("#", "");
      if (currentHash !== currentPage) {
        window.history.pushState(null, "", `#${currentPage}`);
      }
    }
  }, [currentPage]);

  // Dynamic page-specific SEO Title and Meta Description updater
  useEffect(() => {
    if (!currentPage) return;

    const seoMetadata: Record<string, { title: string; desc: string }> = {
      home: {
        title: "ZefirCraft | Towny Sunucusu Resmi Web Sitesi",
        desc: "ZefirCraft Minecraft Towny sunucusunun resmi web sitesidir. Türkiye'nin en gelişmiş, dengeli ekonomiye sahip Minecraft Towny sunucusunda hemen oynamaya başla!"
      },
      store: {
        title: "ZefirCraft Mağaza | VIP, Kredi ve Sunucu Market Ürünleri",
        desc: "ZefirCraft Minecraft Towny sunucu mağazası. VIP üyelikler, kredi yüklemeleri ve özel oyun içi avantajları güvenli ödeme ile satın al!"
      },
      chest: {
        title: "ZefirCraft Web Sandığı | Oyun İçi Eşya Deposu",
        desc: "ZefirCraft web sandığı sistemiyle kazandığın veya satın aldığın eşyaları güvenli bir şekilde görüntüle ve oyun içine aktar!"
      },
      rankings: {
        title: "ZefirCraft Oyuncu Sıralamaları | En Güçlü Kasabalar ve Oyuncular",
        desc: "ZefirCraft Towny sunucusunun en iyi oyuncuları, en zengin kasabaları, en yüksek seviyeli milletleri ve liderlik tablolarını gör!"
      },
      support: {
        title: "ZefirCraft Destek Merkezi | Yardım ve Destek Talebi Oluştur",
        desc: "ZefirCraft destek sistemi üzerinden karşılaştığın sorunlar hakkında anında yardım al ve yetkililere destek talebi gönder!"
      },
      rules: {
        title: "ZefirCraft Kurallar | Towny Sunucu Kuralları ve Sözleşmeler",
        desc: "ZefirCraft Minecraft Towny sunucusunda geçerli olan genel kurallar, kasaba kuralları, sözleşmeler ve adil oyun ilkeleri."
      },
      apply: {
        title: "ZefirCraft Başvuru | Yetkili ve Ekip Alımları Formu",
        desc: "ZefirCraft yetkili ekibine katılmak için hemen başvuruda bulun. Moderatör, Rehber ve Mimar alımları için formu doldur!"
      },
      login: {
        title: "ZefirCraft Giriş Yap | Oyuncu Portalı ve Kayıt",
        desc: "ZefirCraft web sitesine giriş yap veya kayıt ol. Web sandığı, mağaza, destek ve profil özelliklerine hemen eriş!"
      },
      profile: {
        title: "ZefirCraft Profil | Oyuncu Bilgileri ve İstatistikleri",
        desc: "ZefirCraft oyuncu profilini görüntüle. Sahip olduğun krediler, kayıt tarihi, web sandığın ve kişisel istatistiklerini takip et!"
      },
      admin: {
        title: "ZefirCraft Yönetici Paneli | Sunucu Yönetim Sistemi",
        desc: "ZefirCraft sunucu yöneticileri için yönetim paneli. Ürün ekle, talepleri gör ve sunucu ayarlarını yönet!"
      }
    };

    const currentMeta = seoMetadata[currentPage] || seoMetadata.home;

    // Update Page Title
    document.title = currentMeta.title;

    // Helper to update or create meta tags
    const updateMetaTag = (nameAttr: string, valueAttr: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${valueAttr}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(nameAttr, valueAttr);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Update description, open graph, and twitter meta tags
    updateMetaTag("name", "description", currentMeta.desc);
    updateMetaTag("property", "og:title", currentMeta.title);
    updateMetaTag("property", "og:description", currentMeta.desc);
    updateMetaTag("name", "twitter:title", currentMeta.title);
    updateMetaTag("name", "twitter:description", currentMeta.desc);
  }, [currentPage]);

  // Elegant page preloader transition helper
  const changePageWithLoader = (newPage: string) => {
    setPageLoading(true);
    setMobileMenuOpen(false);
    setTimeout(() => {
      setCurrentPage(newPage);
      setPageLoading(false);
    }, 750);
  };

  // Auto restore sessions on initial page load
  useEffect(() => {
    const restoreSessions = async () => {
      const userToken = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");

      try {
        if (userToken) {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ 
              username: data.username, 
              credits: data.credits, 
              registerDate: data.registerDate, 
              isAdmin: data.isAdmin,
              lastWheelSpin: data.lastWheelSpin
            });
            if (data.isAdmin) {
              setAdminName(data.username);
              localStorage.setItem("koli_admin_token", userToken);
            } else {
              setAdminName(null);
              localStorage.removeItem("koli_admin_token");
            }
          } else {
            localStorage.removeItem("koli_token");
            localStorage.removeItem("koli_admin_token");
            localStorage.removeItem("zefir_token");
            localStorage.removeItem("zefir_admin_token");
            setUser(null);
            setAdminName(null);
          }
        } else {
          localStorage.removeItem("koli_admin_token");
          setUser(null);
          setAdminName(null);
        }
      } catch (err) {
        console.error("Session restoration error:", err);
      } finally {
        setSessionLoading(false);
      }
    };

    restoreSessions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("koli_token");
    localStorage.removeItem("koli_admin_token");
    localStorage.removeItem("zefir_token");
    localStorage.removeItem("zefir_admin_token");
    setUser(null);
    setAdminName(null);
    setCurrentPage("home");
  };

  const handleAdminLogout = () => {
    handleLogout();
  };

  const copyIp = () => {
    navigator.clipboard.writeText(serverIP);
    setIpCopied(true);
    setTimeout(() => setIpCopied(false), 2000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={changePageWithLoader} wheelEnabled={wheelEnabled} earnEnabled={earnEnabled} />;
      case "store":
        return (
          <Store
            user={user}
            onUpdateCredits={(newCr) => setUser(u => u ? { ...u, credits: newCr } : null)}
            onNavigate={changePageWithLoader}
          />
        );
      case "wheel":
        if (!wheelEnabled) {
          return (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-[#0f1629] border border-amber-500/30 rounded-3xl text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <Gift className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Şans Çarkı Geçici Olarak Kapalıdır</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Şans Çarkı modülü yönetici tarafından devredışı bırakılmıştır. Mağazamızı veya ana sayfamızı ziyaret edebilirsiniz!
              </p>
              <button
                onClick={() => changePageWithLoader("home")}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          );
        }
        return (
          <LuckyWheel
            user={user}
            onUpdateCredits={(newCr) => setUser(u => u ? { ...u, credits: newCr } : null)}
            onNavigate={changePageWithLoader}
          />
        );
      case "chest":
        return <Chest />;
      case "earn":
        if (!earnEnabled) {
          return (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-[#0f1629] border border-amber-500/30 rounded-3xl text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <Coins className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Kredi Kazanma Sistemi Geçici Olarak Kapalıdır</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kredi Kazanma ve Anket modülü yönetici tarafından bakıma alınmış veya devredışı bırakılmıştır. Lütfen daha sonra tekrar ziyaret ediniz.
              </p>
              <button
                onClick={() => changePageWithLoader("home")}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          );
        }
        return (
          <EarnCredits
            user={user}
            onUpdateCredits={(newCr) => setUser(u => u ? { ...u, credits: newCr } : null)}
            onNavigate={changePageWithLoader}
          />
        );
      case "support":
        return <Support />;
      case "rules":
        return <Rules />;
      case "apply":
        return <Apply />;
      case "rankings":
        return <Rankings />;
      case "profile":
        return (
          <Profile 
            user={user} 
            onLogout={handleLogout} 
            onNavigate={changePageWithLoader} 
          />
        );
      case "friends":
      case "social":
        return (
          <Friends
            user={user}
            initialChatFriend={chatInitialFriend}
            onOpenProfile={(target) => {
              setProfileModalUsername(target);
              setProfileModalOpen(true);
            }}
            onNavigateLogin={() => changePageWithLoader("login")}
          />
        );
      case "login":
        return (
          <Login
            onLoginSuccess={(userData: any) => {
              setUser(userData);
              if (userData.isAdmin) {
                setAdminName(userData.username);
                localStorage.setItem("koli_admin_token", localStorage.getItem("koli_token") || localStorage.getItem("zefir_token") || "");
                localStorage.setItem("zefir_admin_token", localStorage.getItem("koli_token") || localStorage.getItem("zefir_token") || "");
                changePageWithLoader("admin");
              } else {
                setAdminName(null);
                changePageWithLoader("store");
              }
            }}
          />
        );
      case "admin":
        if (adminName) {
          return <AdminPanel adminName={adminName} onLogout={handleAdminLogout} />;
        }
        return (
          <Login
            onLoginSuccess={(userData: any) => {
              setUser(userData);
              if (userData.isAdmin) {
                setAdminName(userData.username);
                localStorage.setItem("koli_admin_token", localStorage.getItem("koli_token") || localStorage.getItem("zefir_token") || "");
                localStorage.setItem("zefir_admin_token", localStorage.getItem("koli_token") || localStorage.getItem("zefir_token") || "");
                changePageWithLoader("admin");
              } else {
                setAdminName(null);
                changePageWithLoader("store");
              }
            }}
          />
        );
      default:
        return <Home onNavigate={changePageWithLoader} />;
    }
  };

  const navItems = [
    { id: "home", label: "Ana Sayfa", icon: <HomeIcon className="w-4 h-4" /> },
    { id: "store", label: "Mağaza", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "wheel", label: "Çarkıfelek", icon: <Gift className="w-4 h-4 text-amber-400 animate-pulse" /> },
    { id: "earn", label: "Kredi Kazan", icon: <Coins className="w-4 h-4 text-amber-400" /> },
    { id: "chest", label: "Web Sandığı", icon: <Inbox className="w-4 h-4" /> },
    { id: "rankings", label: "Sıralama", icon: <Award className="w-4 h-4" /> },
    { id: "friends", label: "Arkadaşlar", icon: <Users className="w-4 h-4" />, badge: unreadCount },
    { id: "support", label: "Destek", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "rules", label: "Kurallar", icon: <FileText className="w-4 h-4" /> },
    { id: "apply", label: "Başvuru", icon: <UserCheck className="w-4 h-4" /> }
  ];

  const activeNavItems = navItems.filter(item => {
    if (item.id === "wheel" && !wheelEnabled) return false;
    if (item.id === "earn" && !earnEnabled) return false;
    return true;
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b162c] via-[#102040] to-[#0a1426] flex flex-col items-center justify-center text-slate-300">
        <div className="relative w-24 h-24 mb-4 logo-container logo-shine p-1 rounded-full logo-badge-backdrop">
          <div className="absolute -inset-2 bg-sky-400/30 rounded-full blur-md animate-pulse" />
          <img src={logoSrc} alt="ZefirCraft Logo" className="w-full h-full object-contain rounded-full relative z-10" />
        </div>
        <Package className="w-8 h-8 animate-bounce text-sky-400 mb-2" />
        <span className="font-extrabold text-sm tracking-widest text-sky-300 uppercase">ZEFIRCRAFT PORTAL YÜKLENİYOR...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white relative">
      {/* Real High-Resolution Minecraft Cinematic World Background (.JPG) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
        <picture className="w-full h-full block">
          <source media="(max-width: 640px)" srcSet="/bg-earth-mobile.jpg" />
          <img 
            src="/bg-earth.jpg" 
            alt="ZefirCraft Minecraft World Background" 
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.10] saturate-[1.15]"
            loading="eager"
          />
        </picture>
        {/* Soft atmospheric overlay and subtle vignette for readability without hiding the artwork */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060e1f]/35 via-transparent to-[#040915]/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,6,23,0.65)_100%)]" />
      </div>

      {/* Sticky Header Container (Top Ambient Banner + Main Glass Header) */}
      <div className="sticky top-0 z-50 w-full bg-[#0a152d]/80 backdrop-blur-xl border-b border-sky-500/25 shadow-2xl">
        {/* Top Ambient Banner with Live Online Web Visitors */}
        <div className="bg-gradient-to-r from-sky-900/70 via-[#132244]/80 to-cyan-900/70 border-x border-b border-sky-400/30 text-xs py-1.5 px-3 sm:px-4 tracking-wider flex flex-wrap items-center justify-between gap-2 max-w-7xl w-full mx-auto rounded-b-2xl shadow-lg relative z-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-sky-200 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-sky-400 inline" />
              ZefirCraft Towny Sezonu Aktif!
            </span>
            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Real-time Web Online Visitor Counter Badge */}
            <div className="relative">
              <button
                onClick={() => setShowVisitorModal(!showVisitorModal)}
                className="bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 rounded-xl px-2.5 py-1 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40 group"
                title="Tüm sayfalardaki anlık web ziyaretçi sayısını görmek için tıklayın"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Sitede Aktif:</span>
                <span className="bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5 rounded-md font-black border border-emerald-400/30">
                  {visitorStats.total} Web Ziyaretçisi
                </span>
                <span className="text-[9px] text-emerald-400/80 font-bold underline">(Detay)</span>
              </button>

              {/* Popover Breakdown Modal */}
              <AnimatePresence>
                {showVisitorModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0c1222] border border-emerald-500/40 rounded-2xl p-4 shadow-2xl z-50 text-left space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs uppercase tracking-wider">
                        <Users className="w-4 h-4 text-emerald-400" /> Sitede Anlık Web Dağılımı
                      </div>
                      <button
                        onClick={() => setShowVisitorModal(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-2">
                      <div className="flex justify-between items-center bg-[#131b30] p-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold"><HomeIcon className="w-3.5 h-3.5 text-sky-400" /> Ana Sayfa</span>
                        <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{visitorStats.pages.home} kişi</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131b30] p-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold"><ShoppingBag className="w-3.5 h-3.5 text-amber-400" /> Mağaza</span>
                        <span className="font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">{visitorStats.pages.store} kişi</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131b30] p-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold"><Coins className="w-3.5 h-3.5 text-yellow-400" /> Kredi Kazan (Anket/Test)</span>
                        <span className="font-black text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">{visitorStats.pages.earn} kişi</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131b30] p-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold"><Gift className="w-3.5 h-3.5 text-purple-400" /> Çarkıfelek & Web Sandığı</span>
                        <span className="font-black text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">{(visitorStats.pages.wheel || 0) + (visitorStats.pages.chest || 0)} kişi</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131b30] p-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold"><Award className="w-3.5 h-3.5 text-emerald-400" /> Sıralama & Sosyal</span>
                        <span className="font-black text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{(visitorStats.pages.rankings || 0) + (visitorStats.pages.friends || 0)} kişi</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#131b30] p-2 rounded-xl border border-slate-800">
                        <span className="flex items-center gap-1.5 font-bold"><HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Destek & Diğer Sayfalar</span>
                        <span className="font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">{visitorStats.pages.other || 0} kişi</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span>TOPLAM ANLIK WEB:</span>
                      <span className="text-emerald-400 font-black text-xs">{visitorStats.total} ZİYARETÇİ</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyIp}
              title={ipCopied ? "Kopyalandı!" : "IP Adresini Kopyala"}
              className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm max-w-full"
            >
              <span className="text-slate-400 hidden xs:inline">IP:</span>
              <span className="text-sky-200 font-black tracking-tight select-all">{serverIP}</span>
              {ipCopied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
            </button>
          </div>
        </div>

        {/* Main Glass Header */}
        <header className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          
          {/* Logo Brand Area (Harmonious Illuminated Badge) */}
          <button
            onClick={() => changePageWithLoader("home")}
            className="flex items-center gap-3 group cursor-pointer text-left bg-gradient-to-r from-sky-950/60 via-[#13234a]/70 to-cyan-950/60 border border-sky-400/40 hover:border-sky-400/80 px-3 py-1.5 rounded-2xl shadow-lg transition-all backdrop-blur-md"
          >
            <div className="relative w-12 h-12 md:w-13 md:h-13 logo-container shrink-0 p-1 rounded-full logo-badge-backdrop">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-400 blur-sm opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <img
                src={logoSrc}
                alt="ZefirCraft Logo"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-contain rounded-full relative z-10 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-sky-400 group-hover:brightness-125 transition-all uppercase">
                ZefirCraft
              </span>
              <span className="block text-[9px] font-extrabold text-cyan-300 uppercase tracking-widest mt-0.5">TOWNY SUNUCUSU</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {activeNavItems.map((item: any) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  changePageWithLoader(item.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all relative ${
                  currentPage === item.id
                    ? "bg-gradient-to-r from-sky-500/25 to-cyan-500/25 text-sky-300 border border-sky-400/50 shadow-md shadow-sky-950/40 font-extrabold"
                    : "text-slate-300 hover:bg-sky-500/15 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.tag ? (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black rounded-full uppercase tracking-wider">
                    {item.tag}
                  </span>
                ) : null}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </a>
            ))}
          </nav>

          {/* Player Profile & Authentication Block */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Credits Bubble */}
                <div
                  onClick={() => changePageWithLoader("store")}
                  className="bg-sky-500/10 border border-sky-500/25 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-sky-500/20 transition-all shadow-md"
                >
                  <Coins className="w-4 h-4 text-sky-400 animate-pulse" />
                  <span className="text-xs font-black text-sky-300">
                    {user.credits} <span className="text-[10px] text-sky-500 font-normal">Kr.</span>
                  </span>
                </div>

                {/* Logged in Player (Clickable profile) */}
                <button
                  onClick={() => changePageWithLoader("profile")}
                  className="flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-xl bg-[#111728] hover:bg-[#0b1329]/60 border border-sky-950/30 hover:border-sky-500/40 transition-all cursor-pointer group"
                  title="Profilimi Görüntüle"
                >
                  <img
                    src={`https://mc-heads.net/avatar/${user.username}/32`}
                    alt={user.username}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg border border-sky-950/30 group-hover:scale-105 transition-transform"
                  />
                  <div className="text-xs leading-tight">
                    <span className="text-slate-500 block text-[9px] font-semibold">Profil</span>
                    <div className="font-extrabold text-slate-300 group-hover:text-sky-400 transition-colors">
                      {user.username}
                    </div>
                  </div>
                </button>

                {/* Admin Quick Panel Switcher */}
                {user.isAdmin && (
                  <button
                    onClick={() => changePageWithLoader("admin")}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105"
                    title="Yönetici Paneline Git"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Yönetici</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                  title="Oturumu Kapat"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : adminName ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changePageWithLoader("admin")}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-[#a8dfff] rounded-xl text-xs font-extrabold flex items-center gap-2 border border-slate-700 cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Yönetici Paneli
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl cursor-pointer"
                  title="Yönetici Çıkışı"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => changePageWithLoader("login")}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-900/20 transition-all cursor-pointer border border-sky-500/20"
              >
                <LogIn className="w-4 h-4" />
                Oturum Aç
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Avatar / Login + Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <button
                onClick={() => changePageWithLoader("profile")}
                className="flex items-center gap-1.5 p-1 bg-[#102040]/80 border border-sky-400/40 rounded-xl cursor-pointer hover:border-sky-300 transition-all"
                title="Profilim"
              >
                <img
                  src={`https://mc-heads.net/avatar/${user.username}/32`}
                  alt={user.username}
                  className="w-7 h-7 rounded-lg border border-sky-400/40"
                />
              </button>
            ) : (
              <button
                onClick={() => changePageWithLoader("login")}
                className="flex items-center gap-1.5 p-1 bg-[#102040]/80 border border-sky-400/40 rounded-xl cursor-pointer hover:border-sky-300 transition-all"
                title="Oturum Aç"
              >
                <img
                  src="https://mc-heads.net/avatar/MHF_Steve/32"
                  alt="Giriş Yap"
                  className="w-7 h-7 rounded-lg border border-sky-400/40"
                />
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#102040]/80 border border-sky-400/40 text-slate-200 hover:text-white hover:border-sky-300 transition-all cursor-pointer"
              aria-label="Menüyü Aç"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      </div>

      {/* Right Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[290px] sm:w-[330px] bg-[#0e1b38]/95 backdrop-blur-xl border-l border-sky-400/30 p-6 flex flex-col justify-between shadow-2xl lg:hidden"
            >
              <div className="space-y-6">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-4">
                  <div className="flex items-center gap-2.5 bg-[#122347] border border-sky-400/30 px-2.5 py-1.5 rounded-2xl">
                    <div className="relative w-8 h-8 logo-badge-backdrop p-0.5 rounded-full">
                      <div className="absolute -inset-0.5 rounded-full bg-sky-400/40 blur-sm animate-pulse" />
                      <img src={logoSrc} className="w-full h-full rounded-full relative z-10" alt="Logo" />
                    </div>
                    <span className="text-xs font-black text-sky-100 tracking-widest uppercase">ZEFIRCRAFT</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl bg-sky-500/10 text-slate-300 hover:bg-sky-500/20 hover:text-sky-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
 
                {/* Navigation links */}
                <div className="space-y-1.5 flex flex-col overflow-y-auto max-h-[calc(100vh-260px)] pr-1 scrollbar-thin">
                  {activeNavItems.map((item: any) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        changePageWithLoader(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        currentPage === item.id
                          ? "bg-gradient-to-r from-sky-500/25 to-sky-500/10 text-sky-300 border-l-4 border-sky-400 pl-3.5 shadow-md"
                          : "text-slate-300 hover:bg-sky-500/10 hover:text-sky-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={currentPage === item.id ? "text-sky-400" : "text-slate-400"}>
                          {item.icon}
                        </div>
                        <span>{item.label}</span>
                        {item.tag ? (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black rounded-full uppercase tracking-wider">
                            {item.tag}
                          </span>
                        ) : null}
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-bounce">
                          {item.badge}
                        </span>
                      ) : null}
                    </a>
                  ))}
                </div>
              </div>
 
              {/* Footer action block in drawer */}
              <div className="border-t border-sky-500/20 pt-4">
                {user ? (
                  <div className="space-y-3 bg-[#132244] border border-sky-500/25 rounded-2xl p-4 shadow-lg">
                    <button
                      onClick={() => {
                        changePageWithLoader("profile");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left cursor-pointer group hover:opacity-95 active:scale-95 transition-all"
                      title="Profilime Git"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={`https://mc-heads.net/avatar/${user.username}/32`}
                          alt={user.username}
                          className="w-9 h-9 rounded-lg border border-sky-500/30 group-hover:border-sky-400/60 transition-colors"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-sky-100 truncate group-hover:text-sky-300 transition-colors">{user.username}</div>
                        <div className="text-[10px] text-sky-300/80">Oyuncu Profili • Tıkla</div>
                      </div>
                    </button>
                    {user.isAdmin && (
                      <button
                        onClick={() => {
                          changePageWithLoader("admin");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-950/30"
                      >
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Yönetici Paneli</span>
                      </button>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="bg-sky-500/20 px-3 py-1.5 rounded-xl font-bold text-xs text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shrink-0">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{user.credits} Kr.</span>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors cursor-pointer border border-red-500/10"
                        title="Oturumu Kapat"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : adminName ? (
                  <div className="flex items-center justify-between bg-[#132244] border border-sky-500/25 rounded-2xl p-4 shadow-lg">
                    <button
                      onClick={() => {
                        changePageWithLoader("admin");
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-black text-sky-200 flex items-center gap-2 cursor-pointer hover:text-sky-300 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                      <span>Admin Paneli</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAdminLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      changePageWithLoader("login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-950/20 border border-sky-500/20"
                  >
                    <LogIn className="w-4 h-4" />
                    Oturum Aç
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Page Area */}
      <main className={`flex-1 w-full mx-auto py-6 transition-all duration-300 ${currentPage === "admin" ? "max-w-[1600px] px-4 md:px-6 lg:px-8" : "max-w-7xl px-4 md:px-8"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Area */}
      <footer className="bg-gradient-to-b from-[#0d1a36] to-[#0a1324] text-slate-300 border-t border-sky-500/25 py-12 px-4 md:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 logo-container shrink-0 p-1 rounded-full logo-badge-backdrop shadow-lg">
                <img src={logoSrc} alt="ZefirCraft Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight uppercase">ZefirCraft Sunucusu</span>
                <span className="block text-[9px] text-cyan-300 font-bold uppercase tracking-wider">ZEFIRCRAFT PLATFORMU</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              ZefirCraft Minecraft sunucusu, oyuncularına özel kasabalar, dengeli bir ekonomi, rütbe kasaları ve gelişmiş bir Towny evreni sunar. Adil ekonomi ve doğrudan web teslimatı eklentisiyle efsanevi bir macera.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-300">Hızlı Bağlantılar</div>
            <div className="flex flex-col gap-2 text-xs">
              <button onClick={() => setCurrentPage("home")} className="text-left text-slate-300 hover:text-sky-300 transition-colors cursor-pointer">Ana Sayfa</button>
              <button onClick={() => setCurrentPage("store")} className="text-left text-slate-300 hover:text-sky-300 transition-colors cursor-pointer">Mağaza</button>
              <button onClick={() => setCurrentPage("rules")} className="text-left text-slate-300 hover:text-sky-300 transition-colors cursor-pointer">Kurallar</button>
              <button onClick={() => setCurrentPage("apply")} className="text-left text-slate-300 hover:text-sky-300 transition-colors cursor-pointer">Başvuru Formu</button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-3 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-300">Sunucu Bağlantısı</div>
            <div className="space-y-1.5">
              <div className="text-xs text-sky-200 font-mono select-all font-bold">IP: {serverIP}</div>
              <div className="text-[10px] text-slate-400">
                Sürüm: 1.21.4 (Java & Bedrock) • Tüm Sürümlerle Giriş Yapılabilir.
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-sky-500/20 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} ZefirCraft. Tüm hakları saklıdır. Bu sitenin Mojang AB veya Microsoft ile herhangi bir ortaklığı bulunmamaktadır.
          </div>
        </div>
      </footer>

      {/* Dynamic Nav Loading Transition Overlay */}
      <AnimatePresence>
        {pageLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] bg-gradient-to-b from-[#0b162c] via-[#102040] to-[#0a1426] flex flex-col items-center justify-center"
          >
            <div className="relative flex flex-col items-center">
              {/* Pulsing glow ring */}
              <div className="absolute -inset-4 rounded-full bg-sky-500/20 blur-2xl animate-pulse" />
              
              {/* Spinner ring */}
              <div className="w-24 h-24 rounded-full border-[#1b3d54] border-sky-500/10 border-t-sky-500 animate-spin absolute" />
              
              {/* Pulsing logo */}
              <motion.img
                src={logoSrc}
                alt="ZefirCraft Loading"
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full object-contain relative z-10 shadow-2xl filter drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] border border-sky-500/30"
              />
              
              <div className="mt-8 flex flex-col items-center gap-2">
                <Package className="w-5 h-5 text-sky-400 animate-bounce" />
                <span className="text-[10px] font-black tracking-[0.2em] text-sky-400 uppercase animate-pulse">ZEFIRCRAFT YÜKLENİYOR...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Profile Modal */}
      <UserProfileModal
        username={profileModalUsername}
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setProfileModalUsername(null);
        }}
        currentUser={user}
        onOpenChat={(friendUsername) => {
          setChatInitialFriend(friendUsername);
          changePageWithLoader("friends");
        }}
        onOpenAdminRoleModal={(target) => {
          setAdminRoleModalTarget(target);
          setAdminRoleModalOpen(true);
        }}
      />

      {/* Admin Role & Permission Modal */}
      <AdminRoleModal
        targetUsername={adminRoleModalTarget}
        isOpen={adminRoleModalOpen}
        onClose={() => {
          setAdminRoleModalOpen(false);
          setAdminRoleModalTarget(null);
        }}
        onSuccess={() => {
          // Trigger refresh
        }}
      />
    </div>
  );
}
