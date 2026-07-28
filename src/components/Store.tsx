import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingCart, AlertCircle, CheckCircle, Clock, X, Database, Coins, 
  ArrowRightLeft, Sparkles, LogIn, ChevronRight, Check
} from "lucide-react";
import { Product, PurchaseRequest } from "../types";

interface StoreProps {
  user: { username: string; credits: number } | null;
  onUpdateCredits: (newCredits: number) => void;
  onNavigate: (page: string) => void;
}

export default function Store({ user, onUpdateCredits, onNavigate }: StoreProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("Hepsi");
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  // Custom purchase confirmation modal state
  const [confirmingProduct, setConfirmingProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<string[]>(["Hepsi", "Rütbeler", "Kozmetikler", "Kasalar", "Diğer"]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (user) {
      fetchMyPurchases();
      fetchOnlineStatus();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const names = ["Hepsi", ...data.map((c: any) => c.name)];
          setCategories(names);
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchOnlineStatus = async () => {
    const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOnline(!!data.isOnline);
      }
    } catch (err) {
      console.error("Failed to fetch online status:", err);
    }
  };

  const handleToggleOnline = async () => {
    const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me/toggle-online", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsOnline(data.isOnline);
        if (data.isOnline) {
          setSuccess("Minecraft sunucusuna başarıyla giriş yaptınız!");
          setError(null);
        } else {
          setSuccess("Minecraft sunucusundan çıkış yaptınız.");
        }
      }
    } catch (err) {
      console.error("Failed to toggle online status:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPurchases = async () => {
    const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
    if (!token) return;

    try {
      const res = await fetch("/api/purchases/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPurchases(data);
      }
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
    }
  };

  const executePurchase = async (product: Product) => {
    setConfirmingProduct(null);
    setPurchaseLoading(product._id);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("koli_token") || localStorage.getItem("zefir_token");
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id, deliveryType: "chest" })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Satın alma başarısız.");
      }

      setSuccess(`"${product.name}" başarıyla satın alındı ve Web Sandığınıza eklendi! Oyuna teslim etmek için üst menüden Web Sandığı sayfasına gidebilirsiniz.`);
      onUpdateCredits(data.newCredits);
      fetchMyPurchases();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handlePurchaseTrigger = (product: Product) => {
    if (!user) {
      onNavigate("login");
      return;
    }

    if (user.credits < product.price) {
      setError(`Krediniz yetersiz! Bu ürün ${product.price} Kredi, sizin bakiyeniz ise ${user.credits} Kredi.`);
      setSuccess(null);
      return;
    }

    setConfirmingProduct(product);
  };

  const filteredProducts = products.filter(p => category === "Hepsi" || p.category === category);

  return (
    <div className="space-y-12 py-4">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#111625]/60 border border-[#22304d] rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            ZefirCraft Mağazası
          </h1>
          <p className="text-xs text-slate-400">
            Kredilerinizle sunucu içi ayrıcalıklar, rütbeler ve kasa anahtarları satın alabilirsiniz.
          </p>
        </div>

        {/* User Stats Card with Connection Status */}
        {user ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gradient-to-br from-[#12192c] to-[#0c101e] rounded-2xl p-4 shadow-md border border-[#22304d]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 border border-sky-500/10 shrink-0">
                <Coins className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Güncel Bakiyeniz</div>
                <div className="text-base font-black tracking-wide text-sky-400">
                  {user.credits} <span className="text-[10px] text-slate-500 font-normal">Kredi</span>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:block border-l border-[#22304d]/40 h-8 mx-1"></div>
            
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="text-xs">
                <span className="text-slate-500 block text-[9px] font-bold">KULLANICI</span>
                <div className="font-extrabold text-slate-200">{user.username}</div>
              </div>

              <div className="border-l border-[#22304d]/40 h-8 mx-1"></div>

              {/* Server connection indicator and interactive join simulation */}
              <div className="flex flex-col gap-0.5 text-left shrink-0">
                <span className="text-slate-500 block text-[9px] font-bold uppercase">Sunucu Durumu</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                  <span className={`text-xs font-black uppercase ${isOnline ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}`}>
                    {isOnline ? "Oyunda" : "Bağlı Değil"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleOnline}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border shrink-0 ${
                  isOnline
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                }`}
                title={isOnline ? "Sunucudan çıkış yap" : "Sunucuya giriş yap"}
              >
                {isOnline ? "Çıkış Yap" : "Sunucuya Gir"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#151c2f] rounded-2xl p-4 border border-[#23314f] flex items-center justify-between gap-6 max-w-sm">
            <div className="text-xs text-slate-400 leading-relaxed">
              Ürün satın alabilmek ve güncel kredinizi görüntülemek için hesabınıza giriş yapın.
            </div>
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer shrink-0"
            >
              Giriş Yap
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 shadow-md"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed flex-1">
              <div className="font-bold text-sm mb-0.5">Satın Alma Hatası</div>
              <div>{error}</div>
            </div>
            <button onClick={() => setError(null)} className="p-1 text-slate-500 hover:text-red-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-400 shadow-md"
          >
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed flex-1">
              <div className="font-bold text-sm mb-0.5">İşlem Başarılı!</div>
              <div>{success}</div>
            </div>
            <button onClick={() => setSuccess(null)} className="p-1 text-slate-500 hover:text-emerald-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-[#1b3d54] border-[#1b253b] pb-3">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              category === cat
                ? "bg-sky-600/15 text-sky-400 border border-sky-500/25 shadow-md"
                : "bg-[#111625]/60 hover:bg-[#182035] text-slate-400 border border-[#23324f]/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Catalog */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-400" />
          Ürünler yükleniyor, lütfen bekleyin...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#111625]/40 rounded-3xl border border-[#1b253b] text-slate-500">
          Bu kategoride henüz ürün eklenmemiş.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <motion.div
              key={product._id}
              whileHover={{ y: -4 }}
              className="bg-[#111625]/75 rounded-2xl border border-[#1e2a40] overflow-hidden shadow-lg hover:border-sky-500/30 transition-all flex flex-col group"
            >
              <div className="h-44 relative bg-slate-900 overflow-hidden shrink-0">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#111625]/95 backdrop-blur-sm border border-[#2d3a5c] rounded-full text-[10px] font-black text-sky-400 uppercase tracking-wider">
                  {product.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-white leading-snug group-hover:text-sky-400 transition-colors">{product.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-t border-[#1e2a40]/55 pt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Fiyat</span>
                    <span className="text-base font-black text-sky-400 flex items-center gap-1.5">
                      <Coins className="w-5 h-5 text-sky-500 shrink-0" />
                      {product.price} <span className="text-[10px] font-normal text-slate-500">Kr</span>
                    </span>
                  </div>

                  <button
                    disabled={purchaseLoading === product._id}
                    onClick={() => handlePurchaseTrigger(product)}
                    className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      purchaseLoading === product._id
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md"
                    }`}
                  >
                    {purchaseLoading === product._id ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin text-sky-400" />
                        <span>İşleniyor...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>{user ? "Hemen Satın Al" : "Giriş Yap & Satın Al"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Purchase Queue / History */}
      {user && purchases.length > 0 && (
        <div className="border-t border-[#1c253b] pt-10 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-sky-400 animate-pulse" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Sipariş Teslimat Geçmişi
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Siparişleriniz sunucu eklentisi (McDelivery) tarafından arka planda anlık olarak sorgulanıp teslim edilir.
          </p>

          <div className="bg-[#111625]/75 border border-[#1e2a40] rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-[#171f33] border-[#1b3d54] border-[#212e4c]/70 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Tarih</th>
                    <th className="p-4">Ürün</th>
                    <th className="p-4">Minecraft Adı</th>
                    <th className="p-4">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a40]/40 text-slate-300">
                  {purchases.map(purchase => {
                    const matchedProduct = products.find(p => String(p._id) === String(purchase.productId));
                    return (
                      <tr key={purchase._id} className="hover:bg-[#1a233b]/40 transition-colors">
                        <td className="p-4 font-mono text-[10px] text-slate-500">
                          {new Date(purchase.createdAt).toLocaleString("tr-TR")}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-white text-xs md:text-sm">
                            {matchedProduct ? matchedProduct.name : "Minecraft Ürünü"}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">ID: {purchase._id}</div>
                        </td>
                        <td className="p-4 font-mono font-bold text-sky-300 flex items-center gap-2">
                          <img
                            src={`https://mc-heads.net/avatar/${purchase.username}/16`}
                            alt={purchase.username}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-sm border border-sky-950/40 shrink-0"
                          />
                          <span>{purchase.username}</span>
                        </td>
                        <td className="p-4">
                          {purchase.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg text-[10px] font-black uppercase">
                              <Clock className="w-3 h-3 animate-spin" />
                              Kuyrukta / Bekleniyor
                            </span>
                          ) : purchase.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase">
                              <Check className="w-3 h-3" />
                              Oyun İçi Teslim Edildi
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase">
                                <AlertCircle className="w-3 h-3" />
                                Başarısız
                              </span>
                              {purchase.failReason && (
                                <span className="text-[9px] text-red-400 pl-1 font-medium">
                                  Sebep: {purchase.failReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Custom Purchase Confirmation Modal */}
      <AnimatePresence>
        {confirmingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmingProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111625] border border-[#233356] rounded-3xl overflow-hidden max-w-md w-full shadow-2xl relative z-10 p-6 md:p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-950/20 animate-pulse">
                <ShoppingCart className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Siparişi Onayla</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-sky-300 font-extrabold">"{confirmingProduct.name}"</span> isimli ürünü <span className="text-sky-400 font-black">{confirmingProduct.price} Kredi</span> karşılığında satın almak istediğinizden emin misiniz?
                </p>
              </div>

              {/* Product Info Block */}
              <div className="bg-[#182035] border border-[#243250] rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="text-slate-500 block text-[9px] font-bold">SATIN ALINACAK</span>
                  <span className="font-extrabold text-slate-200">{confirmingProduct.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[9px] font-bold">KARTÜM BAKİYENİZ</span>
                  <span className="font-black text-sky-400">{user?.credits} Kredi</span>
                </div>
              </div>

              {/* Live Connection Status Check Indicator */}
              <div className={`p-3.5 rounded-2xl border text-left text-xs leading-relaxed flex items-start gap-2.5 transition-all ${
                isOnline 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/5 border-red-500/20 text-red-400 animate-pulse"
              }`}>
                {isOnline ? (
                  <>
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5 animate-bounce" />
                    <div>
                      <strong className="block text-[11px] font-black uppercase text-emerald-300">Sunucu Bağlantısı Aktif</strong>
                      Siparişiniz onaylandığı anda oyun sunucusundaki teslimat sistemi tarafından anında hesabınıza teslim edilecektir.
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <strong className="block text-[11px] font-black uppercase text-red-300">Sunucuda Değilsiniz!</strong>
                      Satın alım yapabilmek için Minecraft sunucusuna giriş yapmış olmalısınız. Mağaza sayfasındaki <strong>"Sunucuya Gir"</strong> butonuna basarak sunucu durumunuzu güncelleyebilirsiniz.
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingProduct(null)}
                  className="flex-1 py-3 bg-[#1b2236] hover:bg-[#25324e] text-slate-300 border border-[#2b3957]/55 text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => executePurchase(confirmingProduct)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Onayla ve Satın Al
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
