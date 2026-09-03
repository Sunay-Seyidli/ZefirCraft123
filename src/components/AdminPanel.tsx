import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  History,
  FileCheck,
  FileText,
  Terminal,
  Settings,
  X,
  Plus,
  Trash2,
  Edit,
  Check,
  AlertTriangle,
  Play,
  Coins,
  KeyRound,
  ArrowRightLeft,
  UserCheck,
  Calendar,
  Eye,
  Shield,
  UserX,
  Lock,
  Award,
  Gift,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Megaphone,
  Network,
  HelpCircle,
  Target,
  Clock,
  CreditCard,
  Building2,
  Smartphone,
  ShieldCheck
} from "lucide-react";
import { User, Product, PurchaseRequest, StaffApplication, AdminStats, Article, Category } from "../types";
import AdminRoleModal from "./AdminRoleModal";

// Left Menu Subgroups Type
type SubMenuId =
  | "dashboard"
  | "players-list"
  | "bans"
  | "categories"
  | "products-list"
  | "orders"
  | "payment-settings"
  | "payment-orders"
  | "wheel-settings"
  | "wheel-logs"
  | "quiz-settings"
  | "news"
  | "apps"
  | "console"
  | "sys-settings"
  | "support-tickets";

interface SidebarGroup {
  label: string;
  id: string;
  icon: React.ReactNode;
  children: { id: SubMenuId; label: string; icon: React.ReactNode }[];
}

export interface FormattedPurchase {
  username: string;
  productName: string;
  price: number;
  createdAt: string;
  status?: string;
}

interface AdminPanelProps {
  adminName: string;
  onLogout: () => void;
}

export default function AdminPanel({ adminName, onLogout }: AdminPanelProps) {
  // Global Admin panel States
  const [activeTab, setActiveTab] = useState<SubMenuId>("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Categories & Modules definition for organized admin interface
  const adminCategories = [
    { id: "general", label: "Genel & Analiz", icon: <LayoutDashboard className="w-4 h-4 text-sky-400" /> },
    { id: "players", label: "Oyuncular & Destek", icon: <Users className="w-4 h-4 text-blue-400" />, badge: stats?.pendingApps },
    { id: "store", label: "Mağaza & Ekonomi", icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />, badge: stats?.pendingPurchases },
    { id: "earn", label: "Etkinlik & Kredi", icon: <Coins className="w-4 h-4 text-amber-400" /> },
    { id: "system", label: "Sistem & Konsol", icon: <Settings className="w-4 h-4 text-slate-400" /> }
  ];

  const adminModulesList = [
    { id: "dashboard" as SubMenuId, category: "general", label: "Genel İstatistikler", desc: "Oyuncu, gelir ve aktiflik grafikleri", icon: <LayoutDashboard className="w-4 h-4 text-sky-400" />, keywords: ["istatistik", "genel", "analiz", "gelir", "bakiye", "dashboard", "grafik"] },
    { id: "players-list" as SubMenuId, category: "players", label: "Oyuncu Yönetimi", desc: "Kullanıcı hesapları, bakiye ekle/çıkar, yetki & şifre", icon: <Users className="w-4 h-4 text-blue-400" />, keywords: ["oyuncu", "kullanıcı", "bakiye", "yetki", "şifre", "hesap", "sil", "kredi"] },
    { id: "bans" as SubMenuId, category: "players", label: "Yasaklı Listesi (Ban)", desc: "Cezalı ve engellenmiş oyuncu kayıtları", icon: <UserX className="w-4 h-4 text-red-400" />, keywords: ["ban", "yasak", "ceza", "engelle", "küfür", "hile"] },
    { id: "apps" as SubMenuId, category: "players", label: "Yetkili Başvuruları", desc: "Aday yetkili başvuru formları ve mülakat masası", icon: <FileCheck className="w-4 h-4 text-purple-400" />, badge: stats?.pendingApps, keywords: ["başvuru", "yetkili", "mülakat", "rehber", "mimar", "admin", "onay"] },
    { id: "support-tickets" as SubMenuId, category: "players", label: "Destek Talepleri", desc: "Kullanıcı destek ve teknik bilet yanıt merkezi", icon: <Megaphone className="w-4 h-4 text-amber-400" />, keywords: ["destek", "ticket", "bilet", "yardım", "talep", "şikayet"] },
    { id: "categories" as SubMenuId, category: "store", label: "Mağaza Kategorileri", desc: "Rütbe, Eşya, VIP gibi ürün grupları düzenleme", icon: <Award className="w-4 h-4 text-amber-400" />, keywords: ["kategori", "mağaza", "grup", "vip", "eşya", "rütbe"] },
    { id: "products-list" as SubMenuId, category: "store", label: "Ürün Kataloğu & Fiyat", desc: "Mağaza eşya fiyatları, simgeleri ve sunucu komutları", icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />, keywords: ["ürün", "fiyat", "komut", "eşya", "katalog", "satış", "mağaza"] },
    { id: "orders" as SubMenuId, category: "store", label: "Sipariş Geçmişi", desc: "Sunucuya gönderilen sipariş ve bakiye geçmişi", icon: <History className="w-4 h-4 text-cyan-400" />, badge: stats?.pendingPurchases, keywords: ["sipariş", "geçmiş", "satın alma", "teslimat", "ödeme"] },
    { id: "payment-settings" as SubMenuId, category: "store", label: "Ödeme Yöntemleri (POS)", desc: "Shopier, PayTR, Banka IBAN, Papara ve Kredi Paketleri ayarları", icon: <CreditCard className="w-4 h-4 text-sky-400" />, keywords: ["ödeme", "shopier", "paytr", "havale", "papara", "kredi", "pos", "iban", "kart"] },
    { id: "payment-orders" as SubMenuId, category: "store", label: "Kredi Siparişleri & Havale Onayı", desc: "Gelen gerçek para ödemeleri, bekleyen havaleler ve onay masası", icon: <Coins className="w-4 h-4 text-amber-400" />, keywords: ["ödeme", "sipariş", "havale", "onay", "dekont", "bakiye"] },
    { id: "quiz-settings" as SubMenuId, category: "earn", label: "Kredi Kazan & Anketler", desc: "Sistem durumunu aç/kapa, anket soruları, AdSense & reklam linkleri", icon: <HelpCircle className="w-4 h-4 text-amber-400" />, keywords: ["anket", "kredi", "kazan", "adsense", "reklam", "soru", "devre dışı", "aç", "kapat", "açık", "kapalı", "bakım"] },
    { id: "wheel-settings" as SubMenuId, category: "earn", label: "Şans Çarkı (Çarkıfelek)", desc: "Çarkıfelek aç/kapa, ödül oranları ve bilet bedelleri", icon: <Gift className="w-4 h-4 text-pink-400" />, keywords: ["çark", "çarkıfelek", "şans", "ödül", "oran", "kredi", "aç", "kapat"] },
    { id: "wheel-logs" as SubMenuId, category: "earn", label: "Çark Kazanım Logları", desc: "Çarkıfelek kazanan oyuncuların detaylı günlüğü", icon: <Coins className="w-4 h-4 text-[#ff2200]" />, keywords: ["çark", "kazanım", "günlük", "log", "ödül"] },
    { id: "news" as SubMenuId, category: "system", label: "Duyuru & Haber Paylaşımı", desc: "Ana sayfa duyuru ve güncelleme panosu", icon: <FileText className="w-4 h-4 text-sky-400" />, keywords: ["duyuru", "haber", "güncelleme", "yazı", "paylaş"] },
    { id: "console" as SubMenuId, category: "system", label: "Canlı Web Konsolu", desc: "Minecraft sunucusuna doğrudan RCON/Web komutu gönderme", icon: <Terminal className="w-4 h-4 text-emerald-400" />, keywords: ["konsol", "komut", "rcon", "canlı", "minecraft", "sunucu"] },
    { id: "sys-settings" as SubMenuId, category: "system", label: "Sistem Ayarları & Kurallar", desc: "Sunucu IP, Discord Webhook, Gizli Anahtar ve Sunucu Kuralları", icon: <Settings className="w-4 h-4 text-slate-400" />, keywords: ["sistem", "ayar", "ip", "webhook", "discord", "kural", "kurallar", "secret", "anahtar"] }
  ];

  // Auto-sync activeTab with selectedCategory
  useEffect(() => {
    const mod = adminModulesList.find(m => m.id === activeTab);
    if (mod) {
      setSelectedCategory(mod.category);
    }
  }, [activeTab]);

  // Admin Role & Permission Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalTarget, setRoleModalTarget] = useState<string | null>(null);

  // Expanded groups in sidebar
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    panel: true,
    players: true,
    store: true,
    games: false,
    content: false,
    advanced: false
  });

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Data Lists
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [purchases, setPurchases] = useState<FormattedPurchase[]>([]);
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [bannedPlayers, setBannedPlayers] = useState<{ username: string; reason: string; date: string; admin: string }[]>([
    { username: "Cheater101", reason: "Huzuni Hile Kullanımı", date: "2026-07-15 14:32", admin: "ZefirAdmin" },
    { username: "ToxicSpammer", reason: "Sohbette Ağır Küfür ve Taciz", date: "2026-07-17 19:10", admin: "ZefirAdmin" }
  ]);

  // General Settings States
  const [secretKey, setSecretKey] = useState("");
  const [serverIP, setServerIP] = useState("zefircraft.ddns.net");
  const [discordWebhook, setDiscordWebhook] = useState("https://discord.com/api/webhooks/...");
  const [seasonalMode, setSeasonalMode] = useState(true);
  const [creditRatio, setCreditRatio] = useState(1);
  const [requireOnlineForPurchase, setRequireOnlineForPurchase] = useState(true);
  const [pluginStatusInfo, setPluginStatusInfo] = useState<{ isConnected: boolean; lastHeartbeat: string | null; onlineCount: number }>({ isConnected: false, lastHeartbeat: null, onlineCount: 0 });

  // Adsterra & Monlix & Earn Credits Settings
  const [adsterraUrl, setAdsterraUrl] = useState("https://www.effectivecpmnetwork.com/cs5m4z1hd5?key=3c6909ed230acc836b43757f2fb49c9d");
  const [monlixUrl, setMonlixUrl] = useState("https://monlix.com");
  const [adRewardCredits, setAdRewardCredits] = useState(1);
  const [adCooldownMinutes, setAdCooldownMinutes] = useState(10);
  const [dailyBonusCredits, setDailyBonusCredits] = useState(10);
  const [earnSystemEnabled, setEarnSystemEnabled] = useState(true);
  const [rulesList, setRulesList] = useState([
    "Sunucuda hile kullanımı, X-Ray ve avantaj sağlayan modlar kesinlikle yasaktır.",
    "Sohbette reklam yapmak, küfür, hakaret ve taciz edici kelimeler kullanmak yasaktır.",
    "Oyun içi hatalardan (bug) faydalanmak yasaktır; tespit edilirse bildirilmelidir.",
    "Dolandırıcılık veya hesap çalmaya yönelik her türlü girişim süresiz uzaklaştırma sebebidir."
  ]);
  const [newRuleInput, setNewRuleInput] = useState("");

  // Search & Filter state
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Forms states
  const [creditForm, setCreditForm] = useState({ username: "", action: "add" as "add" | "subtract", amount: 10 });
  const [passwordForm, setPasswordForm] = useState({ username: "", newPassword: "" });
  const [banForm, setBanForm] = useState({ username: "", reason: "" });

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: 0,
    description: "",
    imageUrl: "",
    category: "",
    commandsText: "" // newline separated commands
  });

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", imageUrl: "" });

  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", content: "", imageUrl: "" });

  // Lucky Wheel Settings States
  const [wheelEnabled, setWheelEnabled] = useState(true);
  const [wheelPrice, setWheelPrice] = useState(0); // 0 means daily free
  const [wheelMultiplier, setWheelMultiplier] = useState(1);
  const [wheelLogs, setWheelLogs] = useState<{ id: string; username: string; reward: string; date: string }[]>([]);

  // Terminal Console Logs
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<{ text: string; type: "info" | "success" | "error" | "input" }[]>([
    { text: "ZefirCraft Web API Entegrasyon Konsolu Başlatıldı.", type: "info" },
    { text: "McDelivery eklentisine bağlantı kuruldu. Kuyruk aktif.", type: "success" },
    { text: "Veritabanı bağlantısı stabil. Sürüm 1.21.4 API.", type: "info" }
  ]);

  // Support Tickets States
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplyInput, setTicketReplyInput] = useState("");

  // Quiz Questions & Quests States
  const [adminQuizQuestions, setAdminQuizQuestions] = useState<any[]>([]);
  const [adminQuizQuests, setAdminQuizQuests] = useState<any[]>([]);
  const [adminQuizSettings, setAdminQuizSettings] = useState({
    bannerNotice: "Size ücretsiz kredi sağlayabilmek ve sunucu giderlerimizi karşılayabilmek için bu sayfada reklam alanları yer almaktadır.",
    adsenseCode: "",
    quizQuestionsPerRound: 10,
    secondsPerQuestion: 30,
    creditsPerQuiz: 1,
    minCorrectToWin: 7,
    cooldownMinutes: 0
  });

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctIndex: 0
  });

  const [showQuestModal, setShowQuestModal] = useState(false);
  const [questForm, setQuestForm] = useState({
    title: "",
    description: "",
    targetCount: 3,
    rewardCredits: 5
  });

  // Payment Settings & Orders States
  const [paymentSettings, setPaymentSettings] = useState<any>({
    creditPerTL: 1,
    minPaymentTL: 10,
    maxPaymentTL: 5000,
    packages: [
      { id: "pkg_1", amountTL: 50, credits: 50, bonus: 0, badge: "", isPopular: false },
      { id: "pkg_2", amountTL: 100, credits: 110, bonus: 10, badge: "%10 Bonus", isPopular: true },
      { id: "pkg_3", amountTL: 250, credits: 300, bonus: 50, badge: "%20 Bonus", isPopular: false },
      { id: "pkg_4", amountTL: 500, credits: 650, bonus: 150, badge: "%30 Mega Bonus", isPopular: false }
    ],
    shopier: { enabled: true, testMode: true, apiKey: "", apiSecret: "", websiteIndex: "1" },
    paytr: { enabled: false, testMode: true, merchantId: "", merchantKey: "", merchantSalt: "" },
    havale: {
      enabled: true,
      bankName: "Ziraat Bankası / Enpara / Garanti",
      accountHolder: "Ahmet Yılmaz",
      iban: "TR12 3456 7890 1234 5678 9012 34",
      paparaNumber: "1234567890",
      instructions: "Açıklama alanına SADECE kullanıcı adınızı veya Sipariş Kodunuzu yazınız."
    }
  });
  const [paymentOrders, setPaymentOrders] = useState<any[]>([]);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentOrderFilter, setPaymentOrderFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [newPackage, setNewPackage] = useState({
    amountTL: 150,
    credits: 165,
    bonus: 15,
    badge: "",
    isPopular: false
  });
  const [showAddPackage, setShowAddPackage] = useState(false);

  // Sidebar Configuration
  const sidebarGroups: SidebarGroup[] = [
    {
      label: "Genel Panel",
      id: "panel",
      icon: <LayoutDashboard className="w-4.5 h-4.5" />,
      children: [{ id: "dashboard", label: "İstatistikler", icon: <LayoutDashboard className="w-4 h-4" /> }]
    },
    {
      label: "Oyuncu & Yetki",
      id: "players",
      icon: <Users className="w-4.5 h-4.5" />,
      children: [
        { id: "players-list", label: "Oyuncu Yönetimi", icon: <Users className="w-4 h-4" /> },
        { id: "bans", label: "Yasaklı Listesi", icon: <UserX className="w-4 h-4" /> }
      ]
    },
    {
      label: "Mağaza İşlemleri",
      id: "store",
      icon: <ShoppingBag className="w-4.5 h-4.5" />,
      children: [
        { id: "categories", label: "Kategoriler", icon: <Award className="w-4 h-4" /> },
        { id: "products-list", label: "Ürün Kataloğu", icon: <ShoppingBag className="w-4 h-4" /> },
        { id: "orders", label: "Sipariş Geçmişi", icon: <History className="w-4 h-4" /> },
        { id: "payment-settings", label: "Ödeme Yöntemleri (POS)", icon: <CreditCard className="w-4 h-4" /> },
        { id: "payment-orders", label: "Kredi Siparişleri & Havale", icon: <Coins className="w-4 h-4" /> }
      ]
    },
    {
      label: "İçerik Yönetimi",
      id: "content",
      icon: <Megaphone className="w-4.5 h-4.5" />,
      children: [
        { id: "news", label: "Duyurular", icon: <FileText className="w-4 h-4" /> },
        { id: "apps", label: "Yetkili Başvuruları", icon: <FileCheck className="w-4 h-4" /> }
      ]
    },
    {
      label: "Sistem Ayarları",
      id: "advanced",
      icon: <Settings className="w-4.5 h-4.5" />,
      children: [
        { id: "console", label: "Web Konsolu", icon: <Terminal className="w-4 h-4" /> },
        { id: "sys-settings", label: "Sistem Ayarları", icon: <Settings className="w-4 h-4" /> }
      ]
    }
  ];

  // Load Data on Mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  const getAdminToken = () =>
    localStorage.getItem("koli_admin_token") ||
    localStorage.getItem("koli_token") ||
    localStorage.getItem("zefir_admin_token") ||
    localStorage.getItem("zefir_token");

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAdminToken();
      if (!token) {
        setError("Yönetici oturumu bulunamadı.");
        setLoading(false);
        return;
      }

      // 1) Stats
      const statsRes = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2) Users
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // 3) Categories
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // 4) Products
      const prodRes = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fallback to fetch normal products if admin route lacks GET
      const finalProdRes = prodRes.ok ? prodRes : await fetch("/api/products");
      if (finalProdRes.ok) {
        const prodData = await finalProdRes.json();
        setProducts(prodData);
      }

      // 5) Applications
      const appRes = await fetch("/api/admin/applications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData);
      }

      // 6) News / Articles
      const artRes = await fetch("/api/articles");
      if (artRes.ok) {
        const artData = await artRes.json();
        setArticles(artData);
      }

      // 7) Settings
      const setRes = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.secretKey) setSecretKey(setData.secretKey);
        if (setData.serverIp) setServerIP(setData.serverIp);
        if (setData.requireOnlineForPurchase !== undefined) setRequireOnlineForPurchase(Boolean(setData.requireOnlineForPurchase));
      }

      // 7.2) Plugin status & settings
      const pluginRes = await fetch("/api/admin/plugin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pluginRes.ok) {
        const pData = await pluginRes.json();
        if (pData.serverIp) setServerIP(pData.serverIp);
        if (pData.secretKey) setSecretKey(pData.secretKey);
        if (pData.requireOnlineForPurchase !== undefined) setRequireOnlineForPurchase(Boolean(pData.requireOnlineForPurchase));
        setPluginStatusInfo({
          isConnected: Boolean(pData.isConnected),
          lastHeartbeat: pData.lastHeartbeat || null,
          onlineCount: Array.isArray(pData.onlinePlayers) ? pData.onlinePlayers.length : (pData.onlineCount || 0)
        });
      }

      // 7.5) Earn Settings
      const earnRes = await fetch("/api/admin/earn-settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (earnRes.ok) {
        const earnData = await earnRes.json();
        if (earnData.adsterraUrl) setAdsterraUrl(earnData.adsterraUrl);
        if (earnData.monlixUrl) setMonlixUrl(earnData.monlixUrl);
        if (earnData.adRewardCredits) setAdRewardCredits(earnData.adRewardCredits);
        if (earnData.adCooldownMinutes) setAdCooldownMinutes(earnData.adCooldownMinutes);
        if (earnData.dailyBonusCredits) setDailyBonusCredits(earnData.dailyBonusCredits);
        if (earnData.enabled !== undefined) setEarnSystemEnabled(earnData.enabled !== false);
      }

      // Load all purchases request history
      const purchasesRes = await fetch("/api/purchases/recent");
      if (purchasesRes.ok) {
        const purchData = await purchasesRes.json();
        setPurchases(purchData);
      }

      // 8) Support tickets
      const tixRes = await fetch("/api/admin/support-tickets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tixRes.ok) {
        const tixData = await tixRes.ok ? await tixRes.json() : [];
        setTickets(tixData);
      }

      // 9) Wheel logs & settings
      const wheelSettingsRes = await fetch("/api/lucky-wheel/settings");
      if (wheelSettingsRes.ok) {
        const wData = await wheelSettingsRes.json();
        setWheelEnabled(wData.enabled !== false);
        setWheelPrice(wData.price || 0);
        setWheelMultiplier(wData.multiplier || 1);
      }

      const wheelLogsRes = await fetch("/api/lucky-wheel/logs");
      if (wheelLogsRes.ok) {
        const wheelData = await wheelLogsRes.json();
        const formattedWheelLogs = wheelData.map((log: any) => ({
          id: log._id || log.id,
          username: log.username,
          reward: log.reward,
          date: new Date(log.createdAt).toLocaleString("tr-TR")
        }));
        setWheelLogs(formattedWheelLogs);
      }

      // 10) Quiz Questions & Quests & Settings
      const qRes = await fetch("/api/admin/quiz/questions", { headers: { Authorization: `Bearer ${token}` } });
      if (qRes.ok) setAdminQuizQuestions(await qRes.json());

      const questRes = await fetch("/api/admin/quiz/quests", { headers: { Authorization: `Bearer ${token}` } });
      if (questRes.ok) setAdminQuizQuests(await questRes.json());

      const qSetRes = await fetch("/api/admin/quiz/settings", { headers: { Authorization: `Bearer ${token}` } });
      if (qSetRes.ok) setAdminQuizSettings(await qSetRes.json());

      // 11) Payment settings & orders
      try {
        const pSetRes = await fetch("/api/admin/payments/settings", { headers: { Authorization: `Bearer ${token}` } });
        if (pSetRes.ok) setPaymentSettings(await pSetRes.json());

        const pOrdRes = await fetch("/api/admin/payments/orders", { headers: { Authorization: `Bearer ${token}` } });
        if (pOrdRes.ok) {
          const pOrdData = await pOrdRes.json();
          setPaymentOrders(Array.isArray(pOrdData) ? pOrdData : []);
        }
      } catch (payErr) {
        console.error("Payment data fetch error:", payErr);
      }
    } catch (err) {
      setError("Veriler yüklenirken teknik bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // PAYMENT HANDLERS
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSaving(true);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/payments/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentSettings)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Ödeme ayarları ve paketler başarıyla kaydedildi!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(data.error || "Ödeme ayarları kaydedilemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleApprovePaymentOrder = async (orderId: string) => {
    const adminNote = prompt("Onay açıklaması / Not (İsteğe Bağlı):", "Ödeme teyit edildi, kredi yüklendi.");
    if (adminNote === null) return;

    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/payments/orders/${orderId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || "Sipariş onaylandı ve oyuncunun bakiyesine eklendi!");
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchAdminData();
      } else {
        setError(data.error || "Sipariş onaylanamadı.");
      }
    } catch (e) {
      setError("Bağlantı hatası oluştu.");
    }
  };

  const handleRejectPaymentOrder = async (orderId: string) => {
    const adminNote = prompt("İptal / Red sebebi:", "Ödeme doğrulanmadı veya dekont bulunamadı.");
    if (adminNote === null) return;

    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/payments/orders/${orderId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNote })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Sipariş iptal edildi.");
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchAdminData();
      } else {
        setError(data.error || "İptal işlemi gerçekleştirilemedi.");
      }
    } catch (e) {
      setError("Bağlantı hatası oluştu.");
    }
  };

  const handleAddPaymentPackage = () => {
    if (newPackage.amountTL <= 0 || newPackage.credits <= 0) {
      setError("Lütfen geçerli bir tutar ve kredi miktarı girin.");
      return;
    }
    const pkgId = `pkg_${Date.now()}`;
    const updatedPackages = [
      ...(paymentSettings.packages || []),
      { ...newPackage, id: pkgId }
    ];
    setPaymentSettings({ ...paymentSettings, packages: updatedPackages });
    setShowAddPackage(false);
    setNewPackage({ amountTL: 150, credits: 165, bonus: 15, badge: "", isPopular: false });
  };

  const handleRemovePaymentPackage = (pkgId: string) => {
    const updatedPackages = (paymentSettings.packages || []).filter((p: any) => p.id !== pkgId);
    setPaymentSettings({ ...paymentSettings, packages: updatedPackages });
  };

  // QUIZ & QUESTS HANDLERS
  const handleSaveQuizQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question || !questionForm.optionA || !questionForm.optionB || !questionForm.optionC || !questionForm.optionD) {
      triggerNotification("Lütfen soru cümlesini ve 4 seçeneğin tamamını doldurun.", false);
      return;
    }

    const payload = {
      question: questionForm.question,
      options: [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD],
      correctIndex: Number(questionForm.correctIndex)
    };

    try {
      const token = getAdminToken();
      const url = editingQuestionId ? `/api/admin/quiz/questions/${editingQuestionId}` : "/api/admin/quiz/questions";
      const method = editingQuestionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerNotification(editingQuestionId ? "Soru başarıyla güncellendi!" : "Yeni anket sorusu eklendi!");
        setShowQuestionModal(false);
        setEditingQuestionId(null);
        setQuestionForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctIndex: 0 });
        fetchAdminData();
      } else {
        const d = await res.json();
        triggerNotification(d.error || "Soru kaydedilemedi.", false);
      }
    } catch {
      triggerNotification("Bağlantı hatası oluştu.", false);
    }
  };

  const handleDeleteQuizQuestion = async (id: string) => {
    if (!window.confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/quiz/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerNotification("Soru silindi.");
        setAdminQuizQuestions(prev => prev.filter(q => q.id !== id));
      } else {
        triggerNotification("Soru silinemedi.", false);
      }
    } catch {
      triggerNotification("Bağlantı hatası oluştu.", false);
    }
  };

  const handleSaveQuizQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questForm.title || !questForm.targetCount || !questForm.rewardCredits) {
      triggerNotification("Başlık, hedef sayı ve ödül kredi zorunludur.", false);
      return;
    }

    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/quiz/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(questForm)
      });

      if (res.ok) {
        triggerNotification("Yeni anket görevi eklendi!");
        setShowQuestModal(false);
        setQuestForm({ title: "", description: "", targetCount: 3, rewardCredits: 5 });
        fetchAdminData();
      } else {
        triggerNotification("Görev eklenemedi.", false);
      }
    } catch {
      triggerNotification("Bağlantı hatası oluştu.", false);
    }
  };

  const handleDeleteQuizQuest = async (id: string) => {
    if (!window.confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/quiz/quests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerNotification("Görev silindi.");
        setAdminQuizQuests(prev => prev.filter(q => q.id !== id));
      } else {
        triggerNotification("Görev silinemedi.", false);
      }
    } catch {
      triggerNotification("Bağlantı hatası oluştu.", false);
    }
  };

  const handleSaveQuizSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/quiz/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(adminQuizSettings)
      });
      if (res.ok) {
        triggerNotification("Anket ve AdSense ayarları başarıyla kaydedildi!");
      } else {
        triggerNotification("Ayarlar kaydedilemedi.", false);
      }
    } catch {
      triggerNotification("Bağlantı hatası oluştu.", false);
    }
  };

  const triggerNotification = (message: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    if (!ticketReplyInput.trim()) return;
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/support-tickets/${ticketId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: ticketReplyInput })
      });
      if (res.ok) {
        triggerNotification("Cevabınız başarıyla iletildi.");
        setTicketReplyInput("");
        
        // Reload ticket list
        const tixRes = await fetch("/api/admin/support-tickets", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tixRes.ok) {
          const tixData = await tixRes.json();
          setTickets(tixData);
          const updated = tixData.find((t: any) => t._id === ticketId || t.id === ticketId);
          if (updated) setSelectedTicket(updated);
        }
      } else {
        const err = await res.json();
        triggerNotification(err.error || "Cevap gönderilemedi.", false);
      }
    } catch (err) {
      triggerNotification("Teknik bir sorun oluştu.", false);
    }
  };

  const handleTicketStatus = async (ticketId: string, newStatus: "open" | "closed") => {
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/admin/support-tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        triggerNotification(`Talep başarıyla ${newStatus === "closed" ? "kapatıldı" : "açıldı"}.`);
        
        // Reload ticket list
        const tixRes = await fetch("/api/admin/support-tickets", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tixRes.ok) {
          const tixData = await tixRes.json();
          setTickets(tixData);
          const updated = tixData.find((t: any) => t._id === ticketId || t.id === ticketId);
          if (updated) setSelectedTicket(updated);
        }
      } else {
        const err = await res.json();
        triggerNotification(err.error || "Talep durumu güncellenemedi.", false);
      }
    } catch (err) {
      triggerNotification("Teknik bir sorun oluştu.", false);
    }
  };

  // Sidebar Group Toggle Handler
  const toggleSidebarGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // 1) USER MANAGEMENTS ACTIONS
  const handleCreditChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditForm.username || creditForm.amount <= 0) {
      triggerNotification("Lütfen geçerli bir kullanıcı ve kredi miktarı girin.", false);
      return;
    }
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/users/${creditForm.username}/credits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: creditForm.action,
          amount: creditForm.amount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification(data.error || "Kredi güncellenirken hata oluştu.", false);
        return;
      }

      triggerNotification(data.message);
      // Update local state
      setUsers(prev =>
        prev.map(u => (u.username === creditForm.username ? { ...u, credits: data.newCredits } : u))
      );
      setCreditForm(prev => ({ ...prev, username: "", amount: 10 }));
    } catch (err) {
      triggerNotification("Kredi güncelleme sunucu işlemi başarısız.", false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.username || passwordForm.newPassword.length < 4) {
      triggerNotification("Şifre en az 4 karakter olmalıdır.", false);
      return;
    }
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/users/${passwordForm.username}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification(data.error || "Şifre sıfırlanamadı.", false);
        return;
      }

      triggerNotification("Oyuncu şifresi başarıyla sıfırlandı!");
      setPasswordForm({ username: "", newPassword: "" });
    } catch (err) {
      triggerNotification("Şifre sıfırlama işlemi başarısız oldu.", false);
    }
  };

  const handleRoleToggle = async (username: string, currentIsAdmin: boolean) => {
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/users/${username}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification(data.error || "Yetki güncellenemedi.", false);
        return;
      }

      triggerNotification(data.message);
      fetchAdminData(); // refresh full list
    } catch (err) {
      triggerNotification("Yetki güncellenemedi.", false);
    }
  };

  const handleSaveEarnSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/earn-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          adsterraUrl,
          monlixUrl,
          adRewardCredits,
          adCooldownMinutes,
          dailyBonusCredits,
          enabled: earnSystemEnabled
        })
      });
      if (res.ok) {
        triggerNotification("Adsterra, Monlix & Kredi kazanım ayarları başarıyla kaydedildi.");
      } else {
        triggerNotification("Ayarlar kaydedilemedi.", false);
      }
    } catch (err) {
      triggerNotification("Bağlantı hatası oluştu.", false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`"${username}" isimli oyuncuyu tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/users/${username}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification(data.error || "Kullanıcı silinemedi.", false);
        return;
      }

      triggerNotification("Oyuncu başarıyla silindi.");
      setUsers(prev => prev.filter(u => u.username !== username));
    } catch (err) {
      triggerNotification("Oyuncu silinemedi.", false);
    }
  };

  const handleBanUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banForm.username || !banForm.reason) {
      triggerNotification("Lütfen kullanıcı adı ve gerekçe girin.", false);
      return;
    }
    const newBan = {
      username: banForm.username,
      reason: banForm.reason,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      admin: "ZefirAdmin"
    };
    setBannedPlayers([newBan, ...bannedPlayers]);
    triggerNotification(`"${banForm.username}" sunucudan ve siteden başarıyla yasaklandı.`);
    setBanForm({ username: "", reason: "" });
  };

  const handleUnbanUser = (username: string) => {
    setBannedPlayers(prev => prev.filter(p => p.username !== username));
    triggerNotification(`"${username}" kullanıcısının yasağı kaldırıldı.`);
  };

  // 2) CATEGORY ACTIONS
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) {
        const d = await res.json();
        triggerNotification(d.error || "Kategori eklenemedi.", false);
        return;
      }

      const newCat = await res.json();
      setCategories([...categories, newCat]);
      triggerNotification("Yeni kategori başarıyla eklendi!");
      setCategoryForm({ name: "", imageUrl: "" });
      setShowCategoryForm(false);
    } catch (err) {
      triggerNotification("Kategori eklenemedi.", false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait ürünler silinmeyecektir.")) {
      return;
    }
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        triggerNotification("Kategori silinemedi.", false);
        return;
      }

      setCategories(categories.filter(c => c._id !== id));
      triggerNotification("Kategori silindi.");
    } catch (err) {
      triggerNotification("Kategori silinemedi.", false);
    }
  };

  // 3) PRODUCT ACTIONS
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price,
      description: prod.description,
      imageUrl: prod.imageUrl,
      category: prod.category,
      commandsText: prod.commands.join("\n")
    });
    setShowProductForm(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, price, description, imageUrl, category, commandsText } = productForm;
    if (!name || price <= 0 || !category) {
      triggerNotification("Lütfen ürün adı, geçerli fiyat ve kategori seçin.", false);
      return;
    }

    const commands = commandsText
      .split("\n")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const payload = {
      name,
      price,
      description,
      imageUrl: imageUrl || undefined,
      category,
      commands
    };

    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      let url = "/api/admin/products";
      let method = "POST";

      if (editingProduct) {
        url = `/api/admin/products/${editingProduct._id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        triggerNotification(d.error || "Ürün kaydedilemedi.", false);
        return;
      }

      triggerNotification(editingProduct ? "Ürün başarıyla güncellendi!" : "Yeni ürün başarıyla eklendi!");
      setProductForm({ name: "", price: 0, description: "", imageUrl: "", category: "", commandsText: "" });
      setShowProductForm(false);
      setEditingProduct(null);
      fetchAdminData();
    } catch (err) {
      triggerNotification("Ürün kayıt işlemi başarısız.", false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        triggerNotification("Ürün silinemedi.", false);
        return;
      }

      setProducts(products.filter(p => p._id !== id));
      triggerNotification("Ürün başarıyla silindi.");
    } catch (err) {
      triggerNotification("Ürün silinemedi.", false);
    }
  };

  // 4) ANNOUNCEMENTS ACTIONS
  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) return;

    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newsForm)
      });

      if (!res.ok) {
        triggerNotification("Duyuru yayınlanamadı.", false);
        return;
      }

      triggerNotification("Yeni haber/duyuru başarıyla yayınlandı!");
      setNewsForm({ title: "", content: "", imageUrl: "" });
      setShowNewsForm(false);
      fetchAdminData();
    } catch (err) {
      triggerNotification("Duyuru yayınlama bağlantı hatası.", false);
    }
  };

  const handleNewsDelete = async (id: string) => {
    if (!window.confirm("Bu duyuruyu kaldırmak istediğinizden emin misiniz?")) return;
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        triggerNotification("Duyuru silinemedi.", false);
        return;
      }

      triggerNotification("Duyuru kaldırıldı.");
      setArticles(articles.filter(a => a._id !== id));
    } catch (err) {
      triggerNotification("Duyuru silinemedi.", false);
    }
  };

  // 5) STAFF APPLICATIONS ACTION
  const handleApplicationProcess = async (id: string, status: "accepted" | "rejected") => {
    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerNotification(data.error || "Başvuru durumu güncellenemedi.", false);
        return;
      }

      triggerNotification(data.message || `Başvuru başarıyla ${status === "accepted" ? "onaylandı ve yetkilendirildi" : "reddedildi"}.`);
      setApplications(prev => prev.map(a => (a._id === id ? { ...a, status } : a)));
      fetchAdminData();
    } catch (err) {
      triggerNotification("Başvuru güncellenemedi.", false);
    }
  };

  // 6) WEB CONSOLE TERMINAL EXECUTOR
  const executeTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalLogs(prev => [...prev, { text: `> ${cmd}`, type: "input" }]);
    setTerminalInput("");

    try {
      const token = localStorage.getItem("zefir_admin_token") || localStorage.getItem("zefir_token");
      const res = await fetch("/api/admin/execute-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ command: cmd })
      });

      const data = await res.json();
      if (res.ok) {
        setTerminalLogs(prev => [...prev, { text: `[BAŞARILI] ${data.message}`, type: "success" }]);
      } else {
        setTerminalLogs(prev => [...prev, { text: `[HATA] ${data.error || "Komut çalıştırılamadı."}`, type: "error" }]);
      }
    } catch (err) {
      setTerminalLogs(prev => [...prev, { text: "[HATA] Sunucuyla bağlantı kesildi.", type: "error" }]);
    }
  };

  // 7) SYSTEM SETTINGS ACTIONS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAdminToken();
      const payload = {
        secretKey: secretKey.trim(),
        requireOnlineForPurchase,
        serverIp: serverIP.trim()
      };

      const [res1, res2] = await Promise.all([
        fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }),
        fetch("/api/admin/plugin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      ]);

      if (res1.ok || res2.ok) {
        triggerNotification("Minecraft sunucu adresi ve eklenti ayarları başarıyla kaydedildi!");
      } else {
        triggerNotification("Ayarlar kaydedilirken hata oluştu.", false);
      }
    } catch (err) {
      triggerNotification("Ayarlar kaydedilemedi.", false);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    setRulesList([...rulesList, newRuleInput.trim()]);
    setNewRuleInput("");
    triggerNotification("Yeni sunucu kuralı eklendi!");
  };

  const handleDeleteRule = (idx: number) => {
    setRulesList(rulesList.filter((_, i) => i !== idx));
    triggerNotification("Sunucu kuralı silindi.");
  };

  // Filtered lists
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
    u.ipAddress.includes(playerSearchQuery)
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
        <div className="w-12 h-12 border-[#1b3d54] border-sky-500/10 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Yönetim Verileri Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="w-full py-2 px-1 lg:px-2">
      
      {/* Dynamic Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 md:right-8 z-50 bg-[#10b981] text-white px-5 py-4 rounded-xl border border-[#059669] shadow-2xl flex items-center gap-3 font-semibold text-xs"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-4 md:right-8 z-50 bg-[#ef4444] text-white px-5 py-4 rounded-xl border border-[#dc2626] shadow-2xl flex items-center gap-3 font-semibold text-xs"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Header Area */}
      <div className="bg-[#111625] border border-[#1e293b] rounded-3xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="bg-[#1e293b] text-slate-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-sky-500/20 inline-block">
            ZefirCraft Yönetim Masası
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
            <Shield className="w-7 h-7 text-sky-500" />
            YÖNETİCİ KONTROL PANELİ
          </h1>
          <p className="text-slate-400 text-xs max-w-xl">
            Tüm kullanıcı hesaplarını, mağaza fiyatlarını, şans çarkı oranlarını, duyuruları, yetkili başvurularını ve sunucu konsolunu buradan yönetin.
          </p>
        </div>

        {/* Action shortcut widgets */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("console");
              setMobileSidebarOpen(false);
            }}
            className="px-4 py-2.5 bg-slate-900 border border-[#27355a] rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>Konsol</span>
          </button>
          <button
            onClick={fetchAdminData}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 border border-sky-400/25 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Network className="w-4 h-4" />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* ORGANIZED TOP NAVIGATION & SEARCH BAR */}
      <div className="bg-[#111625] border border-[#1e293b] rounded-3xl p-5 mb-6 space-y-4 shadow-xl">
        {/* Quick Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-sky-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              placeholder="🔍 Modül veya ayar ara... (ör: anket, çark, bakiye, başvuru, kural, ürün, konsol)"
              className="w-full bg-[#0a0d18] border border-[#27355a] focus:border-sky-500 rounded-2xl pl-11 pr-10 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {adminSearchQuery && (
              <button
                onClick={() => setAdminSearchQuery("")}
                className="absolute right-3 p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          {adminSearchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1222] border border-sky-500/40 rounded-2xl p-3 z-30 shadow-2xl space-y-2 max-h-80 overflow-y-auto backdrop-blur-xl">
              <span className="text-[10px] text-sky-400 font-black uppercase tracking-wider block px-2">
                Arama Sonuçları ({adminModulesList.filter(m => m.label.toLowerCase().includes(adminSearchQuery.toLowerCase()) || m.desc.toLowerCase().includes(adminSearchQuery.toLowerCase()) || m.keywords.some(k => k.includes(adminSearchQuery.toLowerCase()))).length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {adminModulesList
                  .filter(m => 
                    m.label.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
                    m.desc.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
                    m.keywords.some(k => k.includes(adminSearchQuery.toLowerCase()))
                  )
                  .map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setActiveTab(mod.id);
                        setAdminSearchQuery("");
                      }}
                      className="text-left p-3 rounded-xl bg-[#141b2d] hover:bg-sky-950/50 border border-[#27355a] hover:border-sky-500/50 transition-all flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-sky-500/40 shrink-0">
                        {mod.icon}
                      </div>
                      <div>
                        <span className="text-xs font-black text-white group-hover:text-sky-300 block">
                          {mod.label}
                        </span>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{mod.desc}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Main Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#1e293b]/60 pt-3">
          {adminCategories.map(cat => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  const firstMod = adminModulesList.find(m => m.category === cat.id);
                  if (firstMod) setActiveTab(firstMod.id);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isCatActive
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400 shadow-lg shadow-sky-950/50 scale-[1.02]"
                    : "bg-[#0a0d18] text-slate-400 hover:text-white border-[#27355a] hover:bg-[#141b2d]"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {cat.badge && cat.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {cat.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Sub-Module Pills for Selected Category */}
        <div className="flex flex-wrap items-center gap-2 bg-[#090d19] p-2.5 rounded-2xl border border-[#1e293b]/80">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 hidden sm:inline-block">
            Modüller:
          </span>
          {adminModulesList
            .filter(m => m.category === selectedCategory)
            .map(mod => {
              const isActive = activeTab === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                    isActive
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/60 font-black shadow-md shadow-sky-950/50"
                      : "bg-[#111625] text-slate-400 hover:text-white border-[#222f4c] hover:bg-[#172035]"
                  }`}
                >
                  {mod.icon}
                  <span>{mod.label}</span>
                  {mod.badge && mod.badge > 0 ? (
                    <span className="px-1.5 py-0.2 text-[9px] font-black rounded-md bg-amber-500 text-slate-950">
                      {mod.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Grid: Sidebar Navigation on the left, Dynamic views on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
        
        {/* Mobile menu trigger */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="w-full py-3.5 bg-[#111625] text-white border border-[#1e293b] rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-slate-900 transition-colors active:scale-98"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
            <span>Yönetim Menüsünü Aç (Soldan)</span>
          </button>
        </div>

        {/* LEFT SIDEBAR NAVIGATION: Flat, Grouped & Elegant Drawer on Mobile / Sticky Sidebar on Desktop */}
        <div className={`
          fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-[#0c101d] border-r border-[#1e293b]/80 p-6 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto lg:w-auto lg:max-w-none lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0 lg:overflow-y-visible lg:col-span-3 lg:order-1 lg:sticky lg:top-24
        `}>
          <div className="bg-[#111625]/90 backdrop-blur-xl border border-[#1e293b] rounded-3xl p-5 shadow-2xl space-y-5 h-full lg:h-auto flex flex-col justify-between lg:justify-start">
            
            <div className="space-y-5">
              {/* Sidebar header */}
              <div className="border-[#1b3d54] border-[#1e293b]/80 pb-4 flex items-center justify-between lg:block text-left">
                <div>
                  <span className="text-[9px] text-sky-400 font-black uppercase tracking-widest block mb-0.5">ZefirCraft</span>
                  <span className="text-sm font-black text-white flex items-center gap-1.5 justify-start">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Yönetim Konsolu
                  </span>
                </div>
                
                {/* Close button for mobile drawer */}
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="lg:hidden p-1.5 bg-[#171e32] hover:bg-slate-800 border border-[#27355a] rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Navigation Flat Groups */}
              <nav className="space-y-4">
                {[
                  {
                    group: "Genel",
                    items: [
                      { id: "dashboard", label: "İstatistikler", icon: <LayoutDashboard className="w-4 h-4" /> }
                    ]
                  },
                  {
                    group: "Oyuncu & Destek",
                    items: [
                      { id: "players-list", label: "Oyuncu Yönetimi", icon: <Users className="w-4 h-4" /> },
                      { id: "bans", label: "Yasaklı Listesi", icon: <UserX className="w-4 h-4" /> },
                      { id: "apps", label: "Yetkili Başvuruları", icon: <FileCheck className="w-4 h-4" /> },
                      { id: "support-tickets", label: "Destek Talepleri", icon: <Megaphone className="w-4 h-4" /> }
                    ]
                  },
                  {
                    group: "Mağaza & Ekonomi",
                    items: [
                      { id: "categories", label: "Kategoriler", icon: <Award className="w-4 h-4" /> },
                      { id: "products-list", label: "Ürün Kataloğu", icon: <ShoppingBag className="w-4 h-4" /> },
                      { id: "orders", label: "Sipariş Geçmişi", icon: <History className="w-4 h-4" /> }
                    ]
                  },
                  {
                    group: "Şans Oyunları & Kredi",
                    items: [
                      { id: "quiz-settings", label: "Kredi Kazan & Anketler", icon: <HelpCircle className="w-4 h-4 text-amber-400" /> },
                      { id: "wheel-settings", label: "Çark Ayarları", icon: <Gift className="w-4 h-4" /> },
                      { id: "wheel-logs", label: "Çark Kazanımları", icon: <Coins className="w-4 h-4" /> }
                    ]
                  },
                  {
                    group: "Sistem",
                    items: [
                      { id: "news", label: "Duyuru Paylaşımı", icon: <FileText className="w-4 h-4" /> },
                      { id: "console", label: "Web Konsolu", icon: <Terminal className="w-4 h-4" /> },
                      { id: "sys-settings", label: "Sistem Ayarları", icon: <Settings className="w-4 h-4" /> }
                    ]
                  }
                ].map((grp, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block pl-2">
                      {grp.group}
                    </span>
                    <div className="space-y-1">
                      {grp.items.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as SubMenuId);
                              setMobileSidebarOpen(false); // Close mobile menu after clicking
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all relative group cursor-pointer ${
                              isActive
                                ? "bg-gradient-to-r from-cyan-950/40 to-blue-950/20 text-cyan-300 border-l-2 border-cyan-400 font-extrabold shadow-md shadow-cyan-950/50"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/40 pl-3"
                            }`}
                          >
                            <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-400"}`}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* RIGHT DYNAMIC VIEWS AREA (Desktop matches column grid on the right) */}
        <div className="col-span-1 lg:col-span-9 lg:order-2 bg-[#111625]/80 backdrop-blur-md border border-[#1e293b] rounded-3xl p-6 min-h-[650px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              
              {/* 1) TAB: DASHBOARD / OVERVIEW */}
              {activeTab === "dashboard" && stats && (
                <div className="space-y-8">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Mevcut Sunucu Durumu</h2>
                    <p className="text-xs text-slate-400">ZefirCraft portalının genel veritabanı istatistikleri ve anlık sipariş durumları.</p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-2">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Kayıtlı Oyuncular</div>
                      <div className="text-2xl font-black text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-sky-400" />
                        <span>{stats.totalPlayers}</span>
                      </div>
                    </div>

                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-2">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Katalogtaki Ürünler</div>
                      <div className="text-2xl font-black text-white flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-sky-400" />
                        <span>{stats.totalProducts}</span>
                      </div>
                    </div>

                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-2">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Toplam Sirkülasyon</div>
                      <div className="text-2xl font-black text-sky-400 flex items-center gap-2">
                        <Coins className="w-6 h-6" />
                        <span>{stats.totalCredits} Kr.</span>
                      </div>
                    </div>

                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-2">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">İşlem Bekleyen Siparişler</div>
                      <div className="text-2xl font-black text-cyan-400 flex items-center gap-2">
                        <History className="w-6 h-6" />
                        <span>{stats.pendingPurchases}</span>
                      </div>
                    </div>

                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-2">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Bekleyen Yetkili Başvuruları</div>
                      <div className="text-2xl font-black text-purple-400 flex items-center gap-2">
                        <FileCheck className="w-6 h-6" />
                        <span>{stats.pendingApps}</span>
                      </div>
                    </div>

                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-2">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Aktif Sezon Durumu</div>
                      <div className="text-base font-black text-sky-400 flex items-center gap-1.5 pt-1.5">
                        <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
                        <span>Survival Sezon 2 Aktif</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Table */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Son Mağaza Siparişleri</h3>
                      <button onClick={() => setActiveTab("orders")} className="text-xs text-sky-400 hover:underline">Tümünü Gör</button>
                    </div>

                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-[#1b3d54] border-[#27355a] bg-[#121829] text-slate-400 text-[10px] font-black uppercase">
                              <th className="p-4">Kullanıcı</th>
                              <th className="p-4">Ürün ID</th>
                              <th className="p-4">Durum</th>
                              <th className="p-4">Tarih</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#27355a]/40 text-slate-300">
                            {purchases.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-4 text-center italic text-slate-500">Son sipariş kaydı bulunmuyor.</td>
                              </tr>
                            ) : (
                              purchases.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/35">
                                  <td className="p-4 font-bold">{p.username}</td>
                                  <td className="p-4 text-slate-400 font-mono text-[11px]">{p.productName}</td>
                                  <td className="p-4">
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      {p.status || "Teslim Edildi"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-[11px] text-slate-500">
                                    {p.createdAt ? new Date(p.createdAt).toLocaleString("tr-TR") : "-"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Quick Reminders Box */}
                  <div className="bg-[#1c183a] border border-[#3b357d] rounded-2xl p-5 space-y-3">
                    <span className="text-[11px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-sky-400" />
                      Önemli Yönetici Hatırlatması
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Lütfen Spigot sunucunuzdaki <b>McDelivery</b> eklentisinin API ayarlarının uyuştuğundan emin olun. Buradan yapacağınız ürün değişiklikleri sunucunuzda anında geçerli olacaktır.
                    </p>
                  </div>
                </div>
              )}

              {/* 2) TAB: PLAYERS LIST */}
              {activeTab === "players-list" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Oyuncu Hesapları Yönetimi</h2>
                      <p className="text-xs text-slate-400 font-medium">Kayıtlı oyuncuların bakiye işlemlerini, şifre sıfırlamalarını ve engellemelerini yönetin.</p>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        placeholder="Oyuncu adı veya IP ara..."
                        value={playerSearchQuery}
                        onChange={e => setPlayerSearchQuery(e.target.value)}
                        className="w-full bg-[#1c2237] border border-[#27355a] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Actions Quick Forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Credit Control form */}
                    <form onSubmit={handleCreditChange} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                        <Coins className="w-4 h-4 text-sky-400" />
                        Kredi Yükle / Düşür
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Kullanıcı Adı</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: Alperen99"
                            value={creditForm.username}
                            onChange={e => setCreditForm({ ...creditForm, username: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">İşlem</label>
                          <select
                            value={creditForm.action}
                            onChange={e => setCreditForm({ ...creditForm, action: e.target.value as "add" | "subtract" })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                          >
                            <option value="add">Kredi Ekle (+)</option>
                            <option value="subtract">Kredi Düşür (-)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Miktar (Kredi)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={creditForm.amount}
                            onChange={e => setCreditForm({ ...creditForm, amount: parseInt(e.target.value) || 0 })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                      >
                        İşlemi Kaydet ve Güncelle
                      </button>
                    </form>

                    {/* Password reset form */}
                    <form onSubmit={handlePasswordReset} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-4 h-4 text-cyan-400" />
                        Şifre Sıfırlama Aracısı
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Kullanıcı Adı</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: CreeperDestroyer"
                            value={passwordForm.username}
                            onChange={e => setPasswordForm({ ...passwordForm, username: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Yeni Güvenli Şifre</label>
                          <input
                            type="text"
                            required
                            minLength={4}
                            placeholder="En az 4 hane girin"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Oyuncu Şifresini Değiştir
                      </button>
                    </form>
                  </div>

                  {/* Players list tables */}
                  <div className="space-y-3 pt-4">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Kayıtlı Oyuncu Verileri</h3>
                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-[#1b3d54] border-[#27355a] bg-[#121829] text-slate-400 text-[10px] font-black uppercase">
                              <th className="p-4">Profil</th>
                              <th className="p-4">Kredi</th>
                              <th className="p-4">Kayıt IP</th>
                              <th className="p-4">Yetki</th>
                              <th className="p-4 text-right">Eylemler</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#27355a]/40 text-slate-300">
                            {filteredUsers.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center italic text-slate-500">Eşleşen hiçbir oyuncu kaydı bulunamadı.</td>
                              </tr>
                            ) : (
                              filteredUsers.map(u => (
                                <tr key={u.username} className="hover:bg-slate-900/35">
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`https://mc-heads.net/avatar/${u.username}/24`}
                                        alt={u.username}
                                        className="w-6 h-6 rounded border border-[#27355a]"
                                      />
                                      <span className="font-extrabold">{u.username}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-sky-400">{u.credits} Kr.</td>
                                  <td className="p-4 text-slate-400 font-mono">{u.ipAddress}</td>
                                  <td className="p-4">
                                    <button
                                      onClick={() => {
                                        setRoleModalTarget(u.username);
                                        setRoleModalOpen(true);
                                      }}
                                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all ${
                                        u.isAdmin
                                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                                          : u.role && u.role !== "Oyuncu"
                                          ? "bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20"
                                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                                      }`}
                                      title="Rol ve İzinleri Düzenle"
                                    >
                                      <Shield className="w-3 h-3 text-sky-400" />
                                      <span>{u.role || (u.isAdmin ? "Yönetici" : "Oyuncu")}</span>
                                    </button>
                                  </td>
                                  <td className="p-4 text-right space-x-1">
                                    <button
                                      onClick={() => {
                                        setRoleModalTarget(u.username);
                                        setRoleModalOpen(true);
                                      }}
                                      className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg cursor-pointer text-[10px] font-bold"
                                      title="Yetkileri Düzenle"
                                    >
                                      Rol & Yetkiler
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCreditForm({ username: u.username, action: "add", amount: 10 });
                                        const el = document.getElementById("admin-content-view");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                      }}
                                      className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/15 rounded-lg cursor-pointer text-[10px] font-bold"
                                      title="Kredi İşlemi"
                                    >
                                      Kredi
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.username)}
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-lg cursor-pointer"
                                      title="Oyuncuyu Sil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3) TAB: BANS LIST (YASAKLI LİSTESİ) */}
              {activeTab === "bans" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Ceza & Yasaklı Oyuncu Yönetimi</h2>
                    <p className="text-xs text-slate-400">Sunucu kurallarını çiğneyen oyuncuları web portalından ve sunucudan uzaklaştırın.</p>
                  </div>

                  {/* Add Ban Form */}
                  <form onSubmit={handleBanUser} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4 max-w-xl">
                    <h3 className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserX className="w-4.5 h-4.5" />
                      YENİ YASAKLAMA GİRİŞİ OLUŞTUR
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase">Yasaklanacak Oyuncu</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: KuralTanımaz"
                          value={banForm.username}
                          onChange={e => setBanForm({ ...banForm, username: e.target.value })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase">Yasaklama Nedeni</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Ağır argo kullanımı"
                          value={banForm.reason}
                          onChange={e => setBanForm({ ...banForm, reason: e.target.value })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl cursor-pointer"
                    >
                      Oyuncuyu Süresiz Yasakla
                    </button>
                  </form>

                  {/* Banned List table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Aktif Yasaklar</h3>
                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-[#1b3d54] border-[#27355a] bg-[#121829] text-slate-400 text-[10px] font-black uppercase">
                              <th className="p-4">Yasaklı Oyuncu</th>
                              <th className="p-4">Yasaklama Gerekçesi</th>
                              <th className="p-4">Uygulayan Admin</th>
                              <th className="p-4">Tarih</th>
                              <th className="p-4 text-right">Eylemler</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#27355a]/40 text-slate-300">
                            {bannedPlayers.map(p => (
                              <tr key={p.username} className="hover:bg-slate-900/35">
                                <td className="p-4">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={`https://mc-heads.net/avatar/${p.username}/24`}
                                      alt={p.username}
                                      className="w-6 h-6 rounded border border-red-500/30 shadow-sm shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="font-extrabold text-red-400">{p.username}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-300 italic">{p.reason}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={`https://mc-heads.net/avatar/${p.admin}/18`}
                                      alt={p.admin}
                                      className="w-4.5 h-4.5 rounded border border-[#27355a] shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-slate-400 font-semibold">{p.admin}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-500">{p.date}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleUnbanUser(p.username)}
                                    className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded-lg cursor-pointer text-[10px] font-bold"
                                  >
                                    Yasağı Kaldır
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4) TAB: CATEGORIES */}
              {activeTab === "categories" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Mağaza Ürün Kategorileri</h2>
                      <p className="text-xs text-slate-400">Ürünlerinizi düzenli bir şekilde gruplamak için kategorileri yönetin.</p>
                    </div>

                    <button
                      onClick={() => setShowCategoryForm(!showCategoryForm)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Kategori Ekle</span>
                    </button>
                  </div>

                  {/* Add category form modal/view */}
                  {showCategoryForm && (
                    <form onSubmit={handleCategorySubmit} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4 max-w-md">
                      <div className="flex justify-between items-center border-[#1b3d54] border-[#27355a]/40 pb-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Yeni Kategori Ekle</h3>
                        <button type="button" onClick={() => setShowCategoryForm(false)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Kategori Adı</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: Rütbeler, Kasalar"
                            value={categoryForm.name}
                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Kategori Temsili Görsel URL (İsteğe Bağlı)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={categoryForm.imageUrl}
                            onChange={e => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCategoryForm(false)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl"
                        >
                          Kategoriyi Kaydet
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Categories listings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(cat => (
                      <div key={cat._id} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={cat.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80"}
                            alt={cat.name}
                            className="w-10 h-10 object-cover rounded-xl border border-[#27355a]"
                          />
                          <span className="font-extrabold text-sm text-white truncate">{cat.name}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl cursor-pointer shrink-0"
                          title="Kategoriyi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5) TAB: PRODUCTS LIST */}
              {activeTab === "products-list" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Mağaza Ürün Kataloğu Yönetimi</h2>
                      <p className="text-xs text-slate-400">Sunucu mağazasındaki tüm eşya, rütbe ve paketlerin fiyatlarını ve verilecek komutlarını belirleyin.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Ürün adı ara..."
                          value={productSearchQuery}
                          onChange={e => setProductSearchQuery(e.target.value)}
                          className="bg-[#1c2237] border border-[#27355a] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ name: "", price: 0, description: "", imageUrl: "", category: categories[0]?.name || "", commandsText: "" });
                          setShowProductForm(!showProductForm);
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ürün Ekle</span>
                      </button>
                    </div>
                  </div>

                  {/* Add / Edit product form */}
                  {showProductForm && (
                    <form onSubmit={handleProductSubmit} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center border-[#1b3d54] border-[#27355a]/40 pb-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          {editingProduct ? `Ürünü Düzenle: ${editingProduct.name}` : "Yeni Ürün Oluştur"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Ürün İsmi</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: VIP Üyelik (30 Gün)"
                            value={productForm.name}
                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Fiyat (Kredi)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="Örn: 25"
                            value={productForm.price}
                            onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Kategori Seçimi</label>
                          <select
                            required
                            value={productForm.category}
                            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                          >
                            <option value="">Seçin...</option>
                            {categories.map(c => (
                              <option key={c._id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Temsili Resim URL</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={productForm.imageUrl}
                            onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Ürün Kısa Açıklaması</label>
                          <input
                            type="text"
                            placeholder="Ürün satın alındığında kazanılacak ayrıcalıklar..."
                            value={productForm.description}
                            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase block">
                            Teslimat Otomasyon Komutları (Her satıra bir komut, başındaki / işaretini koymayın)
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Örn: lp user {player} parent add vip&#10;give {player} diamond 64&#10;broadcast {player} isimli oyuncu VIP satın aldı!"
                            value={productForm.commandsText}
                            onChange={e => setProductForm({ ...productForm, commandsText: e.target.value })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono resize-none leading-relaxed"
                          />
                          <span className="text-[10px] text-slate-500 block">
                            Satın alan oyuncunun isminin yerine geçmesi için <b>{"{player}"}</b> anahtar kelimesini kullanın.
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl"
                        >
                          Ürünü Kataloğa Kaydet
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products Grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-8 text-center col-span-2">Katalogta gösterilecek ürün kaydı bulunmuyor.</p>
                    ) : (
                      filteredProducts.map(p => (
                        <div key={p._id} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-4 flex items-start gap-4 justify-between">
                          <div className="flex gap-3 min-w-0">
                            <img
                              src={p.imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80"}
                              alt={p.name}
                              className="w-14 h-14 object-cover rounded-xl border border-[#27355a] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="bg-[#111625] text-sky-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-sky-500/10">
                                {p.category}
                              </span>
                              <h4 className="font-extrabold text-white text-sm truncate mt-1">{p.name}</h4>
                              <p className="text-[11px] text-sky-400 font-bold mt-0.5">{p.price} Kredi</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-xs mt-1">{p.description}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/15 rounded-xl cursor-pointer"
                              title="Ürünü Düzenle"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl cursor-pointer"
                              title="Ürünü Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 6) TAB: ORDERS HISTORY */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Tüm Sipariş İşlemleri</h2>
                    <p className="text-xs text-slate-400">Minecraft sunucusuna gönderilen otomatik teslimat eklentisi siparişlerinin detayları.</p>
                  </div>

                  <div className="bg-[#171e32] border border-[#27355a] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-[#1b3d54] border-[#27355a] bg-[#121829] text-slate-400 text-[10px] font-black uppercase">
                            <th className="p-4">Alıcı Oyuncu</th>
                            <th className="p-4">Sipariş Edilen Ürün ID</th>
                            <th className="p-4">Fiyat</th>
                            <th className="p-4">Teslim Durumu</th>
                            <th className="p-4">Tarih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27355a]/40 text-slate-300">
                          {purchases.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center italic text-slate-500">Henüz hiçbir alışveriş siparişi gerçekleşmemiş.</td>
                            </tr>
                          ) : (
                            purchases.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/35">
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={`https://mc-heads.net/avatar/${p.username}/20`}
                                      alt={p.username}
                                      className="w-5 h-5 rounded"
                                    />
                                    <span className="font-extrabold">{p.username}</span>
                                  </div>
                                </td>
                                <td className="p-4 font-mono text-slate-400 text-[11px]">{p.productName}</td>
                                <td className="p-4 font-bold text-sky-400">{p.price} Kr.</td>
                                <td className="p-4">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {p.status || "Tamamlandı"}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500 text-[11px]">
                                  {p.createdAt ? new Date(p.createdAt).toLocaleString("tr-TR") : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6.5) TAB: PAYMENT SETTINGS */}
              {activeTab === "payment-settings" && (
                <div className="space-y-8">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-sky-400" /> Ödeme Yöntemleri & Kredi Satış Ayarları
                      </h2>
                      <p className="text-xs text-slate-400">
                        Shopier, PayTR, Banka Havalesi ve Papara ödeme altyapılarını yönetin, kredi kurunu ve indirim paketlerini belirleyin.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePaymentSettings} className="space-y-8">
                    {/* General Rates & Limits */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 text-sky-400">
                        <Coins className="w-4 h-4" /> Kredi & Fiyat Dönüşüm Politikası
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            1 TL Karşılığı Temel Kredi
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            required
                            value={paymentSettings.creditPerTL || 1}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, creditPerTL: parseFloat(e.target.value) || 1 })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                          <p className="text-[10px] text-slate-500">Örn: 1 TL = 1 Kredi</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Minimum Ödeme Tutarı (TL)
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={paymentSettings.minPaymentTL || 10}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, minPaymentTL: parseFloat(e.target.value) || 10 })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Maksimum Tek Seferlik Ödeme (TL)
                          </label>
                          <input
                            type="number"
                            min="10"
                            required
                            value={paymentSettings.maxPaymentTL || 5000}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, maxPaymentTL: parseFloat(e.target.value) || 5000 })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SHOPIER GATEWAY */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27355a]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm">
                            S
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                              Shopier Sanal POS Entegrasyonu
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Kredi Kartı / Banka Kartı ile 3D Secure güvenli tahsilat
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-slate-300 font-bold">Aktif</span>
                            <input
                              type="checkbox"
                              checked={paymentSettings.shopier?.enabled || false}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                shopier: { ...paymentSettings.shopier, enabled: e.target.checked }
                              })}
                              className="w-4 h-4 rounded text-sky-500"
                            />
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-amber-400 font-bold">Test Modu</span>
                            <input
                              type="checkbox"
                              checked={paymentSettings.shopier?.testMode || false}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                shopier: { ...paymentSettings.shopier, testMode: e.target.checked }
                              })}
                              className="w-4 h-4 rounded text-amber-500"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Shopier API Key (İstemci Anahtarı)
                          </label>
                          <input
                            type="text"
                            placeholder="shopier_api_key_..."
                            value={paymentSettings.shopier?.apiKey || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              shopier: { ...paymentSettings.shopier, apiKey: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Shopier API Secret (Gizli Anahtar)
                          </label>
                          <input
                            type="password"
                            placeholder="shopier_secret_..."
                            value={paymentSettings.shopier?.apiSecret || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              shopier: { ...paymentSettings.shopier, apiSecret: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Website Index
                          </label>
                          <input
                            type="text"
                            placeholder="1"
                            value={paymentSettings.shopier?.websiteIndex || "1"}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              shopier: { ...paymentSettings.shopier, websiteIndex: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-[#111625] border border-sky-500/20 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sky-400">Geri Dönüş (Callback / Webhook) URL'si:</span>
                          <span className="font-mono text-slate-400 ml-2">/api/credits/callback/shopier</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Shopier panelinizde geri dönüş URL'sine bu adresi giriniz.</span>
                      </div>
                    </div>

                    {/* PAYTR GATEWAY */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27355a]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">
                            P
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                              PayTR Sanal POS Entegrasyonu
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Tüm yerli banka ve kredi kartlarına taksitli/tek çekim POS
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-slate-300 font-bold">Aktif</span>
                            <input
                              type="checkbox"
                              checked={paymentSettings.paytr?.enabled || false}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                paytr: { ...paymentSettings.paytr, enabled: e.target.checked }
                              })}
                              className="w-4 h-4 rounded text-sky-500"
                            />
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs text-amber-400 font-bold">Test Modu</span>
                            <input
                              type="checkbox"
                              checked={paymentSettings.paytr?.testMode || false}
                              onChange={(e) => setPaymentSettings({
                                ...paymentSettings,
                                paytr: { ...paymentSettings.paytr, testMode: e.target.checked }
                              })}
                              className="w-4 h-4 rounded text-amber-500"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Merchant ID (Mağaza No)
                          </label>
                          <input
                            type="text"
                            placeholder="PayTR Mağaza ID"
                            value={paymentSettings.paytr?.merchantId || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              paytr: { ...paymentSettings.paytr, merchantId: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Merchant Key (Mağaza Parolası)
                          </label>
                          <input
                            type="password"
                            placeholder="PayTR Merchant Key"
                            value={paymentSettings.paytr?.merchantKey || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              paytr: { ...paymentSettings.paytr, merchantKey: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Merchant Salt (Gizli Anahtar)
                          </label>
                          <input
                            type="password"
                            placeholder="PayTR Merchant Salt"
                            value={paymentSettings.paytr?.merchantSalt || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              paytr: { ...paymentSettings.paytr, merchantSalt: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* HAVALE / FAST / PAPARA */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27355a]/60 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                              Havale, EFT, FAST ve Papara
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Oyuncuların banka hesaplarınıza para transferi yapıp onay talep edebileceği yöntem
                            </p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs text-slate-300 font-bold">Havale/Papara Açık</span>
                          <input
                            type="checkbox"
                            checked={paymentSettings.havale?.enabled || false}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              havale: { ...paymentSettings.havale, enabled: e.target.checked }
                            })}
                            className="w-4 h-4 rounded text-emerald-500"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Banka Adı / Şube
                          </label>
                          <input
                            type="text"
                            placeholder="Ziraat Bankası / Enpara / Garanti BBVA"
                            value={paymentSettings.havale?.bankName || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              havale: { ...paymentSettings.havale, bankName: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Hesap Sahibi (Ad Soyad)
                          </label>
                          <input
                            type="text"
                            placeholder="Ahmet Yılmaz"
                            value={paymentSettings.havale?.accountHolder || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              havale: { ...paymentSettings.havale, accountHolder: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            IBAN Numarası
                          </label>
                          <input
                            type="text"
                            placeholder="TR12 3456 7890 1234 5678 9012 34"
                            value={paymentSettings.havale?.iban || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              havale: { ...paymentSettings.havale, iban: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Papara Numara / Mail (İsteğe Bağlı)
                          </label>
                          <input
                            type="text"
                            placeholder="1234567890 veya papara@zefircraft.com"
                            value={paymentSettings.havale?.paparaNumber || ""}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              havale: { ...paymentSettings.havale, paparaNumber: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Oyuncuya Gösterilecek Havale Talimatı / Açıklama Notu
                        </label>
                        <textarea
                          rows={2}
                          value={paymentSettings.havale?.instructions || ""}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            havale: { ...paymentSettings.havale, instructions: e.target.value }
                          })}
                          placeholder="Açıklama alanına SADECE kullanıcı adınızı veya Sipariş Kodunuzu yazınız..."
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* GATEWAY 4: VISA KART / DOĞRUDAN KART TRANSFERİ */}
                    <div className="bg-[#171e32] border border-blue-500/30 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#27355a]/60 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 text-blue-400">
                            <CreditCard className="w-4 h-4" /> Doğrudan Visa Kart Numarasına Transfer (Azerbaycan & Uluslararası)
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Oyuncuların doğrudan 16 haneli kart numaranıza (Birbank, m10, Leobank veya Paysend/KoronaPay ile) para göndermesi
                          </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                          <span>Aktif:</span>
                          <input
                            type="checkbox"
                            checked={paymentSettings.visaCard?.enabled ?? true}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              visaCard: { ...(paymentSettings.visaCard || {}), enabled: e.target.checked }
                            })}
                            className="w-4 h-4 rounded text-blue-500"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Visa Kart Numarası (16 Hane)
                          </label>
                          <input
                            type="text"
                            placeholder="4098 5844 6336 1459"
                            value={paymentSettings.visaCard?.cardNumber || "4098 5844 6336 1459"}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              visaCard: { ...(paymentSettings.visaCard || {}), cardNumber: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-blue-500/30 rounded-xl p-3 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Kart Sahibi (Ad Soyad)
                          </label>
                          <input
                            type="text"
                            placeholder="Sunay Seyidli"
                            value={paymentSettings.visaCard?.cardHolder || "Sunay Seyidli"}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              visaCard: { ...(paymentSettings.visaCard || {}), cardHolder: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Banka Adı / Tipi
                          </label>
                          <input
                            type="text"
                            placeholder="Kapital Bank / Birbank (Azərbaycan)"
                            value={paymentSettings.visaCard?.bankName || "Kapital Bank / Birbank (Azərbaycan)"}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              visaCard: { ...(paymentSettings.visaCard || {}), bankName: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Kart Para Birimi
                          </label>
                          <input
                            type="text"
                            placeholder="AZN (Manat)"
                            value={paymentSettings.visaCard?.currency || "AZN"}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              visaCard: { ...(paymentSettings.visaCard || {}), currency: e.target.value }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Manat / TL Dönüşüm Oranı (1 AZN = ? TL)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="20"
                            value={paymentSettings.visaCard?.aznRate || 20}
                            onChange={(e) => setPaymentSettings({
                              ...paymentSettings,
                              visaCard: { ...(paymentSettings.visaCard || {}), aznRate: parseFloat(e.target.value) || 20 }
                            })}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Kart Transfer Talimatları & Açıklama
                        </label>
                        <textarea
                          rows={2}
                          value={paymentSettings.visaCard?.instructions || ""}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            visaCard: { ...(paymentSettings.visaCard || {}), instructions: e.target.value }
                          })}
                          placeholder="Birbank, m10, Leobank veya Paysend ile bu 16 haneli karta doğrudan gönderim yapabilirsiniz..."
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    {/* CREDIT PACKAGES */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#27355a]/60 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 text-amber-400">
                            <Sparkles className="w-4 h-4" /> Kredi Satış Paketleri (Bonuslu)
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Oyuncuların tek tıkla seçebileceği hazır kredi ve bonus paketleri
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddPackage(!showAddPackage)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Yeni Paket Ekle</span>
                        </button>
                      </div>

                      {showAddPackage && (
                        <div className="p-4 bg-[#111625] border border-amber-500/30 rounded-2xl space-y-3">
                          <h4 className="text-xs font-black text-amber-400 uppercase">Yeni Kredi Paketi</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Tutar (TL)</label>
                              <input
                                type="number"
                                min="1"
                                value={newPackage.amountTL}
                                onChange={(e) => setNewPackage({ ...newPackage, amountTL: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-[#171e32] border border-[#27355a] rounded-xl p-2 text-xs text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Verilecek Kredi</label>
                              <input
                                type="number"
                                min="1"
                                value={newPackage.credits}
                                onChange={(e) => setNewPackage({ ...newPackage, credits: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#171e32] border border-[#27355a] rounded-xl p-2 text-xs text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Bonus Kredi (Dahil)</label>
                              <input
                                type="number"
                                min="0"
                                value={newPackage.bonus}
                                onChange={(e) => setNewPackage({ ...newPackage, bonus: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#171e32] border border-[#27355a] rounded-xl p-2 text-xs text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">Rozet / Etiket</label>
                              <input
                                type="text"
                                placeholder="Örn: %15 Bonus"
                                value={newPackage.badge}
                                onChange={(e) => setNewPackage({ ...newPackage, badge: e.target.value })}
                                className="w-full bg-[#171e32] border border-[#27355a] rounded-xl p-2 text-xs text-white"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={newPackage.isPopular}
                                onChange={(e) => setNewPackage({ ...newPackage, isPopular: e.target.checked })}
                                className="w-4 h-4 rounded text-amber-500"
                              />
                              <span>Popüler / Çok Satan Rozeti Ekle</span>
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setShowAddPackage(false)}
                                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl"
                              >
                                Vazgeç
                              </button>
                              <button
                                type="button"
                                onClick={handleAddPaymentPackage}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                              >
                                Paketi Kaydet
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {paymentSettings.packages?.map((pkg: any) => (
                          <div
                            key={pkg.id}
                            className="bg-[#111625] border border-[#27355a] rounded-2xl p-3.5 relative flex flex-col justify-between"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentPackage(pkg.id)}
                              className="absolute top-2.5 right-2.5 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
                              title="Paketi Kaldır"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base font-black text-white">{pkg.amountTL} ₺</span>
                                {pkg.badge && (
                                  <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-black rounded">
                                    {pkg.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-sky-400">{pkg.credits} Kredi</div>
                              {pkg.bonus > 0 && (
                                <div className="text-[10px] text-emerald-400">+{pkg.bonus} Bonus Kredi</div>
                              )}
                            </div>
                            {pkg.isPopular && (
                              <div className="mt-2 text-[9px] font-black text-amber-400 uppercase tracking-wider">
                                ★ Çok Satan
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={paymentSaving}
                        className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-sky-950/50 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {paymentSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Ödeme Ayarlarını Kaydet</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 6.6) TAB: PAYMENT ORDERS & APPROVAL */}
              {activeTab === "payment-orders" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-400" /> Kredi Siparişleri & Ödeme Onay Masası
                      </h2>
                      <p className="text-xs text-slate-400">
                        Kredi kartı, Shopier, PayTR veya Banka Havalesi ile oluşturulan gerçek para siparişlerini inceleyin ve havaleleri onaylayın.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Oyuncu veya Sipariş No..."
                          value={paymentSearchQuery}
                          onChange={(e) => setPaymentSearchQuery(e.target.value)}
                          className="bg-[#171e32] border border-[#27355a] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-2">
                    {(["all", "pending", "completed", "cancelled"] as const).map((filter) => {
                      const count = paymentOrders.filter((o) => filter === "all" || o.status === filter).length;
                      const labels = {
                        all: "Tümü",
                        pending: "Bekleyen Havale/Ödeme",
                        completed: "Tamamlananlar",
                        cancelled: "İptal Edilenler"
                      };
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setPaymentOrderFilter(filter)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            paymentOrderFilter === filter
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                              : "bg-[#171e32] text-slate-400 border border-transparent hover:text-white"
                          }`}
                        >
                          {labels[filter]} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Orders Table */}
                  <div className="bg-[#171e32] border border-[#27355a] rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#27355a] bg-[#121829] text-slate-400 text-[10px] font-black uppercase">
                            <th className="p-4">Sipariş Kodu</th>
                            <th className="p-4">Oyuncu</th>
                            <th className="p-4">Yöntem</th>
                            <th className="p-4">Tutar (TL)</th>
                            <th className="p-4">Verilecek Kredi</th>
                            <th className="p-4">Tarih</th>
                            <th className="p-4">Durum</th>
                            <th className="p-4 text-right">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27355a]/40 text-slate-300">
                          {paymentOrders
                            .filter((o) => paymentOrderFilter === "all" || o.status === paymentOrderFilter)
                            .filter((o) =>
                              !paymentSearchQuery ||
                              o.orderId?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                              o.username?.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                            ).length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center italic text-slate-500">
                                Bu filtreye uygun ödeme siparişi kaydı bulunamadı.
                              </td>
                            </tr>
                          ) : (
                            paymentOrders
                              .filter((o) => paymentOrderFilter === "all" || o.status === paymentOrderFilter)
                              .filter((o) =>
                                !paymentSearchQuery ||
                                o.orderId?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                                o.username?.toLowerCase().includes(paymentSearchQuery.toLowerCase())
                              )
                              .map((order) => (
                                <tr key={order.orderId} className="hover:bg-slate-900/35 transition-colors">
                                  <td className="p-4 font-mono font-bold text-sky-400 text-[11px]">
                                    {order.orderId}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`https://mc-heads.net/avatar/${order.username}/24`}
                                        alt={order.username}
                                        className="w-5 h-5 rounded"
                                      />
                                      <span className="font-extrabold text-white">{order.username}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 uppercase font-bold text-[10px] text-slate-300">
                                    <span className="px-2 py-0.5 bg-[#111625] border border-sky-500/20 rounded">
                                      {order.method}
                                    </span>
                                  </td>
                                  <td className="p-4 font-black text-white">{order.amountTL} ₺</td>
                                  <td className="p-4 font-black text-amber-400">
                                    {order.credits} Kredi
                                    {order.bonusCredits ? (
                                      <span className="text-[10px] text-emerald-400 block">+{order.bonusCredits} Bonus</span>
                                    ) : null}
                                  </td>
                                  <td className="p-4 text-slate-500 text-[11px]">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleString("tr-TR") : "-"}
                                  </td>
                                  <td className="p-4">
                                    {order.status === "completed" && (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                                        <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                                      </span>
                                    )}
                                    {order.status === "pending" && (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                                        <Clock className="w-3 h-3 animate-spin" /> Bekliyor
                                      </span>
                                    )}
                                    {order.status === "cancelled" && (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
                                        <XCircle className="w-3 h-3" /> İptal Edildi
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    {order.status === "pending" ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleApprovePaymentOrder(order.orderId)}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                                          title="Havale Ödemesini Onayla ve Krediyi Yükle"
                                        >
                                          <Check className="w-3 h-3" /> Onayla
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectPaymentOrder(order.orderId)}
                                          className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                                          title="Siparişi İptal Et / Reddet"
                                        >
                                          <X className="w-3 h-3" /> Reddet
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 italic">
                                        {order.adminNote || "-"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "wheel-settings" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Şans Çarkı (Lucky Wheel) Ayarları</h2>
                    <p className="text-xs text-slate-400">Çarkıfelek oyununu tamamen açıp kapatın veya ödül çarpanlarını ve çevirme koşullarını yapılandırın.</p>
                  </div>

                  <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-5 max-w-xl">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-sky-400" />
                      Çark Durumu & Çevrim Dinamikleri
                    </h3>

                    {/* Wheel Enabled Toggle Switch */}
                    <div className="flex items-center justify-between p-3.5 bg-[#111625] border border-[#27355a] rounded-xl">
                      <div>
                        <span className="text-xs font-black text-white block">Şans Çarkı Durumu</span>
                        <span className="text-[10px] text-slate-400 block">
                          {wheelEnabled ? "Çark tüm menülerde görünür ve aktiftir." : "Çark tamamen kapalıdır (Menülerden ve anasayfadan gizlenir)."}
                        </span>
                      </div>
                      <button
                        onClick={() => setWheelEnabled(!wheelEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          wheelEnabled ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            wheelEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase">Giriş/Çevirme Ücreti (Kredi - 0=Bedava Günlük)</label>
                        <input
                          type="number"
                          value={wheelPrice}
                          onChange={e => setWheelPrice(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase">Ödül Değeri Çarpanı</label>
                        <select
                          value={wheelMultiplier}
                          onChange={e => setWheelMultiplier(parseFloat(e.target.value) || 1)}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        >
                          <option value="1">Standart x1 Ödül Oranı</option>
                          <option value="1.5">Etkinlik Modu x1.5 Ödül Oranı</option>
                          <option value="2">Yılbaşı Özel x2 Çift Ödül Oranı!</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
                          const res = await fetch("/api/admin/wheel/settings", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              enabled: wheelEnabled,
                              price: wheelPrice,
                              multiplier: wheelMultiplier
                            })
                          });
                          if (res.ok) {
                            triggerNotification(`Şans Çarkı ayarları başarıyla kaydedildi! (${wheelEnabled ? 'AÇIK' : 'KAPALI'})`);
                          } else {
                            triggerNotification("Ayarlar kaydedilirken hata oluştu.");
                          }
                        } catch (err) {
                          triggerNotification("Bağlantı hatası oluştu.");
                        }
                      }}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl cursor-pointer transition-colors shadow-lg"
                    >
                      Ayarları Güncelle
                    </button>
                  </div>

                  {/* Wheel Rewards Mock Display */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Aktif Çark Dilimleri & Kazanç Oranları</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {[2, 5, 10, 20, 50, 100].map(val => (
                        <div key={val} className="bg-[#171e32] border border-[#27355a] p-3.5 rounded-xl flex flex-col justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-400">Dilim Ödülü</span>
                          <span className="font-extrabold text-sm text-sky-400">
                            {val * wheelMultiplier} Kredi {wheelMultiplier > 1 && <span className="text-[10px] text-emerald-400">({val} x{wheelMultiplier})</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 8) TAB: WHEEL LOGS */}
              {activeTab === "wheel-logs" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Şans Çarkı Kazanım Günlüğü</h2>
                    <p className="text-xs text-slate-400">Oyuncuların şans çarkını çevirerek kazandığı ödüllerin gerçek zamanlı kayıt defteri.</p>
                  </div>

                  <div className="bg-[#171e32] border border-[#27355a] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-[#1b3d54] border-[#27355a] bg-[#121829] text-slate-400 text-[10px] font-black uppercase">
                            <th className="p-4">Oyuncu Hesabı</th>
                            <th className="p-4">Kazanılan Dilim Ödülü</th>
                            <th className="p-4">Çevrim Tarihi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27355a]/40 text-slate-300">
                          {wheelLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-900/35">
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`https://mc-heads.net/avatar/${log.username}/18`}
                                    alt={log.username}
                                    className="w-4.5 h-4.5 rounded"
                                  />
                                  <span className="font-extrabold">{log.username}</span>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-emerald-400">{log.reward}</td>
                              <td className="p-4 text-slate-500">{log.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 8.5) TAB: QUIZ & KREDİ KAZAN YÖNETİMİ */}
              {activeTab === "quiz-settings" && (
                <div className="space-y-8">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-amber-400" /> Kredi Kazan, Anket Soruları & AdSense Ayarları
                      </h2>
                      <p className="text-xs text-slate-400">Minecraft anket sorularını yönetin, yeni anket görevleri ekleyin ve AdSense/uyarı bannerlarını ayarlayın.</p>
                    </div>
                  </div>

                  {/* 1. GENERAL QUIZ & ADSENSE SETTINGS FORM */}
                  <form onSubmit={handleSaveQuizSettings} className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-5">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Anket & Reklam Genel Ayarları
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Kredi Kazan Sayfası Kocaman Reklam / Duyuru Metni
                        </label>
                        <textarea
                          rows={3}
                          value={adminQuizSettings.bannerNotice}
                          onChange={e => setAdminQuizSettings({ ...adminQuizSettings, bannerNotice: e.target.value })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                          placeholder="Size ücretsiz kredi verebilmek ve sunucu giderlerimizi karşılayabilmek için..."
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Google AdSense Reklam Kodu (İsteğe Bağlı Script veya HTML)
                        </label>
                        <textarea
                          rows={2}
                          value={adminQuizSettings.adsenseCode}
                          onChange={e => setAdminQuizSettings({ ...adminQuizSettings, adsenseCode: e.target.value })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                          placeholder="<script async src='https://pagead2.googlesyndication.com...'></script>"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Tur Başına Soru Sayısı
                        </label>
                        <input
                          type="number"
                          value={adminQuizSettings.quizQuestionsPerRound}
                          onChange={e => setAdminQuizSettings({ ...adminQuizSettings, quizQuestionsPerRound: parseInt(e.target.value) || 10 })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Soru Başına Süre (Saniye)
                        </label>
                        <input
                          type="number"
                          value={adminQuizSettings.secondsPerQuestion}
                          onChange={e => setAdminQuizSettings({ ...adminQuizSettings, secondsPerQuestion: parseInt(e.target.value) || 30 })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Anket Başına Kazanılan Kredi
                        </label>
                        <input
                          type="number"
                          value={adminQuizSettings.creditsPerQuiz}
                          onChange={e => setAdminQuizSettings({ ...adminQuizSettings, creditsPerQuiz: parseInt(e.target.value) || 1 })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                          Kazanmak İçin Gereken En Az Doğru Soru Sayısı
                        </label>
                        <input
                          type="number"
                          value={adminQuizSettings.minCorrectToWin}
                          onChange={e => setAdminQuizSettings({ ...adminQuizSettings, minCorrectToWin: parseInt(e.target.value) || 7 })}
                          className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      Ayarları Kaydet
                    </button>
                  </form>

                  {/* 2. QUIZ QUESTIONS MANAGEMENT */}
                  <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#27355a]/50 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-sky-400" /> Minecraft Soru Havuzu ({adminQuizQuestions.length} Soru)
                        </h3>
                        <p className="text-xs text-slate-400">Ankete giren oyunculara bu havuzdan rastgele sorular seçilir.</p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingQuestionId(null);
                          setQuestionForm({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctIndex: 0 });
                          setShowQuestionModal(true);
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Yeni Soru Ekle
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {adminQuizQuestions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 text-center">Henüz havuzda soru bulunmuyor.</p>
                      ) : (
                        adminQuizQuestions.map((q, idx) => (
                          <div key={q.id} className="bg-[#111625] border border-[#27355a]/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-2 max-w-2xl">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <h4 className="text-sm font-extrabold text-white">{q.question}</h4>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {q.options.map((opt: string, oIdx: number) => {
                                  const isCorrect = q.correctIndex === oIdx;
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                                        isCorrect
                                          ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold"
                                          : "bg-[#182138] border-[#2d3e66] text-slate-300"
                                      }`}
                                    >
                                      <span className="font-black opacity-60">
                                        {["A", "B", "C", "D"][oIdx]}:
                                      </span>
                                      <span className="truncate">{opt}</span>
                                      {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.id);
                                  setQuestionForm({
                                    question: q.question,
                                    optionA: q.options[0] || "",
                                    optionB: q.options[1] || "",
                                    optionC: q.options[2] || "",
                                    optionD: q.options[3] || "",
                                    correctIndex: q.correctIndex || 0
                                  });
                                  setShowQuestionModal(true);
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuizQuestion(q.id)}
                                className="p-2 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 3. QUIZ QUESTS MANAGEMENT */}
                  <div className="bg-[#171e32] border border-[#27355a] rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#27355a]/50 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-400" /> Anket Görevleri
                        </h3>
                        <p className="text-xs text-slate-400">Oyuncuların çözdüğü anket sayısına göre toplu ekstra kredi kazandığı görevler.</p>
                      </div>

                      <button
                        onClick={() => {
                          setQuestForm({ title: "", description: "", targetCount: 3, rewardCredits: 5 });
                          setShowQuestModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Yeni Görev Ekle
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adminQuizQuests.map(quest => (
                        <div key={quest.id} className="bg-[#111625] border border-[#27355a]/50 p-4 rounded-2xl space-y-2 flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{quest.title}</h4>
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black rounded-lg">
                                +{quest.rewardCredits} Kredi
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{quest.description}</p>
                            <span className="text-[10px] font-bold text-sky-400 block pt-1">
                              Hedef: {quest.targetCount} Anket Çözme
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteQuizQuest(quest.id)}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: QUESTION CREATE/EDIT */}
              <AnimatePresence>
                {showQuestionModal && (
                  <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#111625] border border-[#27355a] rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-base font-black text-white">
                          {editingQuestionId ? "Soruyu Düzenle" : "Yeni Anket Sorusu Ekle"}
                        </h3>
                        <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuizQuestion} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Soru Cümlesi</label>
                          <textarea
                            rows={2}
                            required
                            value={questionForm.question}
                            onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                            className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-3 text-xs text-white"
                            placeholder="Örn: Minecraft'ta Ejderhayı öldürünce ne düşer?"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">A Seçeneği</label>
                            <input
                              type="text"
                              required
                              value={questionForm.optionA}
                              onChange={e => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                              className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">B Seçeneği</label>
                            <input
                              type="text"
                              required
                              value={questionForm.optionB}
                              onChange={e => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                              className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">C Seçeneği</label>
                            <input
                              type="text"
                              required
                              value={questionForm.optionC}
                              onChange={e => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                              className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">D Seçeneği</label>
                            <input
                              type="text"
                              required
                              value={questionForm.optionD}
                              onChange={e => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                              className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-amber-400 uppercase">Doğru Şık Hangisi?</label>
                          <select
                            value={questionForm.correctIndex}
                            onChange={e => setQuestionForm({ ...questionForm, correctIndex: Number(e.target.value) })}
                            className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white font-bold"
                          >
                            <option value={0}>A Şıkkı ({questionForm.optionA || "Seçenek 1"})</option>
                            <option value={1}>B Şıkkı ({questionForm.optionB || "Seçenek 2"})</option>
                            <option value={2}>C Şıkkı ({questionForm.optionC || "Seçenek 3"})</option>
                            <option value={3}>D Şıkkı ({questionForm.optionD || "Seçenek 4"})</option>
                          </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowQuestionModal(false)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl"
                          >
                            Kaydet
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* MODAL: QUEST CREATE */}
              <AnimatePresence>
                {showQuestModal && (
                  <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#111625] border border-[#27355a] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-base font-black text-white">Yeni Anket Görevi Ekle</h3>
                        <button onClick={() => setShowQuestModal(false)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuizQuest} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Görev Başlığı</label>
                          <input
                            type="text"
                            required
                            value={questForm.title}
                            onChange={e => setQuestForm({ ...questForm, title: e.target.value })}
                            className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            placeholder="Örn: 3 Anket Çöz"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Açıklama</label>
                          <input
                            type="text"
                            value={questForm.description}
                            onChange={e => setQuestForm({ ...questForm, description: e.target.value })}
                            className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            placeholder="Örn: Toplamda 3 başarılı anket tamamla"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Hedef Anket Sayısı</label>
                            <input
                              type="number"
                              required
                              value={questForm.targetCount}
                              onChange={e => setQuestForm({ ...questForm, targetCount: Number(e.target.value) })}
                              className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Kredi Ödülü</label>
                            <input
                              type="number"
                              required
                              value={questForm.rewardCredits}
                              onChange={e => setQuestForm({ ...questForm, rewardCredits: Number(e.target.value) })}
                              className="w-full bg-[#182138] border border-[#2d3e66] rounded-xl p-2.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowQuestModal(false)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl"
                          >
                            Görevi Oluştur
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* 9) TAB: NEWS MANAGEMENT */}
              {activeTab === "news" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Haber & Duyuru Yönetimi</h2>
                      <p className="text-xs text-slate-400">Web sitesi ana sayfasındaki duyuru panosuna yeni haberler ekleyin veya kaldırın.</p>
                    </div>

                    <button
                      onClick={() => setShowNewsForm(!showNewsForm)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Duyuru Yayınla</span>
                    </button>
                  </div>

                  {/* Add News Form */}
                  {showNewsForm && (
                    <form onSubmit={handleNewsSubmit} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-[#1b3d54] border-[#27355a]/40 pb-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Yeni Duyuru Yayınla</h3>
                        <button type="button" onClick={() => setShowNewsForm(false)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Duyuru Başlığı</label>
                          <input
                            type="text"
                            required
                            value={newsForm.title}
                            onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                            placeholder="Örn: Ramazan Ayına Özel %40 İndirim!"
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Kapak Görsel Bağlantısı (URL)</label>
                          <input
                            type="text"
                            value={newsForm.imageUrl}
                            onChange={e => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Haber İçeriği</label>
                          <textarea
                            rows={5}
                            required
                            value={newsForm.content}
                            onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                            placeholder="Lütfen duyuru detaylarını buraya yazın..."
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white resize-none leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowNewsForm(false)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl"
                        >
                          Yayınla
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Listings */}
                  <div className="space-y-3">
                    {articles.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-8 text-center">Yayınlanmış hiçbir duyuru bulunmuyor.</p>
                    ) : (
                      articles.map(art => (
                        <div key={art._id} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              className="w-12 h-12 object-cover rounded-xl border border-[#27355a] shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-white text-sm truncate">{art.title}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xl mt-0.5">{art.content}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleNewsDelete(art._id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl cursor-pointer shrink-0"
                            title="Duyuruyu Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 10) TAB: STAFF APPLICATIONS */}
              {activeTab === "apps" && (
                <div className="space-y-6">
                  <div className="border-b border-[#1e293b] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Yetkili Başvuruları Yönetim Masası</h2>
                      <p className="text-xs text-slate-400">Sunucu kadrosuna katılmak isteyen adayların mülakat formlarını inceleyin ve onaylayarak yetkilendirin.</p>
                    </div>
                    <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20 self-start sm:self-auto">
                      Toplam {applications.length} Başvuru Kaydı
                    </span>
                  </div>

                  {applications.length === 0 ? (
                    <div className="bg-[#171e32]/60 border border-[#27355a] rounded-2xl p-12 text-center space-y-3">
                      <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">İncelenecek henüz bir yetkili başvuru kaydı bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {applications.map(app => (
                        <div key={app._id} className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 md:p-6 space-y-5 shadow-lg">
                          
                          {/* Application Header details */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27355a]/60 pb-4">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={`https://mc-heads.net/avatar/${app.username}/48`}
                                alt={app.username}
                                className="w-12 h-12 rounded-xl border-2 border-sky-500/30 shadow-md shrink-0 bg-[#0c101e]"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-white text-base tracking-tight">{app.username}</h4>
                                  <span className="px-2.5 py-0.5 bg-sky-500/20 border border-sky-500/40 text-sky-300 font-extrabold text-[10px] rounded-md uppercase">
                                    {app.position || "Moderatör"} Adayı
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span><b>Adı:</b> {app.realName}</span>
                                  <span>•</span>
                                  <span><b>Yaş:</b> {app.age}</span>
                                  <span>•</span>
                                  <span><b>Discord:</b> <code className="text-sky-300">{app.discord}</code></span>
                                  <span>•</span>
                                  <span className="text-slate-500">{new Date(app.createdAt).toLocaleDateString("tr-TR")}</span>
                                </p>
                              </div>
                            </div>

                            <div>
                              <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                app.status === "pending"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                                  : app.status === "accepted"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}>
                                {app.status === "pending" ? "⏳ İnceleme Bekliyor" : app.status === "accepted" ? "✓ Onaylandı & Yetkilendirildi" : "✕ Reddedildi"}
                              </span>
                            </div>
                          </div>

                          {/* Quick Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-[#111625] p-3 rounded-xl border border-[#27355a]/40 flex items-center justify-between">
                              <span className="text-slate-400 font-bold">⏱️ Aktiflik Süresi:</span>
                              <span className="text-sky-300 font-semibold">{app.activeHours || "Belirtilmedi"}</span>
                            </div>
                            <div className="bg-[#111625] p-3 rounded-xl border border-[#27355a]/40 flex items-center justify-between">
                              <span className="text-slate-400 font-bold">🎙️ Mikrofon Status:</span>
                              <span className="text-emerald-300 font-semibold truncate max-w-[200px]" title={app.microphone}>{app.microphone || "Mevcut"}</span>
                            </div>
                          </div>

                          {/* Extended Questionnaire Answers */}
                          <div className="space-y-3 text-xs">
                            <div className="space-y-1 bg-[#111625] p-3.5 rounded-xl border border-[#27355a]/30">
                              <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span>1. Geçmiş Yetkililik Deneyimleri</span>
                              </div>
                              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{app.experience}</p>
                            </div>

                            <div className="space-y-1 bg-[#111625] p-3.5 rounded-xl border border-[#27355a]/30">
                              <div className="text-[10px] font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span>2. Neden ZefirCraft & Motivasyon</span>
                              </div>
                              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{app.reason}</p>
                            </div>

                            {app.scenario && (
                              <div className="space-y-1 bg-[#111625] p-3.5 rounded-xl border border-[#27355a]/30">
                                <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>3. Kriz & Senaryo Yönetimi Yaklaşımı</span>
                                </div>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-line">{app.scenario}</p>
                              </div>
                            )}
                          </div>

                          {/* Application Actions */}
                          {app.status === "pending" && (
                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-[#27355a]/40">
                              <button
                                onClick={() => handleApplicationProcess(app._id, "rejected")}
                                className="px-5 py-2.5 bg-red-600/80 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-red-400/20"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Başvuruyu Reddet</span>
                              </button>
                              <button
                                onClick={() => handleApplicationProcess(app._id, "accepted")}
                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40 border border-emerald-400/20"
                              >
                                <Check className="w-4 h-4" />
                                <span>Kabul Et ve [{app.position || "Moderatör"}] Yetkisi Ver</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 11) TAB: WEB CONSOLE COMMAND RUNNER */}
              {activeTab === "console" && (
                <div className="space-y-4">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Canlı Sunucu Entegrasyon Web Konsolu</h2>
                    <p className="text-xs text-slate-400">Minecraft sunucusuna doğrudan konsol komutları göndererek oyun içi otomasyon sağlayın.</p>
                  </div>

                  <div className="bg-[#05070e] border border-[#27355a] rounded-2xl p-5 font-mono text-xs leading-relaxed text-slate-300 shadow-inner">
                    <div className="h-64 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                      {terminalLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={
                            log.type === "input"
                              ? "text-slate-300 font-extrabold"
                              : log.type === "success"
                              ? "text-emerald-400 font-semibold"
                              : log.type === "error"
                              ? "text-red-400 font-bold"
                              : "text-slate-500"
                          }
                        >
                          {log.text}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={executeTerminalCommand} className="flex gap-2 border-t border-[#27355a]/50 pt-3 mt-3">
                      <span className="text-sky-500 font-black self-center select-none">{">"}</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        placeholder="Komut yazın (örn: op nick) VEYA direkt duyuru mesajı yazın (örn: Sunucu aktif!)..."
                        className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-700 font-mono text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] rounded-lg tracking-wider uppercase flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3 h-3 text-sky-400 animate-pulse" />
                        <span>{terminalInput.trim() ? (
                          (() => {
                            const raw = terminalInput.trim();
                            const words = raw.split(/\s+/);
                            const first = words[0].toLowerCase();
                            const cleanFirst = first.startsWith("/") ? first.substring(1) : first;
                            const known = new Set([
                              "help", "?", "op", "deop", "stop", "reload", "rl", "restart", "kick", "ban", "pardon", "tempban", "unban",
                              "mute", "tempmute", "unmute", "warn", "list", "online", "whitelist", "save-all", "save-off", "save-on",
                              "say", "tell", "msg", "w", "r", "tellraw", "execute", "gamemode", "gm", "difficulty", "time", "weather",
                              "gamerule", "give", "tp", "teleport", "spawnpoint", "setworldspawn", "effect", "enchant", "clear", "xp",
                              "experience", "summon", "kill", "locate", "scoreboard", "team", "bossbar", "data", "attribute", "clone",
                              "fill", "setblock", "structure", "function", "recipe", "tag", "teammsg", "tm", "trigger", "worldborder",
                              "plugins", "pl", "version", "ver", "co", "coreprotect", "worldedit", "we", "wg", "worldguard", "vault",
                              "eco", "economy", "pay", "bal", "balance", "lp", "luckperms", "ess", "essentials", "cmi", "authme",
                              "skinsrestorer", "mcdelivery", "broadcast", "bc", "alert"
                            ]);
                            return raw.startsWith("/") || known.has(cleanFirst) ? "Komut Çalıştır" : "Duyuru Gönder";
                          })()
                        ) : "Gönder"}</span>
                      </button>
                    </form>

                    {/* Dynamic feedback indicator */}
                    {terminalInput.trim() && (
                      <div className="text-[10px] mt-2 px-1 flex items-center gap-1.5 transition-all">
                        {(() => {
                          const raw = terminalInput.trim();
                          const words = raw.split(/\s+/);
                          const first = words[0].toLowerCase();
                          const cleanFirst = first.startsWith("/") ? first.substring(1) : first;
                          const known = new Set([
                            "help", "?", "op", "deop", "stop", "reload", "rl", "restart", "kick", "ban", "pardon", "tempban", "unban",
                            "mute", "tempmute", "unmute", "warn", "list", "online", "whitelist", "save-all", "save-off", "save-on",
                            "say", "tell", "msg", "w", "r", "tellraw", "execute", "gamemode", "gm", "difficulty", "time", "weather",
                            "gamerule", "give", "tp", "teleport", "spawnpoint", "setworldspawn", "effect", "enchant", "clear", "xp",
                            "experience", "summon", "kill", "locate", "scoreboard", "team", "bossbar", "data", "attribute", "clone",
                            "fill", "setblock", "structure", "function", "recipe", "tag", "teammsg", "tm", "trigger", "worldborder",
                            "plugins", "pl", "version", "ver", "co", "coreprotect", "worldedit", "we", "wg", "worldguard", "vault",
                            "eco", "economy", "pay", "bal", "balance", "lp", "luckperms", "ess", "essentials", "cmi", "authme",
                            "skinsrestorer", "mcdelivery", "broadcast", "bc", "alert"
                          ]);
                          const isCommand = raw.startsWith("/") || known.has(cleanFirst);
                          return isCommand ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              <span className="text-cyan-400/90 font-bold">✨ Saptanan: Komut (Konsoldan sistem komutu olarak çalıştırılacak)</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                              <span className="text-sky-300 font-bold">💬 Saptanan: Sohbet Mesajı (Tüm oyunculara <b className="text-sky-400">[Zefir Craft]</b> etiketiyle duyurulacak)</span>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#1a1727] border border-[#3c3162]/40 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed">
                    <span className="font-extrabold text-slate-300 block mb-1">⚙️ Entegrasyon Altyapısı</span>
                    Buradan girdiğiniz komutlar, sunucudaki <b>McDelivery</b> eklentisinin veritabanında yer alan <code>command_queue</code> tablosuna anında yazılır ve oyun içi eklenti tarafından sırasıyla okunup çalıştırılır.
                  </div>
                </div>
              )}

              {/* 12) TAB: SYSTEM SETTINGS */}
              {activeTab === "sys-settings" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Portal Genel Sistem Ayarları</h2>
                    <p className="text-xs text-slate-400">ZefirCraft web portalının sunucu IP adresi, webhook entegrasyonu ve kural listesini yönetin.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Settings Form */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <KeyRound className="w-4.5 h-4.5 text-sky-400" />
                        Eklenti Güvenliği & IP
                      </h3>

                      <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Gizli API Anahtarı (Secret Key)</label>
                          <input
                            type="text"
                            required
                            value={secretKey}
                            onChange={e => setSecretKey(e.target.value)}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 font-mono text-xs text-sky-400 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Minecraft Sunucu IP Adresi</label>
                          <input
                            type="text"
                            required
                            value={serverIP}
                            onChange={e => setServerIP(e.target.value)}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Discord Webhook Bildirim URL</label>
                          <input
                            type="text"
                            value={discordWebhook}
                            onChange={e => setDiscordWebhook(e.target.value)}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between bg-[#111625] p-3 rounded-xl border border-[#27355a]/30">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-black text-white block">Satın Alımda Oyunda Olma Zorunluluğu</span>
                            <span className="text-[9px] text-slate-400">Aktifse, oyuncuların mağazadan alışveriş yapabilmesi için oyunda olmaları doğrulanır.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRequireOnlineForPurchase(!requireOnlineForPurchase);
                              triggerNotification(`Oyunda olma zorunluluğu ${!requireOnlineForPurchase ? "aktif edildi" : "kapatıldı"}.`);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              requireOnlineForPurchase
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {requireOnlineForPurchase ? "Zorunlu (Aktif)" : "Serbest (Pasif)"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-[#111625] p-3 rounded-xl border border-[#27355a]/30">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-black text-white block">Survival Sezon 2 Özel Modu</span>
                            <span className="text-[9px] text-slate-500">Özel efektler ve Sezon 2 arayüz efektlerini aktifleştirir.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSeasonalMode(!seasonalMode);
                              triggerNotification(`Karlı tema modu ${!seasonalMode ? "aktif edildi" : "kapatıldı"}.`);
                            }}
                            className="text-sky-400 hover:text-sky-300 focus:outline-none"
                          >
                            {seasonalMode ? "Aktif" : "Pasif"}
                          </button>
                        </div>

                        {/* Spigot Plugin Config YAML Snippet Box */}
                        <div className="bg-[#111625] p-3.5 rounded-xl border border-sky-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Spigot / Paper Plugin Config (plugins/ZefirCraft/config.yml)</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`api-url: "https://${window.location.host}/api/plugin"\nsecret-key: "${secretKey}"\nheartbeat-interval: 30`);
                                triggerNotification("Plugin konfigürasyonu panoya kopyalandı!");
                              }}
                              className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded text-[9px] font-bold"
                            >
                              Kopyala
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
{`api-url: "https://${window.location.host}/api/plugin"
secret-key: "${secretKey || "zefir_sec_982374829374"}"
heartbeat-interval: 30`}
                          </pre>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl cursor-pointer"
                        >
                          Eklenti & IP Ayarlarını Kaydet
                        </button>
                      </form>
                    </div>

                    {/* Adsterra & Earn Settings Form */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4.5 h-4.5 text-amber-400" />
                        Adsterra Reklam & Kredi Kazanım Ayarları
                      </h3>

                      <form onSubmit={handleSaveEarnSettings} className="space-y-4">
                        {/* Earn System Enable/Disable Toggle Card */}
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                          earnSystemEnabled
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/10 border-red-500/30 text-red-300"
                        }`}>
                          <div className="space-y-1">
                            <span className="text-xs font-black uppercase tracking-wider block">
                              ⚡ Kredi Kazanma & Anket Sistemi Durumu
                            </span>
                            <p className="text-[11px] opacity-80 leading-relaxed">
                              {earnSystemEnabled
                                ? "Sistem şu an AKTİF. Oyuncular anket çözebilir, reklam izleyebilir ve görev yapabilir."
                                : "Sistem KAPALI (Devre Dışı). Oyuncular 'Kredi Kazan' sayfasında bakım uyarısı görür ve anket çözemez."
                              }
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEarnSystemEnabled(!earnSystemEnabled)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-md ${
                              earnSystemEnabled
                                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                                : "bg-red-500 hover:bg-red-400 text-white"
                            }`}
                          >
                            {earnSystemEnabled ? "AÇIK (Aktif)" : "KAPALI (Devre Dışı)"}
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Adsterra Direct Link / Yönlendirme URL'si</label>
                          <input
                            type="text"
                            required
                            value={adsterraUrl}
                            onChange={e => setAdsterraUrl(e.target.value)}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-amber-400 font-mono focus:outline-none"
                            placeholder="https://www.effectivecpmnetwork.com/..."
                          />
                          <p className="text-[10px] text-slate-500">Oyuncuların reklam izle butonuna bastığında yönlendirileceği Adsterra Smartlink/Directlink bağlantısı. Birden fazla link için aralarına virgül koyabilirsiniz (otomatik rotasyon yapılır).</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase">Monlix Offerwall / Portal URL'si</label>
                          <input
                            type="text"
                            value={monlixUrl}
                            onChange={e => setMonlixUrl(e.target.value)}
                            className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-sky-400 font-mono focus:outline-none"
                            placeholder="https://monlix.com veya https://offerwall.monlix.com/..."
                          />
                          <p className="text-[10px] text-slate-500">Monlix teklif duvarı bağlantınız veya yayıncı ID linkiniz. Oyuncular görev ve anket tamamlayarak kredi kazanır.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase">Reklam Ödülü (Kredi)</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={adRewardCredits}
                              onChange={e => setAdRewardCredits(Number(e.target.value))}
                              className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase">Reklam Cooldown (Dk)</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={adCooldownMinutes}
                              onChange={e => setAdCooldownMinutes(Number(e.target.value))}
                              className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase">Günlük Ödül (Kredi)</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={dailyBonusCredits}
                              onChange={e => setDailyBonusCredits(Number(e.target.value))}
                              className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                        >
                          Adsterra & Kredi Ayarlarını Kaydet
                        </button>
                      </form>
                    </div>

                    {/* Rules Editor Form */}
                    <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4.5 h-4.5 text-sky-400" />
                        Sunucu Kuralları Güncelleyici
                      </h3>

                      <form onSubmit={handleAddRule} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Yeni kural metni girin..."
                          value={newRuleInput}
                          onChange={e => setNewRuleInput(e.target.value)}
                          className="flex-1 bg-[#111625] border border-[#27355a] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                        >
                          Ekle
                        </button>
                      </form>

                      {/* Active Rules List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {rulesList.map((rule, idx) => (
                          <div key={idx} className="bg-[#111625] border border-[#27355a]/30 p-3 rounded-xl flex items-start justify-between gap-3 text-xs text-slate-300">
                            <span className="leading-relaxed">
                              {idx + 1}. {rule}
                            </span>
                            <button
                              onClick={() => handleDeleteRule(idx)}
                              className="text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
                              title="Kuralı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 13) TAB: SUPPORT TICKETS */}
              {activeTab === "support-tickets" && (
                <div className="space-y-6">
                  <div className="border-[#1b3d54] border-[#1e293b] pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">Kullanıcı Destek Talepleri</h2>
                      <p className="text-xs text-slate-400">Kullanıcıların gönderdiği tüm teknik, ödeme ve hesap destek bildirimlerini yanıtlayın.</p>
                    </div>
                    <span className="bg-[#1e293b] text-cyan-400 text-xs px-3 py-1 rounded-full border border-cyan-500/30 font-black">
                      {tickets.length} Toplam
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Tickets Sidebar List (Left 5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-4 space-y-3">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Talepler</span>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                          {tickets.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-6">Aktif destek talebi bulunmuyor.</p>
                          ) : (
                            tickets.map(t => {
                              const isSelected = selectedTicket && (selectedTicket.id === t.id || selectedTicket._id === t._id);
                              const isOpen = t.status === "open";
                              return (
                                <button
                                  key={t.id || t._id}
                                  onClick={() => setSelectedTicket(t)}
                                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 cursor-pointer ${
                                    isSelected
                                      ? "bg-cyan-950/40 border-cyan-500 text-white shadow-lg"
                                      : "bg-[#111625] border-[#27355a]/40 hover:border-[#27355a] text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-black truncate max-w-[150px]">{t.subject}</span>
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                                      isOpen
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-slate-800 text-slate-500 border border-slate-700/50"
                                    }`}>
                                      {isOpen ? "Açık" : "Kapalı"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between w-full text-[10px] text-slate-400 pt-1.5 border-t border-[#27355a]/10">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={`https://mc-heads.net/avatar/${t.username}/16`}
                                        alt={t.username}
                                        className="w-4 h-4 rounded border border-[#27355a] shrink-0"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="font-semibold">{t.username}</span>
                                    </div>
                                    <span>{new Date(t.createdAt).toLocaleDateString("tr-TR")}</span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ticket Chat/Conversation Panel (Right 7 cols) */}
                    <div className="lg:col-span-7">
                      {selectedTicket ? (
                        <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-5 space-y-5">
                          {/* Ticket Header Actions */}
                          <div className="flex items-center justify-between border-[#1b3d54] border-[#27355a]/40 pb-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://mc-heads.net/avatar/${selectedTicket.username}/36`}
                                alt={selectedTicket.username}
                                className="w-9 h-9 rounded-lg border border-[#27355a] shadow-inner shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Talep Sahibi</h4>
                                <span className="text-sm font-black text-white">{selectedTicket.username}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{selectedTicket.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedTicket.status === "open" ? (
                                <button
                                  onClick={() => handleTicketStatus(selectedTicket.id || selectedTicket._id, "closed")}
                                  className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Kapat
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleTicketStatus(selectedTicket.id || selectedTicket._id, "open")}
                                  className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Yeniden Aç
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Ticket Details & Original Message */}
                          <div className="bg-[#111625] border border-[#27355a]/30 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">Konu: {selectedTicket.subject}</span>
                              <span className="text-[9px] text-slate-500">{new Date(selectedTicket.createdAt).toLocaleString("tr-TR")}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                          </div>

                          {/* Replies Thread */}
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Cevaplar & Geçmiş</span>
                            {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                              <p className="text-[11px] text-slate-500 italic">Henüz cevap yazılmamış.</p>
                            ) : (
                              selectedTicket.replies.map((rep: any, idx: number) => {
                                const isAdmin = rep.sender !== selectedTicket.username;
                                return (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                                      isAdmin
                                        ? "bg-cyan-950/20 border-cyan-500/30 pl-4"
                                        : "bg-[#111625] border-[#27355a]/20"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[10px] font-black uppercase ${isAdmin ? "text-cyan-400" : "text-white"}`}>
                                        {rep.sender} {isAdmin && "⭐ (Yönetici)"}
                                      </span>
                                      <span className="text-[8px] text-slate-500">{new Date(rep.createdAt).toLocaleString("tr-TR")}</span>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rep.message}</p>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Reply Input Box */}
                          {selectedTicket.status === "open" && (
                            <div className="space-y-2 pt-2 border-t border-[#27355a]/40">
                              <textarea
                                rows={3}
                                placeholder="Cevabınızı buraya yazın..."
                                value={ticketReplyInput}
                                onChange={e => setTicketReplyInput(e.target.value)}
                                className="w-full bg-[#111625] border border-[#27355a] rounded-xl p-3 text-xs text-white focus:outline-none placeholder-slate-600 leading-relaxed"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleTicketReply(selectedTicket.id || selectedTicket._id)}
                                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl cursor-pointer"
                                >
                                  Cevabı Gönder
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#171e32] border border-[#27355a] rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
                          <Megaphone className="w-12 h-12 text-slate-600" />
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Talep Seçilmedi</h3>
                          <p className="text-xs text-slate-500 max-w-xs">Sol taraftaki menüden detaylarını ve geçmişini görüntülemek istediğiniz bir destek talebini seçin.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* Admin Role & Permission Management Modal */}
      <AdminRoleModal
        targetUsername={roleModalTarget}
        isOpen={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false);
          setRoleModalTarget(null);
        }}
        onSuccess={() => {
          fetchAdminData();
          setSuccessMessage("Kullanıcı rol ve yetkileri başarıyla güncellendi.");
        }}
      />
    </div>
  );
}
