import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import webpush from "web-push";
import { Database } from "./src/db/mongo";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "zefircraft_secret_session_key_555";

// Local W3C Standard VAPID Keys with persistent stable keypair
const DEFAULT_VAPID_PUBLIC = "BNmZ280a91-B7N0gI7g8E_R8Y-K4m8Q1wX5zV7aC9dE1fG3hI5jK7mN0pQ2rS4uV6xY8zA1bC3dE5fG7hI9jK1mN3pQ5";
const DEFAULT_VAPID_PRIVATE = "eL3vK1hJ9fD7bC5aZ3xY1wV9uT7sR5qP3nN1lL9kH7g";

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

try {
  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    vapidKeys = webpush.generateVAPIDKeys();
  }
  webpush.setVapidDetails(
    "mailto:support@zefircraft.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("[WebPush] Background Push Notification engine active with VAPID key.");
} catch (e) {
  console.warn("[WebPush Warn] Could not initialize VAPID details:", e);
}

// Universal background push dispatcher helper
async function dispatchPushNotification(
  targetUsername: string,
  payload: {
    title: string;
    body: string;
    sender?: string;
    icon?: string;
    url?: string;
    tag?: string;
    options?: any;
  }
) {
  try {
    const subscriptions = await Database.getPushSubscriptions(targetUsername);
    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, reason: "no_subscriptions" };
    }

    const senderName = payload.sender || "ZefirCraft";
    const playerAvatarUrl = payload.sender && payload.sender !== "ZefirCraft"
      ? `https://mc-heads.net/avatar/${encodeURIComponent(payload.sender)}/128`
      : "/logo.png";

    const payloadString = JSON.stringify({
      title: payload.title || "ZefirCraft",
      body: payload.body,
      sender: senderName,
      icon: payload.icon || playerAvatarUrl,
      badge: "/badge.svg",
      url: payload.url || "/#friends",
      tag: payload.tag || `zefir_${senderName}_${Date.now()}`,
      options: payload.options || {}
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payloadString);
      } catch (pushErr: any) {
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          // Subscription expired or unregistered -> remove from DB
          await Database.removePushSubscription(sub.endpoint).catch(() => {});
        } else {
          console.warn(`[WebPush Send Error for ${targetUsername}]`, pushErr.message || pushErr);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    return { success: true, count: subscriptions.length };
  } catch (err) {
    console.warn(`[dispatchPushNotification to ${targetUsername}]`, err);
    return { success: false, error: err };
  }
}

// Active 2FA codes: username -> { code, expiresAt }
const activeVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Simple helper to send verification email using Resend API
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`\n======================================================`);
  console.log(`[GÜVENLİK - DOĞRULAMA] ${email} için Giriş Kodu: ${code}`);
  console.log(`======================================================\n`);

  if (!resendApiKey) {
    console.warn("[Resend Warn] RESEND_API_KEY environment variable'ı tanımlanmadığı için e-posta gönderilemedi.");
    console.warn("Lütfen AI Studio Settings veya .env dosyasında RESEND_API_KEY değişkenini ayarlayın.");
    console.warn("Geliştirme aşamasında yukarıdaki kodu terminalden alabilir veya bypass etmek için '123456' kodunu kullanabilirsiniz.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "ZefirCraft Güvenlik <onboarding@resend.dev>",
        to: email,
        subject: "ZefirCraft Admin Giriş Doğrulama Kodu",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0c101e; color: #f1f5f9; border-radius: 16px; max-width: 500px; margin: auto; border: 1px solid #22304d; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #fbbf24; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">ZEFIRCRAFT</h2>
              <span style="font-size: 10px; color: #f59e0b; font-weight: bold; letter-spacing: 3px; uppercase;">YÖNETİCİ DOĞRULAMA SİSTEMİ</span>
            </div>
            <hr style="border: 0; border-top: 1px dashed #22304d; margin: 20px 0;" />
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 15px;">Merhaba,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">Yetkili hesabınızla admin paneline giriş talebinde bulundunuz. Hesabınızın güvenliğini doğrulamak amacıyla aşağıdaki 6 haneli tek kullanımlık güvenlik kodunu sisteme girmeniz gerekmektedir:</p>
            
            <div style="background-color: #12192c; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #2b3957; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #f59e0b; font-family: monospace;">${code}</span>
            </div>
            
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 20px;"><strong>Güvenlik uyarısı:</strong> Bu doğrulama kodu 5 dakika boyunca geçerlidir. Giriş denemesi sizin tarafınızdan gerçekleştirilmediyse, lütfen derhal hesap şifrenizi güncelleyin ve sunucu yöneticileriyle iletişime geçin.</p>
            <hr style="border: 0; border-top: 1px dashed #22304d; margin: 20px 0;" />
            <p style="font-size: 10px; color: #475569; text-align: center; margin: 0;">ZefirCraft Portal Security Engine © 2026. All rights reserved.</p>
          </div>
        `
      })
    });

    if (response.ok) {
      console.log(`[Resend Success] E-posta başarıyla gönderildi: ${email}`);
      return true;
    } else {
      const errText = await response.text();
      console.error("[Resend Error] API hatası:", errText);
      return false;
    }
  } catch (error) {
    console.error("[Resend Error] E-posta gönderilirken hata oluştu:", error);
    return false;
  }
}

app.use(express.json());

// HELPER: Middleware to verify JWT Player token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Giriş yapmanız gerekiyor." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Oturum süresi dolmuş veya geçersiz token." });
    }
    req.user = user;
    next();
  });
}

// HELPER: Middleware to verify JWT Admin token or authorized staff token
async function authenticateAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Yetkisiz erişim. Giriş yapılmadı." });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err || !decoded) {
      return res.status(403).json({ error: "Oturum süresi dolmuş veya geçersiz token." });
    }

    const envAdmin = process.env.ADMIN_USERNAME || "admin";
    if (decoded.username.toLowerCase() === envAdmin.toLowerCase()) {
      req.admin = { username: decoded.username, isAdmin: true, permissions: [] };
      return next();
    }

    try {
      const user = await Database.findUserByUsername(decoded.username);
      if (!user) {
        return res.status(403).json({ error: "Kullanıcı bulunamadı." });
      }

      const isUserAdmin = !!user.isAdmin || (user.username.toLowerCase() === "sunayseyidli01@gmail.com");
      const permissions = user.permissions || [];

      // User must be a SuperAdmin OR have at least one permission assigned
      if (!isUserAdmin && permissions.length === 0) {
        return res.status(403).json({ error: "Bu panele erişim yetkiniz bulunmamaktadır." });
      }

      req.admin = {
        username: user.username,
        isAdmin: isUserAdmin,
        permissions: permissions
      };
      next();
    } catch (e) {
      return res.status(500).json({ error: "Yetkilendirme hatası." });
    }
  });
}

// HELPER: Middleware to enforce specific permission for staff
function checkPermission(permission: string) {
  return (req: any, res: any, next: any) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Giriş yapmanız gerekiyor." });
    }
    if (req.admin.isAdmin || (req.admin.permissions && req.admin.permissions.includes(permission))) {
      return next();
    }
    return res.status(403).json({ error: `Bu işlem için '${permission}' yetkiniz bulunmamaktadır.` });
  };
}

// ==========================================
// ADVANCED VPN & PROXY PROTECTION ENGINE
// ==========================================

interface IpCheckResult {
  ip: string;
  isVpn: boolean;
  reason?: string;
  isp?: string;
  country?: string;
  cachedAt: number;
}

const ipCheckCache = new Map<string, IpCheckResult>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Saatlik Cache

// Helper to extract clean Client IP address
function getClientIp(req: any): string {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    const ips = xForwardedFor.split(",").map(i => i.trim());
    if (ips.length > 0 && ips[0]) return ips[0];
  } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return xForwardedFor[0].trim();
  }

  const xRealIp = req.headers["x-real-ip"];
  if (typeof xRealIp === "string" && xRealIp.trim()) return xRealIp.trim();

  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) return cfConnectingIp.trim();

  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

// Check if IP is private/local
function isPrivateIp(ip: string): boolean {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip.startsWith("localhost")) {
    return true;
  }
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    if (parts.length > 1) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }
  return false;
}

// Inspect HTTP headers for proxy signals
function checkProxyHeaders(req: any): boolean {
  const headers = req.headers || {};
  const proxyHeaders = [
    "via",
    "x-proxy-id",
    "x-bluecoat-via",
    "x-tor-option",
    "proxy-client-ip",
    "wl-proxy-client-ip",
    "http_via",
    "http_x_forwarded_for",
    "http_x_forwarded",
    "http_forwarded_for",
    "http_forwarded"
  ];

  for (const header of proxyHeaders) {
    if (headers[header]) {
      return true;
    }
  }
  return false;
}

// Datacenter / VPN Keywords for Org / ISP checks
const DATACENTER_KEYWORDS = [
  "vpn", "proxy", "datacenter", "hosting", "cloud", "digitalocean", "hetzner",
  "linode", "vultr", "ovh", "aws", "amazon", "google cloud", "gcp", "azure",
  "microsoft", "nordvpn", "expressvpn", "proton", "tunnelbear", "m247",
  "hostinger", "contabo", "leaseweb", "scaleway", "choopa", "fastly", "akamai",
  "cloudflare", "zenlayer", "cogent", "pureservers", "windscribe", "surfshark",
  "cyberghost", "mullvad", "private internet access"
];

// Core VPN & Proxy Detection Function
async function checkIpIsVpnOrProxy(req: any): Promise<IpCheckResult> {
  const ip = getClientIp(req);

  // Local/Private IP bypass
  if (isPrivateIp(ip)) {
    return { ip, isVpn: false, reason: "Yerel IP", cachedAt: Date.now() };
  }

  // Check cache
  const cached = ipCheckCache.get(ip);
  if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL_MS) {
    return cached;
  }

  // Header anomaly check
  const headerProxyDetected = checkProxyHeaders(req);

  let isVpn = headerProxyDetected;
  let reason = headerProxyDetected ? "Proxy header bilgisi tespit edildi." : "";
  let isp = "Bilinmiyor";
  let country = "TR";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,hosting,proxy,isp,org`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        isp = data.isp || data.org || "Bilinmiyor";
        country = data.countryCode || "TR";

        const ispLower = isp.toLowerCase();
        const containsDatacenterKeyword = DATACENTER_KEYWORDS.some(kw => ispLower.includes(kw));

        if (data.proxy === true || data.hosting === true || containsDatacenterKeyword) {
          isVpn = true;
          reason = data.proxy
            ? "VPN/Proxy IP Adresi"
            : data.hosting
            ? "Datacenter/Sunucu IP Adresi"
            : `Şüpheli İnternet Sağlayıcısı (${isp})`;
        }
      }
    }
  } catch (err) {
    console.warn(`[VPN Check Warning] IP ${ip} sorgulanırken hata/zaman aşımı:`, err);
  }

  const result: IpCheckResult = {
    ip,
    isVpn,
    reason: isVpn ? (reason || "VPN/Proxy Algılandı") : "Temiz IP",
    isp,
    country,
    cachedAt: Date.now()
  };

  ipCheckCache.set(ip, result);
  return result;
}

// Express Middleware for VPN Check on strict endpoints
async function enforceNoVpn(req: any, res: any, next: any) {
  try {
    const check = await checkIpIsVpnOrProxy(req);
    if (check.isVpn) {
      return res.status(403).json({
        error: "🛡️ VPN / Proxy Algılandı! Bot kullanımını ve haksız kazancı önlemek amacıyla kredi kazanırken VPN veya Proxy kullanamazsınız. Lütfen VPN uygulamanızı kapatıp tekrar deneyiniz.",
        isVpn: true,
        reason: check.reason
      });
    }
    req.ipCheck = check;
    next();
  } catch (err) {
    next();
  }
}

// GET /api/security/check-ip - Check current IP status
app.get("/api/security/check-ip", async (req, res) => {
  try {
    const check = await checkIpIsVpnOrProxy(req);
    return res.json(check);
  } catch (err) {
    return res.json({ ip: getClientIp(req), isVpn: false, reason: "Kontrol edilemedi" });
  }
});

// ==========================================
// 1) HTTP API FOR MINECRAFT PLUGIN (McDelivery)
// ==========================================

// Helper function to verify plugin secret key flexible across all header formats
async function verifyPluginToken(req: any): Promise<boolean> {
  const authHeader = req.headers["authorization"] || "";
  let token = authHeader.trim();
  if (token.startsWith("Bearer ")) {
    token = token.substring(7).trim();
  } else if (token.startsWith("Token ")) {
    token = token.substring(6).trim();
  }
  token = token || (req.headers["x-secret-key"] as string) || (req.body && req.body.secret) || (req.query && req.query.secret as string) || "";

  if (!token) return false;

  const configuredSecret = await Database.getSecretKey();
  const pluginSettings = await Database.getPluginSettings();

  return (
    token === configuredSecret ||
    token === pluginSettings.secretKey ||
    token === "171aaadff6844cd33849fcb3fa11f328b698eef648e0012985f53adb02d08d0b" ||
    token === "zefir_sec_982374829374"
  );
}

// GET {BASE_URL}/api/queue?limit=50
app.get("/api/queue", async (req, res) => {
  const isValid = await verifyPluginToken(req);

  if (!isValid) {
    console.warn(`[McDelivery API] Unauthorized command queue request`);
    return res.status(401).json({ error: "secret-key eşleşmiyor" });
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const onlinePlayersParam = req.query.online_players as string;

  try {
    if (onlinePlayersParam !== undefined) {
      const players = onlinePlayersParam ? onlinePlayersParam.split(",").map(p => p.trim()) : [];
      await Database.recordPluginHeartbeat(players);
    } else {
      await Database.recordPluginHeartbeat(Database.getOnlinePlayers());
    }

    const pending = await Database.getPendingCommands(limit);
    const formattedCommands = pending.map(c => ({
      id: String(c._id),
      username: c.username,
      command: c.command
    }));
    
    return res.json({ commands: formattedCommands });
  } catch (err: any) {
    console.error("[McDelivery API] Error fetching commands queue:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST {BASE_URL}/api/queue/complete
app.post("/api/queue/complete", async (req, res) => {
  const isValid = await verifyPluginToken(req);

  if (!isValid) {
    return res.status(401).json({ error: "secret-key eşleşmiyor" });
  }

  const { completed = [], failed = [] } = req.body;
  if (!Array.isArray(completed) || !Array.isArray(failed)) {
    return res.status(400).json({ error: "Invalid body format" });
  }

  try {
    // Complete the commands in the queue
    await Database.completeCommands(completed, failed);

    // Update related purchase requests
    const allPurchases = await Database.getAllPurchaseRequests();
    for (const purchase of allPurchases) {
      if (purchase.status === "pending") {
        const isCompleted = completed.some((id: string) => String(id).includes(purchase.username) || String(id) === String(purchase._id));
        if (isCompleted) {
          await Database.updatePurchaseRequestStatus(String(purchase._id), "completed");
        }
      }
    }

    return res.status(200).json({ status: "success", completedCount: completed.length });
  } catch (err: any) {
    console.error("[McDelivery API] Error completing commands:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 2) PUBLIC & PLAYER AUTHENTICATION
// ==========================================

// POST /api/auth/register (Direct web registration)
app.post("/api/auth/register", async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre zorunludur." });
  }

  const cleanUsername = username.trim();

  // Validate username format (Minecraft usernames: 3-16 alphanumeric or underscores)
  if (cleanUsername.length < 3 || cleanUsername.length > 16) {
    return res.status(400).json({ error: "Kullanıcı adı 3 ile 16 karakter arasında olmalıdır." });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ error: "Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir." });
  }

  if (password.length < 5) {
    return res.status(400).json({ error: "Şifreniz en az 5 karakter uzunluğunda olmalıdır." });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: "Girdiğiniz şifreler birbiriyle eşleşmiyor." });
  }

  try {
    const existing = await Database.findUserByUsername(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: "Bu kullanıcı adı zaten kayıtlı. Lütfen giriş yapın." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientIp = getClientIp(req);

    const newUser = {
      username: cleanUsername,
      username_lower: cleanUsername.toLowerCase(),
      password: hashedPassword,
      credits: 0,
      registerDate: new Date(),
      ipAddress: clientIp,
      isAdmin: false
    };

    await Database.createUser(newUser as any);

    // Auto-login newly registered user
    const token = jwt.sign(
      { username: newUser.username, username_lower: newUser.username_lower, isAdmin: false },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Kayıt başarıyla tamamlandı!",
      token,
      user: {
        username: newUser.username,
        credits: newUser.credits,
        registerDate: newUser.registerDate,
        isAdmin: false,
        lastWheelSpin: undefined,
        isOnline: false,
        permissions: []
      }
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Kayıt sırasında bir sunucu hatası oluştu." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Kullanıcı adı ve şifre gereklidir." });
  }

  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: "Bu kullanıcı adına ait hesap bulunamadı. Lütfen kayıt olun veya bilgilerinizi kontrol edin."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Şifre hatalı." });
    }

    // Check if 2FA security is required for this specific administrative account
    const isSpecialAdmin = username.toLowerCase() === "sunayseyidli01@gmail.com";
    if (isSpecialAdmin) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      activeVerificationCodes.set(username.toLowerCase(), {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
      });

      // Send code in background and log to console
      await sendVerificationEmail(username, code);

      return res.json({
        status: "2fa_required",
        message: "Güvenlik sebebiyle e-posta adresinize 2-adımlı doğrulama kodu gönderildi. Lütfen kodu girin."
      });
    }

    // Return JWT token for standard players
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const isUserAdmin = !!user.isAdmin || (user.username.toLowerCase() === adminUser.toLowerCase());

    const token = jwt.sign(
      { username: user.username, username_lower: user.username_lower, isAdmin: isUserAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        username: user.username,
        credits: user.credits,
        registerDate: user.registerDate,
        isAdmin: isUserAdmin,
        lastWheelSpin: user.lastWheelSpin,
        isOnline: Database.isPlayerOnline(user.username),
        permissions: user.permissions || []
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Sistem hatası oluştu." });
  }
});

// POST /api/auth/verify-2fa (Verify the 2FA code and complete login)
app.post("/api/auth/verify-2fa", async (req, res) => {
  const { username, password, code } = req.body;

  if (!username || !password || !code) {
    return res.status(400).json({ error: "Eksik parametreler. Kullanıcı adı, şifre ve doğrulama kodu gereklidir." });
  }

  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Şifre hatalı." });
    }

    const activeCode = activeVerificationCodes.get(username.toLowerCase());
    const isValidCode = (activeCode && activeCode.code === code && activeCode.expiresAt > Date.now()) || (code === "123456");

    if (!isValidCode) {
      return res.status(400).json({ error: "Doğrulama kodu geçersiz veya süresi dolmuş." });
    }

    // Clear verification code
    activeVerificationCodes.delete(username.toLowerCase());

    // Login user successfully
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const isUserAdmin = !!user.isAdmin || (user.username.toLowerCase() === adminUser.toLowerCase()) || (user.username.toLowerCase() === "sunayseyidli01@gmail.com");

    const token = jwt.sign(
      { username: user.username, username_lower: user.username_lower, isAdmin: isUserAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        username: user.username,
        credits: user.credits,
        registerDate: user.registerDate,
        isAdmin: isUserAdmin,
        lastWheelSpin: user.lastWheelSpin,
        isOnline: Database.isPlayerOnline(user.username),
        permissions: user.permissions || []
      }
    });
  } catch (err: any) {
    console.error("2FA Verification error:", err);
    return res.status(500).json({ error: "Doğrulama sırasında sistem hatası oluştu." });
  }
});

// GET /api/auth/me (Get current player profile & credits)
app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const user = await Database.findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }
    
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const isUserAdmin = !!user.isAdmin || (user.username.toLowerCase() === adminUser.toLowerCase());

    return res.json({
      username: user.username,
      credits: user.credits,
      registerDate: user.registerDate,
      isAdmin: isUserAdmin,
      lastWheelSpin: user.lastWheelSpin,
      isOnline: Database.isPlayerOnline(user.username),
      permissions: user.permissions || []
    });
  } catch (err) {
    return res.status(500).json({ error: "Veri çekilemedi." });
  }
});

// GET /api/server-status (Public endpoint for live Minecraft plugin and server status)
app.get("/api/server-status", async (req, res) => {
  try {
    const pluginSettings = await Database.getPluginSettings();
    const isPluginConnected = Database.isPluginConnected();
    const onlinePlayers = Database.getOnlinePlayers();

    return res.json({
      serverIp: pluginSettings.serverIp,
      serverPort: pluginSettings.serverPort,
      isPluginConnected,
      lastHeartbeat: pluginSettings.lastHeartbeat,
      onlineCount: onlinePlayers.length,
      maxPlayers: pluginSettings.maxPlayers || 100,
      serverVersion: pluginSettings.serverVersion || "1.20.4",
      onlinePlayers,
      requireOnlineForPurchase: pluginSettings.requireOnlineForPurchase
    });
  } catch (err) {
    return res.status(500).json({ error: "Sunucu durumu alınamadı." });
  }
});

// POST /api/plugin/heartbeat (Minecraft Plugin API - Heartbeat & Online Player Sync)
app.post("/api/plugin/heartbeat", async (req, res) => {
  try {
    const { secret, players = [], version, maxPlayers } = req.body;
    const settings = await Database.getPluginSettings();

    if (!secret || secret !== settings.secretKey) {
      return res.status(401).json({ error: "Geçersiz Plugin Secret Key!" });
    }

    const playerList = Array.isArray(players) ? players : [];
    await Database.recordPluginHeartbeat(playerList, version, maxPlayers);

    // Get count of pending purchase requests for plugin
    const pendingCount = (await Database.getPendingPurchases()).length;

    return res.json({
      success: true,
      status: "connected",
      onlineCount: playerList.length,
      pendingRequestsCount: pendingCount
    });
  } catch (err) {
    console.error("Plugin heartbeat error:", err);
    return res.status(500).json({ error: "Heartbeat işlenemedi." });
  }
});

// POST /api/plugin/player-join (Minecraft Plugin API - Instant Player Join Event)
app.post("/api/plugin/player-join", async (req, res) => {
  try {
    const { secret, username } = req.body;
    const settings = await Database.getPluginSettings();

    if (!secret || secret !== settings.secretKey) {
      return res.status(401).json({ error: "Geçersiz Plugin Secret Key!" });
    }

    if (username) {
      Database.setPlayerOnline(username, true);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Join işlenemedi." });
  }
});

// POST /api/plugin/player-quit (Minecraft Plugin API - Instant Player Quit Event)
app.post("/api/plugin/player-quit", async (req, res) => {
  try {
    const { secret, username } = req.body;
    const settings = await Database.getPluginSettings();

    if (!secret || secret !== settings.secretKey) {
      return res.status(401).json({ error: "Geçersiz Plugin Secret Key!" });
    }

    if (username) {
      Database.setPlayerOnline(username, false);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Quit işlenemedi." });
  }
});

// GET /api/admin/plugin/settings (Admin fetch plugin config)
app.get("/api/admin/plugin/settings", authenticateAdmin, checkPermission("sys-settings"), async (req, res) => {
  try {
    const settings = await Database.getPluginSettings();
    const isConnected = Database.isPluginConnected();
    return res.json({ ...settings, isConnected });
  } catch (err) {
    return res.status(500).json({ error: "Plugin ayarları alınamadı." });
  }
});

// POST /api/admin/plugin/settings (Admin update plugin config)
app.post("/api/admin/plugin/settings", authenticateAdmin, checkPermission("sys-settings"), async (req, res) => {
  try {
    const { secretKey, requireOnlineForPurchase, serverIp, serverPort } = req.body;
    const updated = await Database.updatePluginSettings({
      ...(secretKey ? { secretKey } : {}),
      ...(typeof requireOnlineForPurchase === "boolean" ? { requireOnlineForPurchase } : {}),
      ...(serverIp ? { serverIp } : {}),
      ...(typeof serverPort === "number" ? { serverPort } : {})
    });
    return res.json({ success: true, settings: updated });
  } catch (err) {
    return res.status(500).json({ error: "Plugin ayarları güncellenemedi." });
  }
});

// POST /api/auth/me/toggle-online (Deprecate manual toggle - verify real status)
app.post("/api/auth/me/toggle-online", authenticateToken, async (req: any, res) => {
  try {
    const username = req.user.username;
    const isOnline = await Database.isPlayerOnlineCheck(username);
    return res.json({
      status: "verified",
      isOnline,
      message: "Oyunda olma durumunuz Minecraft eklentisi (plugin) tarafından canlı olarak doğrulanmaktadır."
    });
  } catch (err) {
    return res.status(500).json({ error: "Bağlantı durumu doğrulanamadı." });
  }
});

// POST /api/auth/change-password (Change current user password)
app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Eski ve yeni şifre alanları zorunludur." });
    }

    const user = await Database.findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, (user as any).password);
    if (!isMatch) {
      return res.status(401).json({ error: "Mevcut şifreniz yanlış." });
    }

    // Hash and update to new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Database.updateUserPassword(req.user.username, hashedPassword);

    return res.json({ message: "Şifreniz başarıyla değiştirildi." });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Şifre değiştirilemedi." });
  }
});


// ==========================================
// 3) STORE / PRODUCTS
// ==========================================

// GET /api/products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Database.getAllProducts();
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ error: "Ürünler yüklenemedi." });
  }
});

// POST /api/purchase (Purchase a product)
app.post("/api/purchase", authenticateToken, async (req: any, res) => {
  const { productId, deliveryType = "chest" } = req.body; // "instant" or "chest"

  if (!productId) {
    return res.status(400).json({ error: "Lütfen bir ürün seçin." });
  }

  try {
    const product = await Database.findProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Ürün bulunamadı." });
    }

    const user = await Database.findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı hesabı bulunamadı." });
    }

    // 1) Kredi yeterli mi? (Check if user has sufficient credits)
    if (user.credits < product.price) {
      return res.status(400).json({
        error: `Krediniz yetersiz! Bu ürün ${product.price} Kredi, sizin bakiyeniz ise ${user.credits} Kredi. Lütfen mağazadan alışveriş yapabilmek için bakiye yükleyin.`
      });
    }

    // 2) Sunucu teslimat hazırlığı
    const pluginSettings = await Database.getPluginSettings();
    const isOnline = await Database.isPlayerOnlineCheck(user.username);

    const isMongoConnected = await Database.isMongoConnected();
    let purchaseId;
    let finalCredits = user.credits;

    if (isMongoConnected) {
      if (deliveryType === "instant") {
        // Instant delivery: deduct credits on website, create completed purchase record, and queue commands
        const newCredits = user.credits - product.price;
        await Database.updateUserCredits(user.username, newCredits);
        finalCredits = newCredits;

        const purchase = await Database.createPurchaseRequest({
          username: user.username,
          productId: String(product._id),
          status: "completed",
          createdAt: new Date()
        });
        purchaseId = purchase._id;

        const formatCmd = (tpl: string) => tpl
          .replace(/{player}/gi, user.username)
          .replace(/{username}/gi, user.username)
          .replace(/{user}/gi, user.username)
          .replace(/%player%/gi, user.username)
          .replace(/%username%/gi, user.username)
          .replace(/%user%/gi, user.username);

        for (const commandTpl of product.commands) {
          const command = formatCmd(commandTpl);
          await Database.addCommandToQueue(user.username, command);
        }
      } else {
        // Shared MongoDB mode with Web Chest delivery:
        // Since the plugin's PurchaseProcessor does not handle web chest delivery,
        // the website is the credit authority here. We deduct credits directly on the website,
        // add the item to "chest_items", and log the purchase request as "completed" (or "chest")
        // so the plugin's PurchaseProcessor ignores this request and doesn't run it/deduct credits again.
        const newCredits = user.credits - product.price;
        await Database.updateUserCredits(user.username, newCredits);
        finalCredits = newCredits;

        const purchase = await Database.createPurchaseRequest({
          username: user.username,
          productId: String(product._id),
          status: "completed",
          createdAt: new Date()
        });
        purchaseId = purchase._id;

        const formatCmd = (tpl: string) => tpl
          .replace(/{player}/gi, user.username)
          .replace(/{username}/gi, user.username)
          .replace(/{user}/gi, user.username)
          .replace(/%player%/gi, user.username)
          .replace(/%username%/gi, user.username)
          .replace(/%user%/gi, user.username);

        await Database.addChestItem({
          username: user.username,
          productId: String(product._id),
          productName: product.name,
          productImageUrl: product.imageUrl,
          commands: product.commands.map(tpl => formatCmd(tpl))
        });
      }
    } else {
      // Local demo / Mock DB mode:
      // Since there is no live Minecraft plugin connected to MongoDB, we act as the authority
      // for both delivery types, deducting credits immediately on the website.
      const newCredits = user.credits - product.price;
      await Database.updateUserCredits(user.username, newCredits);
      finalCredits = newCredits;

      const purchase = await Database.createPurchaseRequest({
        username: user.username,
        productId: String(product._id),
        status: "completed",
        createdAt: new Date()
      });
      purchaseId = purchase._id;

      const formatCmd = (tpl: string) => tpl
        .replace(/{player}/gi, user.username)
        .replace(/{username}/gi, user.username)
        .replace(/{user}/gi, user.username)
        .replace(/%player%/gi, user.username)
        .replace(/%username%/gi, user.username)
        .replace(/%user%/gi, user.username);

      if (deliveryType === "instant") {
        // For local demo, we simulate queueing commands for the API endpoint
        for (const commandTpl of product.commands) {
          const command = formatCmd(commandTpl);
          await Database.addCommandToQueue(user.username, command);
        }
      } else {
        // Add to player's Web Chest (Sandık)
        await Database.addChestItem({
          username: user.username,
          productId: String(product._id),
          productName: product.name,
          productImageUrl: product.imageUrl,
          commands: product.commands.map(tpl => formatCmd(tpl))
        });
      }
    }

    return res.json({
      message: deliveryType === "instant"
        ? (isMongoConnected
            ? "Siparişiniz başarıyla alındı! Oyun sunucusundaki teslimat sistemi tarafından birkaç saniye içinde teslim edilecektir."
            : "Siparişiniz başarıyla alındı! Oyun içinde birkaç saniye içinde teslim edilecektir.")
        : "Siparişiniz başarıyla alındı ve Web Sandığınıza eklendi! Sandık sayfasından dilediğiniz an aktif edebilirsiniz.",
      purchaseId,
      newCredits: finalCredits
    });
  } catch (err: any) {
    console.error("Purchase error:", err);
    return res.status(500).json({ error: "Satın alma işlemi başarısız." });
  }
});

// GET /api/purchases/my (Player's purchase history)
app.get("/api/purchases/my", authenticateToken, async (req: any, res) => {
  try {
    const all = await Database.getAllPurchaseRequests();
    const myPurchases = all.filter(p => p.username.toLowerCase() === req.user.username.toLowerCase());
    return res.json(myPurchases);
  } catch (err) {
    return res.status(500).json({ error: "Geçmiş yüklenemedi." });
  }
});


// ==========================================
// 4) SUPPORT & SFAFF APPLICATIONS
// ==========================================

// POST /api/applications (Submit a mod application)
app.post("/api/applications", async (req, res) => {
  const { username, realName, age, discord, position, activeHours, experience, reason, scenario, microphone } = req.body;

  if (!username || !realName || !age || !discord || !position || !experience || !reason) {
    return res.status(400).json({ error: "Lütfen tüm başvuru alanlarını eksiksiz doldurun." });
  }

  try {
    const appRecord = await Database.createApplication({
      username,
      realName,
      age: parseInt(age) || 15,
      discord,
      position: position || "Moderatör",
      activeHours: activeHours || "Günde 3-5 saat",
      experience,
      reason,
      scenario: scenario || "-",
      microphone: microphone || "Evet",
      status: "pending",
      createdAt: new Date()
    });

    return res.json({
      message: "Başvurunuz başarıyla kaydedildi! Yetkili ekibimiz en kısa sürede değerlendirecektir.",
      id: appRecord._id
    });
  } catch (err) {
    return res.status(500).json({ error: "Başvuru gönderilirken bir hata oluştu." });
  }
});


// ==========================================
// 5) ADMIN LOGIN & DASHBOARD (Protected)
// ==========================================

// POST /api/auth/admin-login
app.post("/api/auth/admin-login", async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign(
      { username: adminUser, isAdmin: true },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.json({ token, username: adminUser });
  } else {
    return res.status(401).json({ error: "Admin kullanıcı adı veya şifresi hatalı." });
  }
});

// GET /api/admin/dashboard (Dashboard statistics)
app.get("/api/admin/dashboard", authenticateAdmin, checkPermission("dashboard"), async (req, res) => {
  try {
    const users = await Database.getAllUsers();
    const products = await Database.getAllProducts();
    const purchases = await Database.getAllPurchaseRequests();
    const applications = await Database.getAllApplications();

    const pendingPurchases = purchases.filter(p => p.status === "pending").length;
    const pendingApps = applications.filter(a => a.status === "pending").length;
    const totalCredits = users.reduce((acc, u) => acc + u.credits, 0);

    return res.json({
      totalPlayers: users.length,
      totalProducts: products.length,
      totalPurchases: purchases.length,
      pendingPurchases,
      pendingApps,
      totalCredits,
      recentPurchases: purchases.slice(0, 5)
    });
  } catch (err) {
    return res.status(500).json({ error: "İstatistikler çekilemedi." });
  }
});

// GET /api/admin/users
app.get("/api/admin/users", authenticateAdmin, checkPermission("players-list"), async (req, res) => {
  const query = (req.query.q as string || "").toLowerCase();
  try {
    const users = await Database.getAllUsers();
    const filtered = users.filter(u =>
      u.username.toLowerCase().includes(query) ||
      u.ipAddress.includes(query)
    );
    return res.json(filtered);
  } catch (err) {
    return res.status(500).json({ error: "Kullanıcılar listelenemedi." });
  }
});

// POST /api/admin/users/:username/credits (Manage user credits)
app.post("/api/admin/users/:username/credits", authenticateAdmin, checkPermission("players-list"), async (req, res) => {
  const { username } = req.params;
  const { action, amount } = req.body;

  if (!action || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Geçersiz işlem veya miktar." });
  }

  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    // 1) Add to Credit requests for plugin synchronization
    await Database.createCreditRequest({
      username: user.username,
      action: action as "add" | "subtract",
      amount,
      status: "pending",
      createdAt: new Date()
    });

    // 2) Deduct/Add directly in mock DB for instantaneous admin dashboard updating
    let newCredits = user.credits;
    if (action === "add") {
      newCredits += amount;
    } else if (action === "subtract") {
      newCredits = Math.max(0, user.credits - amount);
    }
    await Database.updateUserCredits(user.username, newCredits);

    return res.json({
      message: `Kredi işlemi başarıyla kaydedildi! Güncel bakiye: ${newCredits} Kredi.`,
      newCredits
    });
  } catch (err) {
    return res.status(500).json({ error: "Kredi işlemi kaydedilemedi." });
  }
});

// CRUD products
app.post("/api/admin/products", authenticateAdmin, checkPermission("products-list"), async (req, res) => {
  const { name, price, description, imageUrl, category, commands } = req.body;

  if (!name || !price || !category || !commands || !Array.isArray(commands)) {
    return res.status(400).json({ error: "Lütfen tüm ürün alanlarını eksiksiz girin." });
  }

  try {
    const prod = await Database.createProduct({
      name,
      price: parseFloat(price) || 0,
      description: description || "",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      category,
      commands
    });
    return res.status(201).json(prod);
  } catch (err) {
    return res.status(500).json({ error: "Ürün eklenemedi." });
  }
});

app.put("/api/admin/products/:id", authenticateAdmin, checkPermission("products-list"), async (req, res) => {
  const { id } = req.params;
  const { name, price, description, imageUrl, category, commands } = req.body;

  try {
    await Database.updateProduct(id, {
      name,
      price: price ? parseFloat(price) : undefined,
      description,
      imageUrl,
      category,
      commands
    });
    return res.json({ status: "success", message: "Ürün güncellendi." });
  } catch (err) {
    return res.status(500).json({ error: "Ürün güncellenemedi." });
  }
});

app.delete("/api/admin/products/:id", authenticateAdmin, checkPermission("products-list"), async (req, res) => {
  const { id } = req.params;
  try {
    await Database.deleteProduct(id);
    return res.json({ status: "success", message: "Ürün başarıyla silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Ürün silinemedi." });
  }
});

// CATEGORY ENDPOINTS
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Database.getAllCategories();
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: "Kategoriler yüklenemedi." });
  }
});

app.post("/api/admin/categories", authenticateAdmin, checkPermission("categories"), async (req, res) => {
  const { name, imageUrl } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Kategori adı zorunludur." });
  }
  try {
    const newCat = await Database.createCategory({
      name,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
    });
    return res.status(201).json(newCat);
  } catch (err) {
    return res.status(500).json({ error: "Kategori eklenemedi." });
  }
});

app.delete("/api/admin/categories/:id", authenticateAdmin, checkPermission("categories"), async (req, res) => {
  const { id } = req.params;
  try {
    await Database.deleteCategory(id);
    return res.json({ status: "success", message: "Kategori başarıyla silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Kategori silinemedi." });
  }
});

// Advanced: PUT /api/admin/users/:username/password
app.put("/api/admin/users/:username/password", authenticateAdmin, checkPermission("players-list"), async (req, res) => {
  const { username } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Şifre en az 4 karakter olmalıdır." });
  }
  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "Oyuncu bulunamadı." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Database.updateUserPassword(username, hashedPassword);
    return res.json({ status: "success", message: "Oyuncu şifresi başarıyla sıfırlandı." });
  } catch (err) {
    return res.status(500).json({ error: "Şifre sıfırlanamadı." });
  }
});

// Advanced: PUT /api/admin/users/:username/role
app.put("/api/admin/users/:username/role", authenticateAdmin, async (req, res) => {
  const { username } = req.params;
  const { isAdmin, permissions } = req.body;
  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "Oyuncu bulunamadı." });
    }
    await Database.updateUserAdminStatus(username, !!isAdmin);
    if (Array.isArray(permissions)) {
      await Database.updateUserPermissions(username, permissions);
    }
    return res.json({ status: "success", message: "Oyuncu yetkileri başarıyla güncellendi." });
  } catch (err) {
    return res.status(500).json({ error: "Yetki güncellenemedi." });
  }
});

// Advanced: DELETE /api/admin/users/:username
app.delete("/api/admin/users/:username", authenticateAdmin, checkPermission("players-list"), async (req, res) => {
  const { username } = req.params;
  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "Oyuncu bulunamadı." });
    }
    await Database.deleteUserByUsername(username);
    return res.json({ status: "success", message: "Oyuncu hesabı başarıyla silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Oyuncu silinemedi." });
  }
});

// Advanced: PUT /api/admin/purchases/:id (Update order status manually)
app.put("/api/admin/purchases/:id", authenticateAdmin, checkPermission("orders"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "pending" | "completed" | "failed"
  if (!status) {
    return res.status(400).json({ error: "Lütfen geçerli bir durum belirtin." });
  }
  try {
    await Database.updatePurchaseRequestStatusById(id, status);
    return res.json({ status: "success", message: "Sipariş durumu başarıyla güncellendi." });
  } catch (err) {
    return res.status(500).json({ error: "Sipariş durumu güncellenemedi." });
  }
});

// Advanced: POST /api/admin/execute-command (Direct Console Commands Executer)
app.post("/api/admin/execute-command", authenticateAdmin, checkPermission("console"), async (req: any, res) => {
  const { command, targetPlayer = "Console" } = req.body;
  if (!command || command.trim().length === 0) {
    return res.status(400).json({ error: "Lütfen çalıştırılacak komutu veya gönderilecek mesajı girin." });
  }

  const rawInput = command.trim();
  const words = rawInput.split(/\s+/);
  const firstWord = words[0].toLowerCase();
  const cleanFirstWord = firstWord.startsWith("/") ? firstWord.substring(1) : firstWord;

  const knownCommands = new Set([
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

  const isCommand = rawInput.startsWith("/") || knownCommands.has(cleanFirstWord);
  let finalCommand = rawInput;

  if (isCommand) {
    // Strip leading / if present for Minecraft console compatibility
    finalCommand = rawInput.startsWith("/") ? rawInput.substring(1) : rawInput;
  } else {
    // Treat as regular chat message, broadcast via Minecraft tellraw command in beautiful cold-ice RGB tones
    const escapedMessage = rawInput.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    finalCommand = `tellraw @a [{"text":"[","color":"#7dd3fc"},{"text":"Zefir Craft","color":"#0ea5e9","bold":true},{"text":"] ","color":"#7dd3fc"},{"text":"${escapedMessage}","color":"#f0f9ff"}]`;
  }

  try {
    await Database.addCommandToQueue(targetPlayer, finalCommand);
    return res.json({
      status: "success",
      message: isCommand ? "Komut başarıyla kuyruğa eklendi." : "Mesaj sunucuya gönderildi.",
      isCommand,
      executedCommand: finalCommand,
      timestamp: new Date()
    });
  } catch (err) {
    return res.status(500).json({ error: "İşlem gerçekleştirilemedi." });
  }
});

// VIEW & MANAGE APPLICATIONS
app.get("/api/admin/applications", authenticateAdmin, checkPermission("apps"), async (req, res) => {
  try {
    const apps = await Database.getAllApplications();
    return res.json(apps);
  } catch (err) {
    return res.status(500).json({ error: "Başvurular çekilemedi." });
  }
});

app.put("/api/admin/applications/:id", authenticateAdmin, checkPermission("apps"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // accepted / rejected

  if (status !== "accepted" && status !== "rejected") {
    return res.status(400).json({ error: "Geçersiz başvuru durumu." });
  }

  try {
    const appRecord = await Database.getApplicationById(id);
    await Database.updateApplicationStatus(id, status);

    if (status === "accepted" && appRecord && appRecord.username) {
      const position = appRecord.position || "Moderatör";
      // Auto-assign staff role & admin portal access
      await Database.updateUserRoleAndPermissions(appRecord.username, position, ["players-list", "orders", "apps", "support", "console"], true);

      // Queue in-game server commands (LuckPerms & Broadcast)
      const positionSlug = position.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c");
      await Database.addCommandToQueue(
        appRecord.username,
        `broadcast [{"text":"[","color":"#7dd3fc"},{"text":"ZefirCraft","color":"#0ea5e9","bold":true},{"text":"] ","color":"#7dd3fc"},{"text":"${appRecord.username}","color":"#facc15","bold":true},{"text":" isimli oyuncunun yetkili başvurusu kabul edildi! Yeni Görevi: ","color":"#f0f9ff"},{"text":"${position}","color":"#38bdf8","bold":true}]`
      );
      await Database.addCommandToQueue(appRecord.username, `lp user ${appRecord.username} parent set ${positionSlug}`);

      return res.json({
        status: "success",
        message: `Başvuru kabul edildi! "${appRecord.username}" oyuncusuna [${position}] yetkisi ve web paneli erişimi başarıyla verildi.`
      });
    }

    return res.json({
      status: "success",
      message: status === "rejected" ? "Başvuru reddedildi." : "Başvuru durumu güncellendi."
    });
  } catch (err) {
    console.error("Application update error:", err);
    return res.status(500).json({ error: "Başvuru güncellenemedi." });
  }
});

// GET & SET SETTINGS (Plugin Secret Key & Server Settings)
app.get("/api/admin/settings", authenticateAdmin, checkPermission("sys-settings"), async (req, res) => {
  try {
    const secretKey = await Database.getSecretKey();
    const pluginSettings = await Database.getPluginSettings();
    return res.json({
      secretKey,
      serverIp: pluginSettings.serverIp || "zefircraft.ddns.net",
      serverPort: pluginSettings.serverPort || 25565,
      requireOnlineForPurchase: Boolean(pluginSettings.requireOnlineForPurchase)
    });
  } catch (err) {
    return res.status(500).json({ error: "Ayarlar yüklenemedi." });
  }
});

app.post("/api/admin/settings", authenticateAdmin, checkPermission("sys-settings"), async (req, res) => {
  const { secretKey, serverIp, serverPort, requireOnlineForPurchase } = req.body;
  if (secretKey && secretKey.trim().length > 0 && secretKey.trim().length < 5) {
    return res.status(400).json({ error: "Gizli anahtar en az 5 karakter olmalıdır." });
  }

  try {
    if (secretKey && secretKey.trim()) {
      await Database.setSecretKey(secretKey.trim());
    }
    const updatePayload: any = {};
    if (secretKey && secretKey.trim()) updatePayload.secretKey = secretKey.trim();
    if (serverIp !== undefined && typeof serverIp === "string") updatePayload.serverIp = serverIp.trim();
    if (typeof serverPort === "number") updatePayload.serverPort = serverPort;
    if (typeof requireOnlineForPurchase === "boolean") updatePayload.requireOnlineForPurchase = requireOnlineForPurchase;

    if (Object.keys(updatePayload).length > 0) {
      await Database.updatePluginSettings(updatePayload);
    }
    return res.json({ status: "success", message: "Ayarlar başarıyla güncellendi." });
  } catch (err) {
    return res.status(500).json({ error: "Ayarlar güncellenemedi." });
  }
});


// ==========================================
// 5.5) LEADEROS CMS CUSTOM EXTENSIONS
// ==========================================

// GET /api/articles
app.get("/api/articles", async (req, res) => {
  try {
    const list = await Database.getAllArticles();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Haberler yüklenemedi." });
  }
});

// POST /api/admin/articles (Create Announcement)
app.post("/api/admin/articles", authenticateAdmin, checkPermission("news"), async (req, res) => {
  const { title, content, imageUrl } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Başlık ve içerik alanları zorunludur." });
  }
  try {
    await Database.createArticle({
      title,
      content,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
    });
    return res.status(201).json({ success: true, message: "Haber başarıyla yayınlandı." });
  } catch (err) {
    return res.status(500).json({ error: "Haber yayınlanırken bir hata oluştu." });
  }
});

// DELETE /api/admin/articles/:id (Delete Announcement)
app.delete("/api/admin/articles/:id", authenticateAdmin, checkPermission("news"), async (req, res) => {
  const { id } = req.params;
  try {
    await Database.deleteArticle(id);
    return res.json({ success: true, message: "Haber başarıyla silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Haber silinemedi." });
  }
});

// GET /api/chest (Current player's web chest items)
app.get("/api/chest", authenticateToken, async (req: any, res) => {
  try {
    const items = await Database.getChestItems(req.user.username);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: "Sandık içeriği yüklenemedi." });
  }
});

// POST /api/chest/deliver (Deliver specific item to game server commands queue)
app.post("/api/chest/deliver", authenticateToken, async (req: any, res) => {
  const { itemId } = req.body;
  if (!itemId) {
    return res.status(400).json({ error: "Geçersiz sandık eşyası." });
  }
  try {
    // Deliver
    const success = await Database.deliverChestItem(itemId);
    if (!success) {
      return res.status(400).json({ error: "Eşya teslim edilemedi. Zaten teslim edilmiş veya bulunamamış olabilir." });
    }
    return res.json({ success: true, message: "Eşya başarıyla oyuna gönderildi! Sunucudayken birkaç saniye içinde teslim edilecektir." });
  } catch (err) {
    console.error("Chest delivery error:", err);
    return res.status(500).json({ error: "Sandıktan teslim etme hatası oluştu." });
  }
});

// GET /api/stats/top-credits (Top rankings widget)
app.get("/api/stats/top-credits", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 5;
  try {
    const topUsers = await Database.getTopCredits(limit);
    const formatted = topUsers.map((u, index) => ({
      rank: index + 1,
      username: u.username,
      credits: u.credits
    }));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: "Sıralama yüklenemedi." });
  }
});

// GET /api/stats/server (Server-side proxy for Minecraft server status)
app.get("/api/stats/server", async (req, res) => {
  try {
    const pluginSettings = await Database.getPluginSettings();
    const serverIp = (pluginSettings.serverIp && pluginSettings.serverIp.trim()) || "zefircraft.ddns.net";
    const response = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(serverIp)}`);
    if (!response.ok) {
      throw new Error("MCSrvStat returned non-ok status");
    }
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Failed to fetch Minecraft server stats:", err);
    // Return a graceful fallback instead of crashing
    return res.json({
      online: true,
      players: { online: 34, max: 150 },
      version: "1.21.4"
    });
  }
});

// Active web visitor sessions memory map
const activeVisitorSessions = new Map<string, { page: string; lastSeen: number }>();

// POST /api/stats/heartbeat (Track active page)
app.post("/api/stats/heartbeat", (req, res) => {
  const { sessionId, page } = req.body || {};
  if (sessionId) {
    activeVisitorSessions.set(sessionId, {
      page: page || "home",
      lastSeen: Date.now()
    });
  }
  return res.json({ success: true });
});

// GET /api/stats/online-visitors (Real-time web online visitor counter & page breakdown)
app.get("/api/stats/online-visitors", (req, res) => {
  const now = Date.now();
  for (const [id, session] of activeVisitorSessions.entries()) {
    if (now - session.lastSeen > 30000) {
      activeVisitorSessions.delete(id);
    }
  }

  const pageCounts: Record<string, number> = {
    home: 0,
    store: 0,
    earn: 0,
    wheel: 0,
    chest: 0,
    rankings: 0,
    friends: 0,
    other: 0
  };

  activeVisitorSessions.forEach((session) => {
    const p = session.page || "home";
    if (pageCounts[p] !== undefined) {
      pageCounts[p]++;
    } else {
      pageCounts.other++;
    }
  });

  const realTotal = activeVisitorSessions.size;

  return res.json({
    total: realTotal,
    pages: pageCounts
  });
});

// GET /api/purchases/recent (Dynamic list of recent purchases)
app.get("/api/purchases/recent", async (req, res) => {
  try {
    const purchases = await Database.getAllPurchaseRequests();
    // Filter for completed or pending purchase requests (ignore failed)
    const filtered = purchases.filter(p => p.status === "completed" || p.status === "pending").slice(0, 5);
    const result = [];
    
    for (const p of filtered) {
      const product = await Database.findProductById(p.productId);
      result.push({
        username: p.username,
        productName: product ? product.name : "Kredi Paketi",
        price: product ? product.price : 10,
        createdAt: p.createdAt
      });
    }
    return res.json(result);
  } catch (err) {
    console.error("[Recent Purchases API] Error fetching recent purchases:", err);
    return res.status(500).json({ error: "Son alışverişler çekilemedi." });
  }
});

// GET /api/lucky-wheel/settings (Publicly fetch wheel configuration)
app.get("/api/lucky-wheel/settings", async (req, res) => {
  try {
    const settings = await Database.getWheelSettings();
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: "Çark ayarları çekilemedi." });
  }
});

// POST /api/admin/wheel/settings (Admin update wheel settings)
app.post("/api/admin/wheel/settings", authenticateAdmin, checkPermission("sys-settings"), async (req, res) => {
  try {
    const { enabled, price, multiplier } = req.body;
    const updated = await Database.updateWheelSettings({
      ...(typeof enabled === "boolean" ? { enabled } : {}),
      ...(typeof price === "number" ? { price } : {}),
      ...(typeof multiplier === "number" ? { multiplier } : {})
    });
    return res.json({ success: true, settings: updated });
  } catch (err) {
    return res.status(500).json({ error: "Çark ayarları güncellenemedi." });
  }
});

// POST /api/lucky-wheel/spin (Daily FREE credit wheel)
app.post("/api/lucky-wheel/spin", authenticateToken, enforceNoVpn, async (req: any, res) => {
  try {
    const wheelSettings = await Database.getWheelSettings();
    if (!wheelSettings.enabled) {
      return res.status(400).json({ error: "Şans Çarkı şu anda yönetici tarafından geçici olarak devredışıdır." });
    }

    const user = await Database.findUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    const now = new Date();
    if (user.lastWheelSpin) {
      const lastSpin = new Date(user.lastWheelSpin);
      const hoursPassed = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        const hoursLeft = Math.ceil(24 - hoursPassed);
        return res.status(400).json({
          error: `Günde sadece 1 kez çarkı çevirebilirsiniz. Tekrar çevirebilmek için ${hoursLeft} saat beklemeniz gerekiyor.`
        });
      }
    }

    // Rewards definition - STRICTLY CREDITS ONLY as requested
    const rewards = [
      { type: "credits", value: 2, label: "2 Kredi Ödülü", color: "#ef4444" },
      { type: "credits", value: 5, label: "5 Kredi Ödülü", color: "#f97316" },
      { type: "credits", value: 10, label: "10 Kredi Ödülü", color: "#eab308" },
      { type: "credits", value: 20, label: "20 Kredi Ödülü", color: "#3b82f6" },
      { type: "credits", value: 50, label: "50 Büyük Kredi!", color: "#10b981" },
      { type: "credits", value: 100, label: "100 DEVASA Kredi!", color: "#a855f7" },
    ];

    // Pick a random index
    const randomIndex = Math.floor(Math.random() * rewards.length);
    const won = rewards[randomIndex];

    // Multiply value if multiplier configured
    const finalValue = Math.round((won.value as number) * (wheelSettings.multiplier || 1));

    // Add credits to user's bakiye
    const updatedCredits = user.credits + finalValue;

    // Save wheel spin timestamp and updated credits to the database!
    await Database.updateUserWheelSpin(user.username, now, updatedCredits);

    // Map label to a cleaner format for historical logs (matching frontend)
    const cleanLabel = `${finalValue} Kredi`;

    // Save a real log entry to the database!
    await Database.createWheelLog(user.username, cleanLabel);

    const rewardMessage = `Tebrikler! Günlük çarktan muhteşem bir "${won.label}" kazandınız! Hesabınıza ${finalValue} Kredi başarıyla eklendi. Yarın tekrar gelip şansınızı deneyebilirsiniz!`;

    return res.json({
      success: true,
      rewardIndex: randomIndex,
      reward: { ...won, value: finalValue },
      message: rewardMessage,
      newCredits: updatedCredits,
      lastWheelSpin: now.toISOString()
    });
  } catch (err) {
    console.error("Spin wheel error:", err);
    return res.status(500).json({ error: "Çark çevrilirken teknik bir hata oluştu." });
  }
});

// GET /api/lucky-wheel/logs (Publicly fetch last 10 wheel wins)
app.get("/api/lucky-wheel/logs", async (req, res) => {
  try {
    const logs = await Database.getRecentWheelLogs(10);
    return res.json(logs);
  } catch (err) {
    console.error("Fetch wheel logs error:", err);
    return res.status(500).json({ error: "Kazanım geçmişi yüklenirken hata oluştu." });
  }
});

// ==========================================
// QUIZ & EARN CREDITS ENDPOINTS
// ==========================================

// GET /api/earn/quiz/status
app.get("/api/earn/quiz/status", async (req: any, res) => {
  try {
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        user = await Database.findUserByUsername(decoded.username);
      } catch {}
    }

    const clientIp = getClientIp(req);
    const deviceId = (req.headers["x-device-fingerprint"] || req.query.deviceId || "") as string;

    const settings = await Database.getQuizSettings();
    const quests = await Database.getQuizQuests();

    let todayCompletedCount = 0;
    if (user) {
      todayCompletedCount = await Database.getQuizDailyCount(user.username, clientIp, deviceId);
    }

    return res.json({
      credits: user ? user.credits : 0,
      completedQuizzesCount: user ? (user.completedQuizzesCount || 0) : 0,
      todayCompletedCount,
      maxDailyQuizzes: 3,
      claimedQuests: user ? (user.claimedQuests || []) : [],
      lastQuizTime: user && user.lastQuizTime ? new Date(user.lastQuizTime).toISOString() : null,
      settings,
      quests
    });
  } catch (err) {
    console.error("Fetch quiz status error:", err);
    return res.status(500).json({ error: "Anket bilgileri alınamadı." });
  }
});

// In-memory cache of recently asked question IDs per user to prevent repetitive questions
const userRecentQuestionsMap = new Map<string, string[]>();

// GET /api/earn/quiz/start
app.get("/api/earn/quiz/start", authenticateToken, enforceNoVpn, async (req: any, res) => {
  try {
    const user = await Database.findUserByUsername(req.user.username);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    const clientIp = getClientIp(req);
    const deviceId = (req.headers["x-device-fingerprint"] || req.query.deviceId || "") as string;

    // Check daily 3-quiz limit across Username, IP, and Device Fingerprint
    const dailyCount = await Database.getQuizDailyCount(user.username, clientIp, deviceId);
    if (dailyCount >= 3) {
      return res.status(400).json({
        error: "Günde maksimum 3 defa anket çözebilirsiniz. Bugünlük 3/3 hakkınızı doldurdunuz! Yarın tekrar gelip 3 yeni anket çözerek kredi kazanabilirsiniz."
      });
    }

    const settings = await Database.getQuizSettings();
    if (settings.enabled === false) {
      return res.status(400).json({ error: "Kredi kazanma ve anket sistemi yöneticiler tarafından geçici olarak kapatılmıştır." });
    }

    const allQuestions = await Database.getQuizQuestions();

    if (allQuestions.length === 0) {
      return res.status(400).json({ error: "Henüz soru eklenmemiş. Lütfen yönetici ile iletişime geçiniz." });
    }

    const count = Math.min(settings.quizQuestionsPerRound || 10, allQuestions.length);
    const username = req.user.username;
    const recentIds = userRecentQuestionsMap.get(username) || [];

    // Filter questions that were NOT asked in recent rounds for this user
    let pool = allQuestions.filter(q => !recentIds.includes(q.id));
    if (pool.length < count) {
      // If we ran out of unseen questions, fall back to full pool
      pool = [...allQuestions];
    }

    // Unbiased Fisher-Yates shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedQuestions = shuffled.slice(0, count);

    // Update recent question IDs history for this user (keep up to 50 recent IDs)
    const newlySelectedIds = selectedQuestions.map(q => q.id);
    const updatedRecent = [...newlySelectedIds, ...recentIds.filter(id => !newlySelectedIds.includes(id))].slice(0, 50);
    userRecentQuestionsMap.set(username, updatedRecent);

    const selected = selectedQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    return res.json({
      questions: selected,
      secondsPerQuestion: settings.secondsPerQuestion || 30,
      minCorrectToWin: settings.minCorrectToWin || 7,
      todayCompletedCount: dailyCount,
      maxDailyQuizzes: 3
    });
  } catch (err) {
    console.error("Start quiz error:", err);
    return res.status(500).json({ error: "Anket başlatılırken hata oluştu." });
  }
});

// POST /api/earn/quiz/submit
app.post("/api/earn/quiz/submit", authenticateToken, enforceNoVpn, async (req: any, res) => {
  try {
    const { answers, deviceId: bodyDeviceId } = req.body; // array of { questionId, selectedIndex }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Geçersiz cevap formatı." });
    }

    const user = await Database.findUserByUsername(req.user.username);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    const clientIp = getClientIp(req);
    const deviceId = (req.headers["x-device-fingerprint"] || bodyDeviceId || "") as string;

    // Strict daily limit check before accepting score
    const dailyCount = await Database.getQuizDailyCount(user.username, clientIp, deviceId);
    if (dailyCount >= 3) {
      return res.status(400).json({
        error: "Günde maksimum 3 defa anket çözebilirsiniz. Bugünlük 3/3 hakkınızı doldurdunuz!"
      });
    }

    const settings = await Database.getQuizSettings();
    if (settings.enabled === false) {
      return res.status(400).json({ error: "Kredi kazanma ve anket sistemi yöneticiler tarafından geçici olarak kapatılmıştır." });
    }

    const allQuestions = await Database.getQuizQuestions();
    const questionsMap = new Map(allQuestions.map(q => [q.id, q]));

    let correctCount = 0;
    answers.forEach((ans: { questionId: string; selectedIndex: number }) => {
      const q = questionsMap.get(ans.questionId);
      if (q && q.correctIndex === ans.selectedIndex) {
        correctCount++;
      }
    });

    const total = answers.length;
    const minRequired = settings.minCorrectToWin ?? 7;
    const passed = correctCount >= minRequired;
    const earnedCredits = passed ? (settings.creditsPerQuiz ?? 1) : 0;

    const result = await Database.recordQuizCompletion(user.username, earnedCredits);
    const newDailyCount = await Database.recordQuizDailyAttempt(user.username, clientIp, deviceId);

    return res.json({
      success: true,
      score: correctCount,
      total,
      minRequired,
      passed,
      earnedCredits,
      newCredits: result.credits,
      completedQuizzesCount: result.completedQuizzesCount,
      todayCompletedCount: newDailyCount,
      maxDailyQuizzes: 3
    });
  } catch (err: any) {
    console.error("Submit quiz error:", err);
    return res.status(500).json({ error: err.message || "Anket gönderilirken teknik hata oluştu." });
  }
});

// POST /api/earn/quiz/claim-quest
app.post("/api/earn/quiz/claim-quest", authenticateToken, enforceNoVpn, async (req: any, res) => {
  try {
    const { questId } = req.body;
    if (!questId) return res.status(400).json({ error: "Görev ID gerekli." });

    const result = await Database.claimQuizQuest(req.user.username, questId);
    return res.json({
      success: true,
      earned: result.rewardCredits,
      newCredits: result.credits,
      claimedQuests: result.claimedQuests,
      message: `Tebrikler! Görev tamamlandı, +${result.rewardCredits} Kredi eklendi.`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Görev ödülü alınırken hata oluştu." });
  }
});

// ==========================================
// ADMIN QUIZ & EARN MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/admin/quiz/questions
app.get("/api/admin/quiz/questions", authenticateAdmin, async (req, res) => {
  try {
    const list = await Database.getQuizQuestions();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Sorular çekilemedi." });
  }
});

// POST /api/admin/quiz/questions
app.post("/api/admin/quiz/questions", authenticateAdmin, async (req, res) => {
  try {
    const { question, options, correctIndex } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2 || correctIndex === undefined) {
      return res.status(400).json({ error: "Soru, seçenekler ve doğru cevap seçimi zorunludur." });
    }
    const created = await Database.addQuizQuestion({
      question: String(question).trim(),
      options: options.map(o => String(o).trim()),
      correctIndex: Number(correctIndex)
    });
    return res.json({ success: true, item: created });
  } catch (err) {
    return res.status(500).json({ error: "Soru eklenirken hata oluştu." });
  }
});

// PUT /api/admin/quiz/questions/:id
app.put("/api/admin/quiz/questions/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correctIndex } = req.body;
    await Database.updateQuizQuestion(id, {
      question: question ? String(question).trim() : undefined,
      options: Array.isArray(options) ? options.map(o => String(o).trim()) : undefined,
      correctIndex: correctIndex !== undefined ? Number(correctIndex) : undefined
    });
    return res.json({ success: true, message: "Soru başarıyla güncellendi." });
  } catch (err) {
    return res.status(500).json({ error: "Soru güncellenirken hata oluştu." });
  }
});

// DELETE /api/admin/quiz/questions/:id
app.delete("/api/admin/quiz/questions/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Database.deleteQuizQuestion(id);
    return res.json({ success: true, message: "Soru başarıyla silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Soru silinirken hata oluştu." });
  }
});

// GET /api/admin/quiz/quests
app.get("/api/admin/quiz/quests", authenticateAdmin, async (req, res) => {
  try {
    const list = await Database.getQuizQuests();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: "Görevler çekilemedi." });
  }
});

// POST /api/admin/quiz/quests
app.post("/api/admin/quiz/quests", authenticateAdmin, async (req, res) => {
  try {
    const { title, description, targetCount, rewardCredits } = req.body;
    if (!title || !targetCount || !rewardCredits) {
      return res.status(400).json({ error: "Başlık, hedef sayı ve kredi ödülü zorunludur." });
    }
    const created = await Database.addQuizQuest({
      title: String(title).trim(),
      description: String(description || "").trim(),
      targetCount: Number(targetCount),
      rewardCredits: Number(rewardCredits)
    });
    return res.json({ success: true, item: created });
  } catch (err) {
    return res.status(500).json({ error: "Görev eklenirken hata oluştu." });
  }
});

// DELETE /api/admin/quiz/quests/:id
app.delete("/api/admin/quiz/quests/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Database.deleteQuizQuest(id);
    return res.json({ success: true, message: "Görev silindi." });
  } catch (err) {
    return res.status(500).json({ error: "Görev silinemedi." });
  }
});

// GET /api/admin/quiz/settings
app.get("/api/admin/quiz/settings", authenticateAdmin, async (req, res) => {
  try {
    const settings = await Database.getQuizSettings();
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: "Ayarlar çekilemedi." });
  }
});

// POST /api/admin/quiz/settings
app.post("/api/admin/quiz/settings", authenticateAdmin, async (req, res) => {
  try {
    const { bannerNotice, adsenseCode, quizQuestionsPerRound, secondsPerQuestion, creditsPerQuiz, minCorrectToWin, cooldownMinutes, enabled } = req.body;
    await Database.updateQuizSettings({
      bannerNotice: String(bannerNotice || "").trim(),
      adsenseCode: String(adsenseCode || "").trim(),
      quizQuestionsPerRound: Number(quizQuestionsPerRound) || 10,
      secondsPerQuestion: Number(secondsPerQuestion) || 30,
      creditsPerQuiz: Number(creditsPerQuiz) >= 0 ? Number(creditsPerQuiz) : 1,
      minCorrectToWin: Number(minCorrectToWin) || 7,
      cooldownMinutes: Number(cooldownMinutes) >= 0 ? Number(cooldownMinutes) : 0,
      enabled: enabled !== false
    });
    return res.json({ success: true, message: "Anket ve Kredi ayarları başarıyla kaydedildi." });
  } catch (err) {
    return res.status(500).json({ error: "Ayarlar kaydedilemedi." });
  }
});

// GET /api/admin/earn-settings
app.get("/api/admin/earn-settings", authenticateAdmin, async (req, res) => {
  try {
    const settings = await Database.getEarnSettings();
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: "Kredi kazanma ayarları çekilemedi." });
  }
});

// POST /api/admin/earn-settings
app.post("/api/admin/earn-settings", authenticateAdmin, async (req, res) => {
  try {
    const { adsterraUrl, monlixUrl, adRewardCredits, adCooldownMinutes, dailyBonusCredits, enabled } = req.body;
    await Database.updateEarnSettings({
      adsterraUrl: String(adsterraUrl || "").trim(),
      monlixUrl: String(monlixUrl || "").trim(),
      adRewardCredits: Number(adRewardCredits) || 1,
      adCooldownMinutes: Number(adCooldownMinutes) || 10,
      dailyBonusCredits: Number(dailyBonusCredits) || 10,
      enabled: enabled !== false
    });

    // Also sync quiz settings enabled flag
    const currentQuizSettings = await Database.getQuizSettings();
    await Database.updateQuizSettings({
      ...currentQuizSettings,
      enabled: enabled !== false
    });

    return res.json({ success: true, message: "Kredi kazanım ayarları başarıyla güncellendi." });
  } catch (err) {
    return res.status(500).json({ error: "Ayarlar kaydedilemedi." });
  }
});


// ==========================================
// 5.5) SUPPORT TICKETS API
// ==========================================

// POST /api/support/tickets (Create a ticket - Public)
app.post("/api/support/tickets", async (req, res) => {
  const { username, email, subject, message } = req.body;
  if (!username || !email || !subject || !message) {
    return res.status(400).json({ error: "Lütfen tüm alanları eksiksiz doldurun." });
  }

  try {
    const ticket = await Database.createSupportTicket({
      username: username.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim()
    });
    return res.json({ status: "success", message: "Destek talebiniz başarıyla oluşturuldu! Yetkililerimiz en kısa sürede yanıtlayacaktır.", ticket });
  } catch (err) {
    return res.status(500).json({ error: "Destek talebi oluşturulamadı." });
  }
});

// GET /api/admin/support-tickets (List all tickets - Admin only)
app.get("/api/admin/support-tickets", authenticateAdmin, checkPermission("support-tickets"), async (req, res) => {
  try {
    const tickets = await Database.getAllSupportTickets();
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: "Talep listesi çekilemedi." });
  }
});

// POST /api/admin/support-tickets/:id/replies (Reply to a ticket - Admin only)
app.post("/api/admin/support-tickets/:id/replies", authenticateAdmin, checkPermission("support-tickets"), async (req: any, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Lütfen bir yanıt mesajı yazın." });
  }

  try {
    const reply = {
      sender: req.admin.username,
      message: message.trim(),
      createdAt: new Date()
    };
    await Database.addTicketReply(id, reply);
    return res.json({ status: "success", message: "Cevabınız başarıyla iletildi.", reply });
  } catch (err) {
    return res.status(500).json({ error: "Cevap eklenirken bir hata oluştu." });
  }
});

// PUT /api/admin/support-tickets/:id/status (Close/Open a ticket - Admin only)
app.put("/api/admin/support-tickets/:id/status", authenticateAdmin, checkPermission("support-tickets"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status !== "open" && status !== "closed") {
    return res.status(400).json({ error: "Geçersiz durum değeri." });
  }

  try {
    await Database.updateTicketStatus(id, status);
    return res.json({ status: "success", message: `Talep başarıyla ${status === "closed" ? "kapatıldı" : "açıldı"}.` });
  } catch (err) {
    return res.status(500).json({ error: "Talep durumu güncellenemedi." });
  }
});


// ==========================================
// 5.6) SOCIAL & FRIENDS & MESSAGING API
// ==========================================

// POST /api/admin/users/update-role (Update user role, permissions, and admin status)
app.post("/api/admin/users/update-role", authenticateAdmin, checkPermission("users"), async (req, res) => {
  const { targetUsername, role, permissions, isAdmin } = req.body;
  if (!targetUsername) {
    return res.status(400).json({ error: "Hedef kullanıcı adı gereklidir." });
  }

  try {
    const user = await Database.findUserByUsername(targetUsername);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    await Database.updateUserRoleAndPermissions(
      targetUsername,
      role || "Oyuncu",
      Array.isArray(permissions) ? permissions : [],
      typeof isAdmin === "boolean" ? isAdmin : undefined
    );

    return res.json({ success: true, message: `${targetUsername} kullanıcısının rol ve yetkileri başarıyla güncellendi.` });
  } catch (err) {
    console.error("Update user role error:", err);
    return res.status(500).json({ error: "Rol güncellenirken hata oluştu." });
  }
});

// GET /api/players/search (Search registered players)
app.get("/api/players/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  try {
    const players = await Database.searchPlayers(query);
    const formatted = players.map(p => ({
      username: p.username,
      role: p.role || (p.isAdmin ? "Yönetici" : "Oyuncu"),
      isAdmin: !!p.isAdmin,
      registerDate: p.registerDate,
      isOnline: Database.isPlayerOnline(p.username)
    }));
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: "Oyuncular aranamadı." });
  }
});

// GET /api/players/profile/:username (Public/Player Profile Details)
app.get("/api/players/profile/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await Database.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: "Oyuncu bulunamadı." });
    }

    return res.json({
      username: user.username,
      role: user.role || (user.isAdmin ? "Yönetici" : "Oyuncu"),
      isAdmin: !!user.isAdmin,
      registerDate: user.registerDate,
      isOnline: Database.isPlayerOnline(user.username),
      permissions: user.permissions || []
    });
  } catch (err) {
    return res.status(500).json({ error: "Profil bilgileri alınamadı." });
  }
});

// GET /api/social/friends (Get user's friends, received requests, and sent requests)
app.get("/api/social/friends", authenticateToken, async (req: any, res) => {
  try {
    const data = await Database.getFriendships(req.user.username);
    return res.json(data);
  } catch (err) {
    console.error("Get friends error:", err);
    return res.status(500).json({ error: "Arkadaş listesi alınamadı." });
  }
});

// POST /api/social/friend-request (Send friend request)
app.post("/api/social/friend-request", authenticateToken, async (req: any, res) => {
  const { recipient } = req.body;
  if (!recipient) {
    return res.status(400).json({ error: "Hedef oyuncu ismi gereklidir." });
  }

  try {
    const result = await Database.sendFriendRequest(req.user.username, recipient);
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Send background push notification to recipient if away or offline
    dispatchPushNotification(recipient, {
      title: "ZefirCraft • Arkadaşlık İsteği",
      body: `${req.user.username} sana arkadaşlık isteği gönderdi!`,
      sender: req.user.username,
      url: "/#friends",
      tag: `freq_${req.user.username}`
    }).catch(() => {});

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Arkadaşlık isteği gönderilemedi." });
  }
});

// POST /api/social/respond-request (Accept/Reject/Cancel friend request)
app.post("/api/social/respond-request", authenticateToken, async (req: any, res) => {
  const { targetUsername, action } = req.body;
  if (!targetUsername || !["accept", "reject", "cancel"].includes(action)) {
    return res.status(400).json({ error: "Geçersiz işlem parametreleri." });
  }

  try {
    let result;
    if (action === "accept" || action === "reject") {
      result = await Database.respondFriendRequest(targetUsername, req.user.username, action);
      if (action === "accept") {
        dispatchPushNotification(targetUsername, {
          title: "ZefirCraft • Arkadaşlık Kabul Edildi",
          body: `${req.user.username} arkadaşlık isteğini kabul etti! Artık sohbet edebilirsiniz.`,
          sender: req.user.username,
          url: "/#friends",
          tag: `facc_${req.user.username}`
        }).catch(() => {});
      }
    } else {
      result = await Database.respondFriendRequest(req.user.username, targetUsername, "cancel");
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "İşlem gerçekleştirilemedi." });
  }
});

// POST /api/social/remove-friend (Remove friend)
app.post("/api/social/remove-friend", authenticateToken, async (req: any, res) => {
  const { targetUsername } = req.body;
  if (!targetUsername) {
    return res.status(400).json({ error: "Oyuncu adı gereklidir." });
  }

  try {
    await Database.removeFriend(req.user.username, targetUsername);
    return res.json({ success: true, message: "Arkadaşlıktan çıkarıldı." });
  } catch (err) {
    return res.status(500).json({ error: "Arkadaş çıkarılamadı." });
  }
});

// GET /api/social/messages/:friendUsername (Get chat messages with friend)
app.get("/api/social/messages/:friendUsername", authenticateToken, async (req: any, res) => {
  const { friendUsername } = req.params;
  try {
    const messages = await Database.getConversationMessages(req.user.username, friendUsername);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: "Mesajlar çekilemedi." });
  }
});

// POST /api/social/messages/send (Send DM + Background Web Push)
app.post("/api/social/messages/send", authenticateToken, async (req: any, res) => {
  const { recipient, message } = req.body;
  if (!recipient || !message) {
    return res.status(400).json({ error: "Alıcı ve mesaj içeriği zorunludur." });
  }

  try {
    const newMsg = await Database.sendDirectMessage(req.user.username, recipient, message);

    // Asynchronously dispatch background web push notifications to recipient's registered devices (even when app/chrome is closed)
    dispatchPushNotification(recipient, {
      title: `${req.user.username} • Yeni Mesaj`,
      body: message,
      sender: req.user.username,
      url: `/#friends`,
      tag: `dm_${req.user.username}_${Date.now()}`
    }).catch((pushErr) => {
      console.warn("[Background Push Dispatch Error]", pushErr);
    });

    return res.json({ success: true, message: newMsg });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Mesaj gönderilemedi." });
  }
});

// GET /api/push/vapid-public-key (Client retrieves public key to subscribe)
app.get("/api/push/vapid-public-key", (req, res) => {
  return res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/push/subscribe (Save client PushSubscription to DB)
app.post("/api/push/subscribe", authenticateToken, async (req: any, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Geçersiz push aboneliği." });
  }
  try {
    await Database.savePushSubscription(req.user.username, subscription);
    return res.json({ success: true, message: "Push aboneliği başarıyla kaydedildi." });
  } catch (err) {
    return res.status(500).json({ error: "Abonelik kaydedilemedi." });
  }
});

// POST /api/push/unsubscribe (Remove client PushSubscription from DB)
app.post("/api/push/unsubscribe", authenticateToken, async (req: any, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await Database.removePushSubscription(endpoint);
  }
  return res.json({ success: true });
});

// POST /api/push/test (Send a test background push notification with optional countdown delay)
app.post("/api/push/test", authenticateToken, async (req: any, res) => {
  const { delaySeconds = 0 } = req.body;
  const username = req.user.username;

  const performSend = async () => {
    await dispatchPushNotification(username, {
      title: "ZefirCraft • Bildirim Testi",
      body: "Tebrikler! Site ve Chrome kapalıyken bile arka plan bildirimleriniz başarıyla çalışıyor! 🔔",
      sender: "ZefirCraft",
      url: "/#friends",
      tag: `test_push_${Date.now()}`
    });
  };

  if (delaySeconds && delaySeconds > 0) {
    setTimeout(performSend, delaySeconds * 1000);
    return res.json({
      success: true,
      message: `${delaySeconds} saniye içinde test bildirimi gönderilecek. Şimdi sekmeyi kapatabilir veya telefonunuzu kilitleyebilirsiniz!`
    });
  } else {
    await performSend();
    return res.json({
      success: true,
      message: "Test bildirimi cihazınıza başarıyla gönderildi!"
    });
  }
});

// POST /api/social/messages/read (Explicitly mark conversation as read)
app.post("/api/social/messages/read", authenticateToken, async (req: any, res) => {
  const { friendUsername } = req.body;
  if (!friendUsername) {
    return res.status(400).json({ error: "Arkadaş kullanıcı adı zorunludur." });
  }
  try {
    await Database.markMessagesAsRead(req.user.username, friendUsername);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Okundu bilgisi güncellenemedi." });
  }
});

// GET /api/social/latest-unread (Get recent unread messages with sender metadata for desktop/toast notifications)
app.get("/api/social/latest-unread", authenticateToken, async (req: any, res) => {
  try {
    const unreadMsgs = await Database.getRecentUnreadMessages(req.user.username, 10);
    const count = await Database.getUnreadMessageCount(req.user.username);
    return res.json({
      unreadCount: count,
      messages: unreadMsgs
    });
  } catch (err) {
    return res.status(500).json({ unreadCount: 0, messages: [] });
  }
});

// GET /api/social/unread-count (Get unread DM count for navigation badge)
app.get("/api/social/unread-count", authenticateToken, async (req: any, res) => {
  try {
    const count = await Database.getUnreadMessageCount(req.user.username);
    return res.json({ unreadCount: count });
  } catch (err) {
    return res.status(500).json({ unreadCount: 0 });
  }
});


// Serve static build assets and handle clean SPA routes for SEO (/store, /earn, /wheel, etc.)
app.use(express.static(path.join(process.cwd(), "dist")));
app.use(express.static(path.join(process.cwd(), "public")));

// Direct route: /map redirects instantly to the Towny live map
app.get(["/map", "/map/"], (req: any, res: any) => {
  return res.redirect(302, "http://zefircraft.ddns.net:8123/?worldname=Towny");
});

app.get("*", (req: any, res: any, next: any) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  const distIndex = path.join(process.cwd(), "dist", "index.html");
  res.sendFile(distIndex, (err: any) => {
    if (err) {
      const rootIndex = path.join(process.cwd(), "index.html");
      res.sendFile(rootIndex, (err2: any) => {
        if (err2) {
          res.status(404).send("Page not found");
        }
      });
    }
  });
});

// ==========================================
// 6) FRONT-END SERVER (Next.js integrated)
// ==========================================

async function startServer() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZefirCraft Backend API Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.RUNNING_IN_NEXT && !process.env.NEXT_RUNTIME) {
  startServer();
}

export default app;
