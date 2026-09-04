import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CreditCard,
  Send,
  History,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  Lock,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Clock,
  User,
  Building2,
  Smartphone,
  BadgePercent,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Info,
  Flame,
  Star,
  CheckCircle
} from "lucide-react";

interface CreditHubProps {
  user: { username: string; credits: number; isAdmin?: boolean } | null;
  onUpdateCredits: (newCredits: number) => void;
  onOpenLogin: () => void;
}

interface PaymentPackage {
  id: string;
  amountTL: number;
  credits: number;
  bonusPercent?: number;
  bonus?: number;
  badge?: string;
  popular?: boolean;
  isPopular?: boolean;
}

interface PaymentOrder {
  _id?: string;
  orderId: string;
  username: string;
  amountTL: number;
  credits: number;
  bonusCredits?: number;
  paymentMethod: "visa" | "shopier" | "paytr" | "havale" | "papara" | "card_transfer" | "test";
  status: "pending" | "completed" | "failed" | "cancelled";
  senderName?: string;
  senderBank?: string;
  createdAt: string;
  completedAt?: string;
  adminNote?: string;
}

interface CreditTransfer {
  _id?: string;
  fromUser: string;
  toUser: string;
  amount: number;
  note?: string;
  createdAt: string;
}

interface PaymentSettingsResponse {
  creditPerTL: number;
  minPaymentTL: number;
  maxPaymentTL: number;
  packages: PaymentPackage[];
  gateways: {
    visaCard?: {
      enabled: boolean;
      cardNumber: string;
      cardHolder: string;
      bankName: string;
      currency: string;
      aznRate: number;
      instructions: string;
    };
    shopier: { enabled: boolean; testMode: boolean; hasCredentials: boolean };
    paytr: { enabled: boolean; testMode: boolean; hasCredentials: boolean };
    havale: {
      enabled: boolean;
      bankName: string;
      accountHolder: string;
      iban: string;
      paparaNumber: string;
      instructions: string;
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL HIGH-DEFINITION PAYMENT BRAND LOGOS DIRECTLY FROM CDN
// ─────────────────────────────────────────────────────────────────────────────

function VisaSvg({ className = "h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 32" className={`${className} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M38.8 3.5l-6.3 18.2h-4.2l3.9-18.2h6.6zm22.5 12.1c-.1-4.8-6.6-5.1-6.5-7.2.1-1.7 1.8-2.6 3.6-2.6 2.4 0 4.2.5 5.5 1.1l1-4.7c-1.4-.5-3.3-1-5.7-1-6.1 0-10.4 3.2-10.4 7.9-.1 3.4 3 5.3 5.4 6.5 2.4 1.2 3.2 2 3.2 3.1 0 1.7-2 2.4-3.9 2.4-2.7 0-4.8-.6-6.4-1.4l-1 4.8c1.6.7 4.1 1.2 6.7 1.2 6.4 0 10.6-3.1 10.6-7.8zM78.6 3.5h-5.1c-1.6 0-2.8.5-3.5 2.1l-10 24h6.8l1.4-3.8h8.3l.8 3.8h6l-5.7-26.1zm-7.6 15.6l2.6-7.1 1.5 7.1h-4.1zM26.4 3.5L20.2 20l-.7-3.5C18.3 12.7 14 7.4 9.1 4.8l5.8 24.8h6.8l10.1-26.1h-5.4z" fill="#1434CB"/>
      <path d="M12.9 3.5H2.2L2 4.1c8.3 2.1 13.8 7.2 16.1 13.4l-2.3-11.6c-.4-1.7-1.6-2.3-2.9-2.4z" fill="#F7B600"/>
    </svg>
  );
}

function MastercardSvg({ className = "h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={`${className} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#0f172a" />
      <circle cx="14" cy="12" r="7.5" fill="#EB001B" />
      <circle cx="22" cy="12" r="7.5" fill="#F79E1B" fillOpacity="0.92" />
      <path d="M18 6.5A7.5 7.5 0 0 0 18 17.5A7.5 7.5 0 0 0 18 6.5Z" fill="#FF5F00" />
    </svg>
  );
}

function VisaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 px-2.5 rounded-xl bg-white flex items-center justify-center shadow-md shadow-blue-950/50 shrink-0">
        <VisaSvg className="h-3.5" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-black text-white text-sm tracking-tight">
            Visa <span className="text-blue-400">Kart</span>
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/25 border border-blue-400/40 text-blue-300 text-[9px] font-black uppercase">
            Doğrudan Kart
          </span>
        </div>
        <div className="text-[10px] text-slate-400">Karttan Karta Kolay Transfer</div>
      </div>
    </div>
  );
}

function PaymentNetworkBadges() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-[#091224]/90 border border-sky-500/20 text-xs shadow-lg">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Visa */}
        <div className="h-7 px-2 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <VisaSvg className="h-3" />
        </div>
        {/* Mastercard */}
        <div className="h-7 px-1.5 rounded-lg bg-[#0f172a] border border-slate-700 flex items-center justify-center shadow-sm">
          <MastercardSvg className="h-4" />
        </div>
        {/* Troy */}
        <div className="h-7 px-2.5 rounded-lg bg-[#004A80] flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-black text-white tracking-widest flex items-center gap-0.5">
            TR<span className="text-[#00B4D8]">O</span>Y
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold ml-auto">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Tüm Banka & Kartlardan Güvenli Transfer</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function CreditHub({ user, onUpdateCredits, onOpenLogin }: CreditHubProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "transfer" | "history" | "guide">("buy");
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Settings & packages
  const [settings, setSettings] = useState<PaymentSettingsResponse | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>("pkg-3");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<"visa" | "shopier" | "paytr" | "havale">("visa");

  // Havale & Visa form
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [senderIban, setSenderIban] = useState("");
  const [senderNote, setSenderNote] = useState("");

  // Transfer form
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // History
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [transfers, setTransfers] = useState<CreditTransfer[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "orders" | "transfers">("all");

  // Notifications & Modals
  const [notification, setNotification] = useState<{ message: string; isSuccess: boolean } | null>(null);
  const [testModalOrder, setTestModalOrder] = useState<{
    orderId: string;
    amountTL: number;
    credits: number;
    method: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const triggerToast = (message: string, isSuccess: boolean) => {
    setNotification({ message, isSuccess });
    setTimeout(() => setNotification(null), 5000);
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch("/api/credits/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.packages && data.packages.length > 0 && !selectedPackageId) {
          const popular = data.packages.find((p: any) => p.popular || p.isPopular);
          setSelectedPackageId(popular ? popular.id : data.packages[0].id);
        }
        // Set default method: prefer visa if enabled, otherwise fallback
        if (data.gateways?.visaCard?.enabled) {
          setSelectedMethod("visa");
        } else if (data.gateways?.shopier?.enabled) {
          setSelectedMethod("shopier");
        } else if (data.gateways?.havale?.enabled) {
          setSelectedMethod("havale");
        }
      }
    } catch (e) {
      console.error("Failed to load payment settings:", e);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/credits/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTransfers(data.transfers || []);
      }
    } catch (e) {
      console.error("Failed to load credit history:", e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, activeTab]);

  // Current selected amount calculation
  const getSelectedDetails = () => {
    if (customAmount && Number(customAmount) > 0) {
      const tl = Number(customAmount);
      const rate = settings?.creditPerTL || 1;
      const base = Math.round(tl * rate);
      let bonus = 0;
      if (tl >= 1000) bonus = Math.round(base * 0.35);
      else if (tl >= 500) bonus = Math.round(base * 0.25);
      else if (tl >= 250) bonus = Math.round(base * 0.20);
      else if (tl >= 100) bonus = Math.round(base * 0.15);
      else if (tl >= 50) bonus = Math.round(base * 0.10);
      return { tl, credits: base + bonus, bonus, base };
    }

    if (selectedPackageId && settings?.packages) {
      const pkg = settings.packages.find((p) => p.id === selectedPackageId);
      if (pkg) {
        const rate = settings.creditPerTL || 1;
        const base = Math.round(pkg.amountTL * rate);
        const bonus = Math.max(0, pkg.credits - base);
        return {
          tl: pkg.amountTL,
          credits: pkg.credits,
          bonus: pkg.bonus !== undefined ? pkg.bonus : bonus,
          base
        };
      }
    }

    return { tl: 50, credits: 55, bonus: 5, base: 50 };
  };

  const selectedDetails = getSelectedDetails();

  // Handle purchase submission
  const handleInitiatePayment = async () => {
    if (!user) {
      onOpenLogin();
      triggerToast("Ödeme yapabilmek için lütfen önce giriş yapınız.", false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      onOpenLogin();
      triggerToast("Oturumunuzun süresi dolmuş, lütfen tekrar giriş yapınız.", false);
      return;
    }

    if (selectedMethod === "visa" || selectedMethod === "havale") {
      if (!senderName || senderName.trim().length < 3) {
        triggerToast("Lütfen transferi yapan kişinin Ad ve Soyadını giriniz.", false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/credits/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amountTL: selectedDetails.tl,
          packageId: customAmount ? null : selectedPackageId,
          paymentMethod: selectedMethod,
          senderName,
          senderBank,
          senderIban,
          senderNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.error || "Ödeme başlatılamadı.", false);
        return;
      }

      // 1) Havale / Visa Card Notice
      if (data.pending) {
        triggerToast(data.message || "Ödeme bildiriminiz alındı! Yetkililerimiz onayladığında krediniz yüklenecektir.", true);
        setSenderName("");
        setSenderBank("");
        setSenderIban("");
        setSenderNote("");
        fetchHistory();
        setActiveTab("history");
        return;
      }

      // 2) Test Mode / Sandbox
      if (data.testMode) {
        setTestModalOrder({
          orderId: data.orderId,
          amountTL: selectedDetails.tl,
          credits: selectedDetails.credits,
          method: selectedMethod.toUpperCase()
        });
        return;
      }

      // 3) Shopier Direct Form Submit
      if (data.actionUrl && data.formParams) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.actionUrl;
        form.target = "_blank";

        Object.entries(data.formParams).forEach(([key, val]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        triggerToast("Shopier 3D Secure güvenli ödeme sayfası yeni sekmede açıldı.", true);
        return;
      }

      triggerToast("Ödeme işlemi oluşturuldu. Lütfen adımları takip ediniz.", true);
    } catch (e: any) {
      console.error("[Payment initiation error]:", e);
      triggerToast(e?.message ? `Bağlantı hatası: ${e.message}` : "Ödeme sunucusuyla iletişim kurulurken bir bağlantı hatası meydana geldi.", false);
    } finally {
      setLoading(false);
    }
  };

  // Complete simulated test payment
  const handleCompleteTestSimulation = async () => {
    if (!testModalOrder) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/credits/simulate-success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: testModalOrder.orderId })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message || "Ödeme başarıyla onaylandı ve kredi yüklendi!", true);
        if (data.newCredits !== undefined) {
          onUpdateCredits(data.newCredits);
        }
        setTestModalOrder(null);
        fetchHistory();
      } else {
        triggerToast(data.error || "Test ödemesi onaylanamadı.", false);
      }
    } catch (e) {
      triggerToast("Bağlantı hatası.", false);
    } finally {
      setLoading(false);
    }
  };

  // Handle transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenLogin();
      return;
    }

    const amountNum = parseInt(transferAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerToast("Lütfen geçerli bir kredi miktarı giriniz.", false);
      return;
    }

    if (user.credits < amountNum) {
      triggerToast(`Krediniz yetersiz! Mevcut bakiyeniz: ${user.credits} Kredi.`, false);
      return;
    }

    if (!transferTarget.trim()) {
      triggerToast("Lütfen alıcı oyuncu adını giriniz.", false);
      return;
    }

    if (transferTarget.trim().toLowerCase() === user.username.toLowerCase()) {
      triggerToast("Kendinize kredi transferi yapamazsınız.", false);
      return;
    }

    setTransferSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/credits/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toUser: transferTarget.trim(),
          amount: amountNum,
          note: transferNote.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast(data.message || "Kredi transferi başarıyla tamamlandı!", true);
        if (data.newBalance !== undefined) {
          onUpdateCredits(data.newBalance);
        }
        setTransferTarget("");
        setTransferAmount("");
        setTransferNote("");
        fetchHistory();
      } else {
        triggerToast(data.error || "Transfer başarısız.", false);
      }
    } catch (e) {
      triggerToast("Bağlantı hatası oluştu.", false);
    } finally {
      setTransferSubmitting(false);
    }
  };

  const currentBalance = user ? user.credits : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs md:text-sm font-bold backdrop-blur-xl ${
              notification.isSuccess
                ? "bg-[#0b241c]/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/60"
                : "bg-[#291016]/95 text-rose-300 border-rose-500/50 shadow-rose-950/60"
            }`}
          >
            {notification.isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar (Harmonious Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c162b] via-[#102244] to-[#0d1830] border border-sky-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-black tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Güvenli Ödeme & Kredi Merkezi
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              ZefirCraft Kredi Portalı
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              16 haneli kart numaramıza kolayca transfer yaparak bakiye yükleyin veya diğer oyunculara anında kredi transfer edin.
            </p>
          </div>

          {/* Current Balance Box */}
          <div className="w-full md:w-auto bg-[#0a1224]/80 border border-sky-500/40 rounded-2xl p-4 md:p-5 flex items-center justify-between md:justify-start gap-4 backdrop-blur-md shadow-xl shadow-sky-950/40">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Mevcut Krediniz
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  {currentBalance.toLocaleString("tr-TR")}
                </span>
                <span className="text-xs text-amber-300/80 font-bold">Kredi</span>
              </div>
            </div>
            {!user && (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-8 pt-6 border-t border-sky-500/20">
          <button
            onClick={() => setActiveTab("buy")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "buy"
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/30"
                : "bg-[#131d33] text-slate-300 hover:bg-[#1a2846] hover:text-white border border-sky-500/10"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Kredi Yükle
          </button>

          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "transfer"
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/30"
                : "bg-[#131d33] text-slate-300 hover:bg-[#1a2846] hover:text-white border border-sky-500/10"
            }`}
          >
            <Send className="w-4 h-4" />
            Kredi Gönder
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/30"
                : "bg-[#131d33] text-slate-300 hover:bg-[#1a2846] hover:text-white border border-sky-500/10"
            }`}
          >
            <History className="w-4 h-4" />
            İşlem Geçmişi
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "guide"
                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30"
                : "bg-[#131d33] text-slate-300 hover:bg-[#1a2846] hover:text-white border border-amber-500/10"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Nasıl Çalışır?
          </button>
        </div>
      </div>

      {/* Security ribbon */}
      <PaymentNetworkBadges />

      {/* TAB 1: KREDİ YÜKLE */}
      {activeTab === "buy" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Packages & Amount Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Package Grid */}
            <div className="bg-[#0f172a]/90 border border-sky-500/25 rounded-3xl p-5 sm:p-6 md:p-8 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-black border border-sky-500/40">
                      1
                    </span>
                    Kredi Paketi Seçin
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paket büyüklüğü arttıkça ekstra hediye bonus kredi kazanırsınız.
                  </p>
                </div>
              </div>

              {/* Responsive Package cards: 2-col on mobile, 3-col on tablet/desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                {(settings?.packages || [
                  { id: "pkg-1", amountTL: 30, credits: 30, bonus: 0 },
                  { id: "pkg-2", amountTL: 50, credits: 55, bonus: 5, badge: "%10 Bonus" },
                  { id: "pkg-3", amountTL: 100, credits: 115, bonus: 15, badge: "Popüler", popular: true },
                  { id: "pkg-4", amountTL: 250, credits: 300, bonus: 50, badge: "%20 Bonus", popular: true },
                  { id: "pkg-5", amountTL: 500, credits: 625, bonus: 125, badge: "VIP Avantaj" },
                  { id: "pkg-6", amountTL: 1000, credits: 1350, bonus: 350, badge: "Efsane" }
                ]).map((pkg: any) => {
                  const isSelected = selectedPackageId === pkg.id && !customAmount;
                  const isPop = pkg.popular || pkg.isPopular;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setCustomAmount("");
                      }}
                      className={`p-3.5 sm:p-4 md:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? "bg-gradient-to-b from-[#13274c] via-[#0f1f3d] to-[#0c172e] border-sky-400 ring-2 ring-sky-400/40 shadow-xl shadow-sky-500/20"
                          : "bg-gradient-to-b from-[#11192e] to-[#0b1222] border-slate-800 hover:border-sky-500/40 hover:bg-[#131d36]"
                      }`}
                    >
                      <div>
                        {/* Header with Radio indicator and clean badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-sky-400 bg-sky-500" : "border-slate-700 bg-slate-900"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>

                          {pkg.badge ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm ${
                                isPop
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-amber-950/40"
                                  : "bg-sky-500/20 text-sky-300 border border-sky-400/40"
                              }`}
                            >
                              {isPop ? `★ ${pkg.badge}` : pkg.badge}
                            </span>
                          ) : (
                            <Coins className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                              isSelected ? "text-amber-400" : "text-slate-600"
                            }`} />
                          )}
                        </div>

                        {/* Credits */}
                        <div className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-baseline gap-1">
                          {pkg.credits}
                          <span className="text-[11px] text-amber-400 font-bold">Kr.</span>
                        </div>

                        {/* Bonus Chip */}
                        {(pkg.bonus > 0 || (pkg.bonusPercent && pkg.bonusPercent > 0)) && (
                          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>+{pkg.bonus || Math.round(pkg.credits * (pkg.bonusPercent / 100))} Bonus</span>
                          </div>
                        )}
                      </div>

                      {/* Price Footer */}
                      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] text-slate-400">Tutar:</span>
                        <span className="text-xs sm:text-sm md:text-base font-black text-sky-400 tracking-tight">
                          {pkg.amountTL} ₺
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div className="pt-4 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Veya İstediğiniz Özel Tutarı Girin (TL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={settings?.minPaymentTL || 10}
                    max={settings?.maxPaymentTL || 5000}
                    placeholder={`Örn: 75 (${settings?.minPaymentTL || 10} ₺ - ${settings?.maxPaymentTL || 5000} ₺ arası)`}
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPackageId(null);
                    }}
                    className="w-full bg-[#090e1c] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sky-400 transition-colors pr-16"
                  />
                  <span className="absolute right-4 top-3 text-slate-400 text-sm font-bold">
                    ₺ (TL)
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Payment & Card Information */}
            <div className="bg-[#0f172a]/90 border border-sky-500/25 rounded-3xl p-5 sm:p-6 md:p-8 space-y-6 shadow-xl">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-black border border-sky-500/40">
                    2
                  </span>
                  Kart Bilgileri & Ödeme Bildirimi
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aşağıdaki 16 haneli Visa kart numarasına transferinizi yaptıktan sonra bildirim formunu doldurunuz.
                </p>
              </div>

              {/* Luxury Digital Visa Card Visual */}
              <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-gradient-to-tr from-[#09162e] via-[#0e2754] to-[#184288] p-5 sm:p-6 text-white shadow-2xl border border-blue-400/40">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  {/* EMV Chip */}
                  <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 shadow-inner flex items-center justify-center">
                    <div className="w-7 h-5 border border-amber-900/40 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                      <div className="border-r border-b border-amber-900/40" />
                      <div className="border-b border-amber-900/40" />
                      <div className="border-r border-amber-900/40" />
                      <div />
                    </div>
                  </div>
                  <div className="h-7 px-2.5 rounded-lg bg-white flex items-center justify-center shadow">
                    <VisaSvg className="h-4" />
                  </div>
                </div>

                {/* 16-Digit Card Number */}
                <div className="space-y-1 mb-5">
                  <span className="text-[9px] uppercase tracking-widest text-blue-200 font-bold block">
                    Visa Kart Numarası
                  </span>
                  <div className="font-mono text-base sm:text-lg md:text-xl font-black tracking-widest text-white drop-shadow select-all break-all">
                    {settings?.gateways?.visaCard?.cardNumber || "4098 5844 6336 1459"}
                  </div>
                </div>

                {/* Footer: Universal bank info */}
                <div className="flex items-center justify-between text-[11px] text-blue-200/80 pt-3 border-t border-blue-400/20">
                  <span>Tüm Banka & Kartlardan Gönderim</span>
                  <span className="font-mono text-[10px] text-blue-300">7/24 Aktif</span>
                </div>
              </div>

              {/* Actions: Copy Button & Amount */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings?.gateways?.visaCard?.cardNumber?.replace(/\s+/g, "") || "4098584463361459", "visaCard")}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {copiedField === "visaCard" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      Kart Numarası Kopyalandı (4098 5844 6336 1459)
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kart Numarasını Kopyala (4098 5844 6336 1459)
                    </>
                  )}
                </button>

                <div className="px-4 py-2.5 rounded-xl bg-[#0e1b38] border border-blue-400/30 flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-xs text-slate-300 font-bold whitespace-nowrap">Gönderilecek:</span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {selectedDetails.tl} ₺
                  </span>
                </div>
              </div>

              {/* Universal Support Information */}
              <div className="p-4 rounded-2xl bg-[#081226] border border-blue-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-black text-sky-400 text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  Tüm Kart ve Bankalardan Kolayca Gönderin
                </div>
                <p className="text-slate-300 leading-relaxed text-[11.5px]">
                  Kullandığınız kartın veya bankanın ne olduğu fark etmeksizin (<strong>Mastercard, Visa, Troy</strong> veya <strong>Ziraat, Garanti, İş Bankası, Yapı Kredi, Akbank, Papara</strong> vb.), banka uygulamanızdaki <strong>"Karttan Karta Transfer"</strong> veya <strong>"Para Gönder"</strong> bölümünden bu 16 haneli kart numarasına transfer yapabilirsiniz.
                </p>
              </div>

              {/* Transfer Notice Form Inputs */}
              <div className="pt-2 border-t border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block">
                    Ödemeyi Gönderdikten Sonra Bildirim Formu:
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold">* Zorunlu Alan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                      Gönderen Kişinin Adı ve Soyadı *
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Ahmet Yılmaz"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full bg-[#081226] border border-blue-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                      Gönderim Yaptığınız Banka / Uygulama
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Garanti, Ziraat, Papara vb."
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full bg-[#081226] border border-blue-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                    Açıklama / İşlem Notu (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Saat 15:40'ta transfer yapıldı"
                    value={senderNote}
                    onChange={(e) => setSenderNote(e.target.value)}
                    className="w-full bg-[#081226] border border-blue-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Order Summary & Checkout Card */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 bg-gradient-to-b from-[#0f1a33] to-[#0a1224] border border-sky-500/35 rounded-3xl p-5 sm:p-6 md:p-7 space-y-5 backdrop-blur-xl shadow-2xl shadow-sky-950/40">
              <div className="flex items-center justify-between pb-4 border-b border-sky-500/20">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  Sipariş Özeti
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                  Manuel Onaylı
                </span>
              </div>

              {/* Player info */}
              <div className="p-3 rounded-2xl bg-[#070d1a] border border-slate-800 flex items-center gap-3">
                {user ? (
                  <>
                    <img
                      src={`https://mc-heads.net/avatar/${user.username}/36`}
                      alt={user.username}
                      className="w-9 h-9 rounded-lg shadow"
                    />
                    <div className="text-xs">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Hesap:</div>
                      <div className="font-extrabold text-white">{user.username}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400">
                    Sipariş vermek için lütfen oturum açınız.
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Ödeme Yöntemi:</span>
                  <span className="font-bold text-sky-300 uppercase">
                    VİSA KART TRANSFERİ
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Temel Kredi:</span>
                  <span className="font-semibold text-white">{selectedDetails.base} Kredi</span>
                </div>
                {selectedDetails.bonus > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Hediye Bonus:
                    </span>
                    <span>+{selectedDetails.bonus} Kredi</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-200">Toplam Kazanılacak:</span>
                  <span className="text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                    {selectedDetails.credits} Kredi
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-slate-200">Ödenecek Tutar:</span>
                  <span className="text-2xl font-black text-sky-400">
                    {selectedDetails.tl} ₺
                  </span>
                </div>
              </div>

              {/* Security highlights */}
              <div className="p-3.5 rounded-xl bg-[#080e1c] border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  Güvenli & Hızlı Onay
                </div>
                <p className="leading-relaxed text-[10px]">
                  Ödeme bildiriminiz doğrudan sunucu yetkililerimize iletilir ve kontrol edildikten sonra krediniz anında hesabınıza tanımlanır.
                </p>
              </div>

              {/* Action Button */}
              {user ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleInitiatePayment}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      İşlem Başlatılıyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Ödeme Bildirimini Gönder ({selectedDetails.tl} ₺)
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Kredi Yüklemek İçin Giriş Yap
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KREDİ GÖNDER (TRANSFER) */}
      {activeTab === "transfer" && (
        <div className="max-w-2xl mx-auto bg-[#0f172a]/90 border border-sky-500/25 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-sky-400 uppercase tracking-wider">
              <Send className="w-3.5 h-3.5" />
              Oyuncudan Oyuncuya Transfer
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              ZefirCraft Kredi Transferi
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bakiyenizdeki kredileri başka bir oyuncuya anında, komisyonsuz ve güvenli bir şekilde aktarabilirsiniz.
            </p>
          </div>

          <form onSubmit={handleTransfer} className="space-y-5">
            {/* Target Player */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Alıcı Oyuncu Adı *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Minecraft kullanıcı adı (Örn: Ahmet_Craft)"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  className="w-full bg-[#090e1c] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-400 pl-10"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Gönderilecek Kredi Miktarı *
                </label>
                <span className="text-[11px] text-slate-400">
                  Mevcut Bakiyeniz: <strong className="text-amber-400">{currentBalance} Kredi</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  required
                  placeholder="Miktar girin"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#090e1c] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-400 pl-10"
                />
                <Coins className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5" />
              </div>

              {/* Quick amount chips */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[10, 25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={currentBalance < amt}
                    onClick={() => setTransferAmount(String(amt))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    +{amt}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentBalance <= 0}
                  onClick={() => setTransferAmount(String(currentBalance))}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-[11px] font-bold text-sky-300 hover:bg-sky-500/30 transition-colors disabled:opacity-30 cursor-pointer"
                >
                  Tümü ({currentBalance})
                </button>
              </div>
            </div>

            {/* Transfer note */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Transfer Notu (İsteğe Bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: Kasaba arsa bedeli için teşekkürler!"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                maxLength={80}
                className="w-full bg-[#090e1c] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              {user ? (
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {transferSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Transfer Gerçekleştiriliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Krediyi Gönder
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full py-3.5 rounded-xl bg-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Transfer Yapabilmek İçin Giriş Yapın
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: İŞLEM GEÇMİŞİ */}
      {activeTab === "history" && (
        <div className="bg-[#0f172a]/90 border border-sky-500/25 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" />
                Kredi & Transfer Hareketleriniz
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Yaptığınız bakiye yüklemeleri ve diğer oyuncularla olan transferleriniz.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 bg-[#090e1c] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  historyFilter === "all" ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setHistoryFilter("orders")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  historyFilter === "orders" ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Yüklemeler ({orders.length})
              </button>
              <button
                onClick={() => setHistoryFilter("transfers")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  historyFilter === "transfers" ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Transferler ({transfers.length})
              </button>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-12 space-y-3">
              <Lock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">İşlem geçmişinizi görüntülemek için giriş yapmanız gerekmektedir.</p>
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs"
              >
                Giriş Yap
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Orders */}
              {(historyFilter === "all" || historyFilter === "orders") && orders.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Bakiye Yükleme Siparişleri
                  </span>
                  <div className="divide-y divide-slate-800/60 rounded-2xl bg-[#090e1c] border border-slate-800 overflow-hidden">
                    {orders.map((order) => (
                      <div key={order.orderId} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-bold">{order.orderId}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-sky-300">
                              {order.paymentMethod}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                order.status === "completed"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : order.status === "pending"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {order.status === "completed" ? "Tamamlandı" : order.status === "pending" ? "Beklemede" : "İptal Edildi"}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {new Date(order.createdAt).toLocaleDateString("tr-TR")} {new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            {order.senderName && ` • Gönderen: ${order.senderName}`}
                            {order.adminNote && ` • Not: ${order.adminNote}`}
                          </div>
                        </div>

                        <div className="text-right sm:self-center">
                          <div className="text-sm font-black text-amber-400">+{order.credits} Kredi</div>
                          <div className="text-[11px] text-slate-400">{order.amountTL} ₺</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transfers */}
              {(historyFilter === "all" || historyFilter === "transfers") && transfers.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Kredi Transfer Geçmişi
                  </span>
                  <div className="divide-y divide-slate-800/60 rounded-2xl bg-[#090e1c] border border-slate-800 overflow-hidden">
                    {transfers.map((t, idx) => {
                      const isSent = t.fromUser.toLowerCase() === user.username.toLowerCase();
                      return (
                        <div key={idx} className="p-4 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                isSent ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-white font-bold">
                                {isSent ? `Gönderilen: ${t.toUser}` : `Gelen: ${t.fromUser}`}
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {new Date(t.createdAt).toLocaleDateString("tr-TR")} {new Date(t.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                {t.note && ` • "${t.note}"`}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-black ${isSent ? "text-red-400" : "text-emerald-400"}`}>
                              {isSent ? `-${t.amount}` : `+${t.amount}`} Kredi
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {orders.length === 0 && transfers.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Henüz kayıtlı bir kredi yükleme veya transfer hareketiniz bulunmamaktadır.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ÖDEME & HESAP REHBERİ (NASIL ÇALIŞIR?) */}
      {activeTab === "guide" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#0f172a]/90 border border-sky-500/25 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                <Info className="w-3.5 h-3.5" />
                Ödeme Yöntemleri & Hesap Kurulum Rehberi
              </div>
              <h2 className="text-2xl font-black text-white">
                Nasıl Çalışır? Ne Hesabı Bağlamak Gerekir?
              </h2>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Sunucu sahibinin ödeme alabilmesi ve oyuncuların güvenle bakiye yüklemesi için gereken tüm bilgiler aşağıdadır.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Direct Card Transfer */}
              <div className="p-6 rounded-2xl bg-[#090e1c] border border-blue-500/30 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-base">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">16 Haneli Karta Doğrudan Transfer</h3>
                  <p className="text-xs text-blue-400 font-medium">Sıfır Komisyon • 4098 5844 6336 1459</p>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Şirket veya Aracı Gerekmez:</strong> Oyuncular istedikleri kredi paketini seçer ve ekrandaki 16 haneli kart numarasına bankalarından transfer yapar.
                  </p>
                  <p>
                    <strong>Bildirim Formu:</strong> Transfer yapıldıktan sonra oyuncu sitedeki forma adını soyadını yazıp gönderir.
                  </p>
                  <p>
                    <strong>Yönetici Onayı:</strong> Admin panelinizden gelen bildirimi tek tıkla onayladığınızda krediler anında oyuncunun hesabına tanımlanır.
                  </p>
                </div>
              </div>

              {/* Card 2: Mastercard & Other Card Compatibility */}
              <div className="p-6 rounded-2xl bg-[#090e1c] border border-orange-500/30 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-base">
                  2
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Mastercard & Troy Kartlar Kabul Edilir mi?</h3>
                  <p className="text-xs text-orange-400 font-medium">Tüm Kart Aileleri Desteklenir</p>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Evet, Kesinlikle:</strong> Gönderen kişinin kartı Mastercard, Troy veya Visa olabilir.
                  </p>
                  <p>
                    <strong>Karttan Karta Sistemi:</strong> Bankacılık altyapısındaki karttan karta (C2C / P2P) transfer protokolü sayesinde kart markası ne olursa olsun 16 haneli kartınıza para başarıyla ulaşır.
                  </p>
                  <p>
                    Oyuncular kendi banka uygulamalarının (Ziraat, Garanti, İş Bankası, Yapı Kredi, Papara vb.) "Para Gönder &rarr; Karta Transfer" bölümünü kullanabilir.
                  </p>
                </div>
              </div>

              {/* Card 3: Currency & TL Acceptance */}
              <div className="p-6 rounded-2xl bg-[#090e1c] border border-emerald-500/30 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-base">
                  3
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Kartım TL Kabul Ediyor mu?</h3>
                  <p className="text-xs text-emerald-400 font-medium">Otomatik Kur Çevrimi</p>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Evet, Otomatik Çevrilir:</strong> Oyuncu Türk Lirası (TL) gönderdiğinde Visa ve bankanız parayı resmi kurlar üzerinden anında hesabınıza dönüştürerek yatırır.
                  </p>
                  <p>
                    Oyuncunun cebinden TL çıkar, sizin kartınıza karşılığı sorunsuzca geçer; herhangi bir ek işlem veya ayar yapmanıza gerek yoktur.
                  </p>
                  <p>
                    <strong>Sorunsuz Bakiye:</strong> Sitede tüm paketler sade ve net ₺ (TL) olarak gösterilir.
                  </p>
                </div>
              </div>
            </div>

            {/* Player Security Promise */}
            <div className="p-5 rounded-2xl bg-[#081329] border border-sky-500/30 flex flex-col md:flex-row items-start md:items-center gap-4 text-xs text-slate-300">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-black text-white block">Oyuncularımız İçin Güvenlik Standardı</span>
                <p>
                  ZefirCraft web sitesinde hiçbir zaman kart şifreniz, son kullanma tarihiniz veya CVV güvenlik kodunuz istenmez veya kaydedilmez. Transferler doğrudan kendi banka veya kart uygulamanız üzerinden 16 haneli kart numarasına yapılır ve bildirim formunuz yetkili onayından geçerek güvenle kredilendirilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST MODE MODAL */}
      <AnimatePresence>
        {testModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0f172a] border border-sky-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                  Test / Demo Ödeme Modu
                </span>
                <h3 className="text-xl font-black text-white">
                  3D Secure Güvenli Ödeme Simülasyonu
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sunucunuzda şu anda Test Modu aktiftir. Gerçek kart bilgisi girmeden bakiye yükleme akışını test edebilirsiniz.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090e1c] border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sipariş Kodu:</span>
                  <span className="font-mono text-white font-bold">{testModalOrder.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Yöntem:</span>
                  <span className="text-sky-400 font-bold">{testModalOrder.method}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tutar:</span>
                  <span className="text-white font-bold">{testModalOrder.amountTL} ₺</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span className="font-bold text-white">Yüklenecek Kredi:</span>
                  <span className="text-amber-400 font-black text-sm">+{testModalOrder.credits} Kredi</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTestModalOrder(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  İptal Et
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompleteTestSimulation}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Ödemeyi Onayla & Yükle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
