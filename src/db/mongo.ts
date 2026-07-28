import { MongoClient, Db, ObjectId } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

// Interfaces
export interface User {
  _id?: any;
  username: string;
  username_lower: string;
  password: string; // bcrypt hash
  credits: number;
  registerDate: Date;
  ipAddress: string;
  isAdmin?: boolean;
  role?: string;
  lastWheelSpin?: Date | string;
  lastDailyBonus?: Date | string;
  lastAdWatch?: Date | string;
  completedTasks?: string[];
  permissions?: string[];
  completedQuizzesCount?: number;
  claimedQuests?: string[];
  lastQuizTime?: Date | string;
}

export interface QuizQuestion {
  _id?: any;
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  createdAt?: Date;
}

export interface QuizQuest {
  _id?: any;
  id: string;
  title: string;
  description: string;
  targetCount: number;
  rewardCredits: number;
}

export interface EarnQuizSettings {
  bannerNotice: string;
  adsenseCode: string;
  quizQuestionsPerRound: number;
  secondsPerQuestion: number;
  creditsPerQuiz: number;
  minCorrectToWin: number;
  cooldownMinutes: number;
}

export interface EarnSettings {
  adsterraUrl: string;
  monlixUrl?: string;
  adRewardCredits: number;
  adCooldownMinutes: number;
  dailyBonusCredits: number;
}

export interface Friendship {
  _id?: any;
  requester: string;
  recipient: string;
  status: "pending" | "accepted";
  createdAt: Date;
}

export interface DirectMessage {
  _id?: any;
  sender: string;
  recipient: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Product {
  _id?: any;
  price: number;
  commands: string[];
  name: string;
  description: string;
  imageUrl: string;
  category: string; // "Rütbeler" | "Kozmetikler" | "Diğer"
}

export interface PurchaseRequest {
  _id?: any;
  status: "pending" | "completed" | "failed";
  username: string;
  productId: string;
  processedAt?: Date;
  failReason?: string;
  createdAt: Date;
}

export interface CreditRequest {
  _id?: any;
  status: "pending" | "completed" | "failed";
  username: string;
  action: "add" | "subtract";
  amount: number;
  createdAt: Date;
}

export interface Application {
  _id?: any;
  username: string;
  realName: string;
  age: number;
  discord: string;
  position?: string;
  activeHours?: string;
  experience: string;
  reason: string;
  scenario?: string;
  microphone?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export interface Article {
  _id?: any;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: Date;
  views: number;
}

export interface ChestItem {
  _id?: any;
  username: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  commands: string[];
  status: "in_chest" | "delivered";
  createdAt: Date;
  deliveredAt?: Date;
}

export interface Category {
  _id?: any;
  name: string;
  imageUrl: string;
}

export interface TicketReply {
  sender: string;
  message: string;
  createdAt: Date;
}

export interface SupportTicket {
  _id?: any;
  username: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "closed";
  createdAt: Date;
  replies: TicketReply[];
}

export interface WheelLog {
  _id?: any;
  username: string;
  reward: string;
  createdAt: Date;
}

// Global DB config
const dbName = "zefircraft";
const MONGODB_URI = process.env.MONGODB_URI;

// Mock database path
const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: "q1", question: "Minecraft resmi olarak ilk kez hangi yılda tam sürüm olarak satışa sunulmuştur?", options: ["2009", "2011", "2013", "2015"], correctIndex: 1 },
  { id: "q2", question: "Nether portalı oluşturmak için minimum kaç adet Obsidian (Obsidyen) bloğu gereklidir?", options: ["8", "10", "12", "14"], correctIndex: 1 },
  { id: "q3", question: "Creepere şimşek çaktığında hangi forma dönüşür?", options: ["Ateşli Creeper", "Yüklü (Charged) Creeper", "Büyük Creeper", "Mavi Creeper"], correctIndex: 1 },
  { id: "q4", question: "Ender Ejderhası (Ender Dragon) ilk kez yenildiğinde oyunculara ortalama kaç XP seviyesi kazandırır?", options: ["20 Seviye", "35 Seviye", "68 Seviye", "100 Seviye"], correctIndex: 2 },
  { id: "q5", question: "Köylüler (Villagers) ile ticaret yaparken kullanılan temel değerli taş hangisidir?", options: ["Elmas", "Zümrüt", "Altın", "Kızıltaş"], correctIndex: 1 },
  { id: "q6", question: "Büyü Masasında (Enchantment Table) 30. seviye büyü açmak için etrafına kaç Kitaplık yerleştirilmelidir?", options: ["12", "15", "18", "20"], correctIndex: 1 },
  { id: "q7", question: "Elmas Kazma (Diamond Pickaxe) üretmek için kaç Elmas ve kaç Çubuk gereklidir?", options: ["2 Elmas, 3 Çubuk", "3 Elmas, 2 Çubuk", "3 Elmas, 3 Çubuk", "4 Elmas, 2 Çubuk"], correctIndex: 1 },
  { id: "q8", question: "Aşağıdaki yaratıklardan hangisi Minecraft'ta oyuncu tarafından evcilleştirilemez?", options: ["Kurt (Wolf)", "Kedi (Cat)", "Papağan (Parrot)", "Örümcek (Spider)"], correctIndex: 3 },
  { id: "q9", question: "Beacon (Fener) bloğunu aktifleştirmek için altındaki piramit hangi cevherden YAPILAMAZ?", options: ["Demir Bloğu", "Altın Bloğu", "Zümrüt Bloğu", "Kömür Bloğu"], correctIndex: 3 },
  { id: "q10", question: "Phantom yaratığı oyuncunun kaç gün boyunca uyumaması durumunda saldırmaya başlar?", options: ["1 Gün", "2 Gün", "3 Gün", "5 Gün"], correctIndex: 2 },
  { id: "q11", question: "Wither boss yaratığını çağırmak için kaç Ruh Kumu ve kaç Wither İskelet Kafası gereklidir?", options: ["3 Ruh Kumu, 3 Kafa", "4 Ruh Kumu, 3 Kafa", "4 Ruh Kumu, 2 Kafa", "5 Ruh Kumu, 4 Kafa"], correctIndex: 1 },
  { id: "q12", question: "Aşağıdaki eşyalardan hangisi Kızıltaş sinyalini tersine çevirmek (Invert) için kullanılır?", options: ["Kızıltaş Meşalesi", "Yineleyici (Repeater)", "Karşılaştırıcı (Comparator)", "Piston"], correctIndex: 0 },
  { id: "q13", question: "Minecraft'ta tam bir gündüz ve gece döngüsü gerçek hayatta kaç dakika sürer?", options: ["10 Dakika", "15 Dakika", "20 Dakika", "30 Dakika"], correctIndex: 2 },
  { id: "q14", question: "Kurtları iyileştirmek veya çiftleştirmek için ne verilmelidir?", options: ["Kemik", "Çiğ veya Pişmiş Et", "Elma", "Buğday"], correctIndex: 1 },
  { id: "q15", question: "Hayatta kalma (Survival) modunda kırılamayan katman kayası bloğu hangisidir?", options: ["Obsidian", "Bedrock", "Netherite Bloğu", "Derin Taş"], correctIndex: 1 }
];

const DEFAULT_QUIZ_QUESTS: QuizQuest[] = [
  { id: "quest_1", title: "3 Anket Tamamla", description: "Toplamda 3 adet Minecraft bilgi testini başarıyla tamamla.", targetCount: 3, rewardCredits: 5 },
  { id: "quest_2", title: "5 Anket Tamamla", description: "Toplamda 5 adet Minecraft bilgi testini başarıyla tamamla.", targetCount: 5, rewardCredits: 10 },
  { id: "quest_3", title: "10 Anket Tamamla", description: "Toplamda 10 adet Minecraft bilgi testini başarıyla tamamla.", targetCount: 10, rewardCredits: 25 }
];

const DEFAULT_QUIZ_SETTINGS: EarnQuizSettings = {
  bannerNotice: "Size ücretsiz kredi sağlayabilmek ve sunucu giderlerimizi karşılayabilmek için bu sayfada reklam alanları yer almaktadır. Anket ve Minecraft bilgi testlerini çözerek hem bilginizi test edin hem de mağazamızda harcayabileceğiniz ücretsiz krediler kazanın!",
  adsenseCode: "<!-- Google AdSense / Reklam Kodu -->",
  quizQuestionsPerRound: 10,
  secondsPerQuestion: 10,
  creditsPerQuiz: 1,
  minCorrectToWin: 7,
  cooldownMinutes: 0
};

export interface QueuedCommand {
  _id?: any;
  username: string;
  command: string;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

interface MockSchema {
  users: User[];
  products: Product[];
  purchase_requests: PurchaseRequest[];
  credit_requests: CreditRequest[];
  applications: Application[];
  command_queue: QueuedCommand[];
  settings: { apiKey: string }[];
  articles: Article[];
  chest_items: ChestItem[];
  categories: Category[];
  support_tickets: SupportTicket[];
  wheel_logs: WheelLog[];
  friendships: Friendship[];
  direct_messages: DirectMessage[];
  quizQuestions?: QuizQuestion[];
  quizQuests?: QuizQuest[];
  quizSettings?: EarnQuizSettings;
}

// In-Memory & File-based DB state for fallback
let mockDbState: MockSchema = {
  users: [],
  products: [],
  purchase_requests: [],
  credit_requests: [],
  applications: [],
  command_queue: [],
  settings: [{ apiKey: "zefir_secret_key_123" }],
  articles: [],
  chest_items: [],
  categories: [],
  support_tickets: [],
  wheel_logs: [],
  friendships: [],
  direct_messages: [],
  quizQuestions: [],
  quizQuests: []
};

// Seed helper functions
async function getHashedPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, 12);
}

function ensureDirectoryExistence(filePath: string) {
  try {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  } catch (err) {
    console.warn("[DB Warnings] Failed to ensure directory existence (this is normal on read-only serverless filesystems):", err);
  }
}

function saveMockDb() {
  try {
    ensureDirectoryExistence(DB_FILE);
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDbState, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DB Warnings] Failed to write mock database to disk (this is expected on Vercel, state will run in-memory):", err);
  }
}

function loadMockDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        mockDbState = JSON.parse(data);
      } catch (e) {
        console.error("Error reading fallback database, resetting:", e);
        saveMockDb();
      }
    } else {
      // Seed initial data
      seedInitialMockData();
    }
  } catch (err) {
    console.warn("[DB Warnings] Failed to check mock DB presence on disk, falling back to seeding in-memory:", err);
    seedInitialMockData();
  }
}

async function seedInitialMockData() {
  const adminHash = await getHashedPassword("admin123");
  const playerHash = await getHashedPassword("password123");
  const specialAdminHash = await getHashedPassword("171aaadff6844cd33849fcb3fa11f328b698eef648e0012985f53adb02d08d0b");

  mockDbState.users = [
    {
      username: "ZefirPlayer",
      username_lower: "zefirplayer",
      password: playerHash,
      credits: 120,
      registerDate: new Date(),
      ipAddress: "127.0.0.1"
    },
    {
      username: "admin",
      username_lower: "admin",
      password: adminHash,
      credits: 250,
      registerDate: new Date(),
      ipAddress: "127.0.0.1",
      isAdmin: true
    },
    {
      username: "sunayseyidli01@gmail.com",
      username_lower: "sunayseyidli01@gmail.com",
      password: specialAdminHash,
      credits: 1000,
      registerDate: new Date(),
      ipAddress: "127.0.0.1",
      isAdmin: true
    }
  ];

  mockDbState.products = [
    {
      _id: "prod_1",
      name: "VIP Rütbesi",
      price: 45,
      commands: ["lp user {username} parent add vip", "broadcast &b&l{username} &eVIP rütbesi satın aldı! Tebrikler!"],
      description: "Sunucudaki VIP haklarına sahip olursun. Yeşil yazı rengi, özel kitler ve sunucu doluyken giriş hakkı kazandırır.",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      category: "Rütbeler"
    },
    {
      _id: "prod_2",
      name: "MVP+ Rütbesi",
      price: 85,
      commands: ["lp user {username} parent add mvp_plus", "broadcast &b&l{username} &eMVP+ rütbesi satın aldı! Kutlarız!"],
      description: "Sunucudaki en prestijli rütbelerden biri! Özel uçuş modu, buz efektleri, benzersiz emojiler ve devasa kiti ile öne çık.",
      imageUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80",
      category: "Rütbeler"
    },
    {
      _id: "prod_3",
      name: "10,000 Oyun Parası",
      price: 15,
      commands: ["eco give {username} 10000", "msg {username} Hesabına 10.000 oyun akçesi yatırıldı."],
      description: "Sunucu içi adil ekonomide hızlıca zengin ol. Marketten eşya almak ve ada seviyeni yükseltmek için ekstra kaynak sağlar.",
      imageUrl: "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&w=400&q=80",
      category: "Diğer"
    },
    {
      _id: "prod_4",
      name: "Buz Kristali Kasası Anahtarı (x3)",
      price: 25,
      commands: ["crate give physical ice_crystal 3 {username}"],
      description: "Sunucu kasalarından ultra-nadir buz temalı aletler ve kozmetikler çıkarma şansı veren 3 adet özel anahtar.",
      imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=400&q=80",
      category: "Kozmetikler"
    }
  ];

  mockDbState.purchase_requests = [
    {
      _id: "req_seed_1",
      username: "ErenBey_1",
      productId: "prod_1",
      status: "completed",
      createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago
    },
    {
      _id: "req_seed_2",
      username: "AhmetPVP",
      productId: "prod_4",
      status: "completed",
      createdAt: new Date(Date.now() - 45 * 60 * 1000) // 45 mins ago
    },
    {
      _id: "req_seed_3",
      username: "Cemre_9",
      productId: "prod_3",
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      _id: "req_seed_4",
      username: "MertOyun_",
      productId: "prod_3",
      status: "completed",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    }
  ];
  mockDbState.credit_requests = [];
  mockDbState.applications = [];
  mockDbState.settings = [{ apiKey: "zefir_secret_key_123" }];

  mockDbState.articles = [
    {
      _id: "art_1",
      title: "ZefirCraft Kapılarını Açtı!",
      content: "ZefirCraft Towny sunucumuz 1.16.5 - 26.2 sürümlerini desteklemektedir! Birbirinden heyecanlı kasabalar, dengeli bir ekonomi, rütbe kasaları ve yenilenmiş teslimat sistemi sizleri bekliyor. Hemen zefircraft.mcsh.io IP adresi ile aramıza katılın ve bu muhteşem diyarlardaki yerinizi alın!",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date(),
      views: 142
    },
    {
      _id: "art_2",
      title: "Mağazada %30 Açılış İndirimi!",
      content: "Sunucumuzun açılışına özel tüm VIP rütbelerinde, kozmetik kasalarında ve oyun parası paketlerinde %30'a varan indirimler aktif edildi! Kredilerinizi yükleyip Mağaza üzerinden sipariş vererek, rütbenizi doğrudan oyun içi sandığınıza (Web Chest) gönderebilir ve dilediğiniz an oyunda aktif edebilirsiniz. Keyifli oyunlar dileriz!",
      imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date(Date.now() - 86400000),
      views: 89
    }
  ];
  mockDbState.chest_items = [];

  mockDbState.categories = [
    { _id: "cat_1", name: "Rütbeler", imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" },
    { _id: "cat_2", name: "Kozmetikler", imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=400&q=80" },
    { _id: "cat_3", name: "Kasalar", imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80" },
    { _id: "cat_4", name: "Diğer", imageUrl: "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&w=400&q=80" }
  ];

  mockDbState.wheel_logs = [
    { _id: "wheel_log_1", username: "Alperen99", reward: "10 Kredi", createdAt: new Date(Date.now() - 120000) },
    { _id: "wheel_log_2", username: "ErenBey_1", reward: "2 Kredi", createdAt: new Date(Date.now() - 300000) },
    { _id: "wheel_log_3", username: "Cemre_9", reward: "50 Kredi!", createdAt: new Date(Date.now() - 720000) },
    { _id: "wheel_log_4", username: "AhmetPVP", reward: "5 Kredi", createdAt: new Date(Date.now() - 1080000) },
    { _id: "wheel_log_5", username: "MertOyun_", reward: "100 Kredi!", createdAt: new Date(Date.now() - 1500000) }
  ];

  saveMockDb();
}

// Initialize Mock DB
loadMockDb();

// Real MongoDB Client (lazy initialized)
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function getMongoClient(): Promise<{ client: MongoClient; db: Db } | null> {
  if (!MONGODB_URI) return null;
  if (mongoClient && mongoDb) return { client: mongoClient, db: mongoDb };

  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    console.log("Successfully connected to MongoDB server!");
    return { client: mongoClient, db: mongoDb };
  } catch (err) {
    console.error("Failed to connect to MongoDB, falling back to local JSON DB:", err);
    return null;
  }
}

// Unified generic Database Helper that handles real MongoDB or falls back to simulated database
export class Database {
  static async isMongoConnected(): Promise<boolean> {
    const mongo = await getMongoClient();
    return !!mongo;
  }

  // Configurable secret key
  static async getSecretKey(): Promise<string> {
    if (process.env.SECRET_KEY) {
      return process.env.SECRET_KEY;
    }
    const mongo = await getMongoClient();
    if (mongo) {
      const setting = await mongo.db.collection("settings").findOne({});
      if (setting && setting.apiKey) {
        return setting.apiKey;
      }
      // Insert if not exists
      await mongo.db.collection("settings").insertOne({ apiKey: "zefir_secret_key_123" });
      return "zefir_secret_key_123";
    } else {
      if (!mockDbState.settings || mockDbState.settings.length === 0) {
        mockDbState.settings = [{ apiKey: "zefir_secret_key_123" }];
        saveMockDb();
      }
      return mockDbState.settings[0].apiKey;
    }
  }

  static async setSecretKey(newKey: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("settings").updateOne({}, { $set: { apiKey: newKey } }, { upsert: true });
    } else {
      if (!mockDbState.settings || mockDbState.settings.length === 0) {
        mockDbState.settings = [{ apiKey: newKey }];
      } else {
        mockDbState.settings[0].apiKey = newKey;
      }
      saveMockDb();
    }
  }

  // Helper to check user existence in persistent/mock storage
  private static async userExistsInStorage(lowerUsername: string): Promise<boolean> {
    const mongo = await getMongoClient();
    if (mongo) {
      const count = await mongo.db.collection("users").countDocuments({ username_lower: lowerUsername });
      return count > 0;
    } else {
      return mockDbState.users.some(u => u.username_lower === lowerUsername);
    }
  }

  // USER CRUD
  static async findUserByUsername(username: string): Promise<User | null> {
    const lower = username.toLowerCase();

    // Auto-seed special admin user if requested and not present
    if (lower === "sunayseyidli01@gmail.com") {
      const exists = await this.userExistsInStorage(lower);
      if (!exists) {
        const specialHash = await bcrypt.hash("171aaadff6844cd33849fcb3fa11f328b698eef648e0012985f53adb02d08d0b", 12);
        const newUser: User = {
          username: "sunayseyidli01@gmail.com",
          username_lower: "sunayseyidli01@gmail.com",
          password: specialHash,
          credits: 1000,
          registerDate: new Date(),
          ipAddress: "127.0.0.1",
          isAdmin: true
        };
        await this.createUser(newUser);
      }
    }

    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("users").findOne({ username_lower: lower })) as User | null;
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      return user ? { ...user } : null;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("users").find({}).toArray()) as User[];
    } else {
      return [...mockDbState.users];
    }
  }

  static async createUser(user: User): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").insertOne({
        ...user,
        registerDate: new Date(user.registerDate)
      });
    } else {
      const exists = mockDbState.users.some(u => u.username_lower === user.username_lower);
      if (!exists) {
        mockDbState.users.push({ ...user, _id: "user_" + Date.now() });
        saveMockDb();
      }
    }
  }

  static async updateUserCredits(username: string, newCredits: number): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: { credits: newCredits } }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        user.credits = newCredits;
        saveMockDb();
      }
    }
  }

  static async updateUserWheelSpin(username: string, date: Date, newCredits: number): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: { lastWheelSpin: date, credits: newCredits } }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        user.lastWheelSpin = date;
        user.credits = newCredits;
        saveMockDb();
      }
    }
  }

  static async updateUserPassword(username: string, newPasswordHash: string): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: { password: newPasswordHash } }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        user.password = newPasswordHash;
        saveMockDb();
      }
    }
  }

  static async updateUserEarnData(username: string, updates: { credits?: number; lastDailyBonus?: Date | string; lastAdWatch?: Date | string; completedTasks?: string[] }): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: updates }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        if (updates.credits !== undefined) user.credits = updates.credits;
        if (updates.lastDailyBonus !== undefined) user.lastDailyBonus = updates.lastDailyBonus;
        if (updates.lastAdWatch !== undefined) user.lastAdWatch = updates.lastAdWatch;
        if (updates.completedTasks !== undefined) user.completedTasks = updates.completedTasks;
        saveMockDb();
      }
    }
  }

  static async getEarnSettings(): Promise<EarnSettings> {
    const defaultSettings: EarnSettings = {
      adsterraUrl: "https://www.effectivecpmnetwork.com/hy1a37nm?key=f229c9fb555e4283383d0975228ae41b,https://www.effectivecpmnetwork.com/j6uybqniym?key=9d0844e67c078c270eb06d0ccfd3bfae",
      monlixUrl: "https://monlix.com",
      adRewardCredits: 1,
      adCooldownMinutes: 10,
      dailyBonusCredits: 10
    };

    const mongo = await getMongoClient();
    if (mongo) {
      const doc = await mongo.db.collection("earn_settings").findOne({});
      if (doc) {
        return {
          adsterraUrl: doc.adsterraUrl || defaultSettings.adsterraUrl,
          monlixUrl: doc.monlixUrl || defaultSettings.monlixUrl,
          adRewardCredits: doc.adRewardCredits ?? defaultSettings.adRewardCredits,
          adCooldownMinutes: doc.adCooldownMinutes ?? defaultSettings.adCooldownMinutes,
          dailyBonusCredits: doc.dailyBonusCredits ?? defaultSettings.dailyBonusCredits
        };
      }
      return defaultSettings;
    } else {
      if ((mockDbState as any).earnSettings) {
        return (mockDbState as any).earnSettings;
      }
      return defaultSettings;
    }
  }

  static async updateEarnSettings(settings: EarnSettings): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("earn_settings").updateOne(
        {},
        { $set: settings },
        { upsert: true }
      );
    } else {
      (mockDbState as any).earnSettings = settings;
      saveMockDb();
    }
  }

  // ==========================================
  // QUIZ & EARN CREDITS METHODS
  // ==========================================

  static async getQuizQuestions(): Promise<QuizQuestion[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      const list = (await mongo.db.collection("quiz_questions").find({}).toArray()) as QuizQuestion[];
      if (list.length === 0) {
        await mongo.db.collection("quiz_questions").insertMany(DEFAULT_QUIZ_QUESTIONS as any);
        return DEFAULT_QUIZ_QUESTIONS;
      }
      return list;
    } else {
      if (!mockDbState.quizQuestions || mockDbState.quizQuestions.length === 0) {
        mockDbState.quizQuestions = [...DEFAULT_QUIZ_QUESTIONS];
        saveMockDb();
      }
      return mockDbState.quizQuestions;
    }
  }

  static async addQuizQuestion(question: Omit<QuizQuestion, "id">): Promise<QuizQuestion> {
    const newId = "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const item: QuizQuestion = {
      ...question,
      id: newId,
      createdAt: new Date()
    };

    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("quiz_questions").insertOne(item as any);
    } else {
      if (!mockDbState.quizQuestions) mockDbState.quizQuestions = [];
      mockDbState.quizQuestions.push(item);
      saveMockDb();
    }
    return item;
  }

  static async updateQuizQuestion(id: string, question: Partial<QuizQuestion>): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("quiz_questions").updateOne({ id }, { $set: question });
    } else {
      if (mockDbState.quizQuestions) {
        const idx = mockDbState.quizQuestions.findIndex(q => q.id === id);
        if (idx !== -1) {
          mockDbState.quizQuestions[idx] = { ...mockDbState.quizQuestions[idx], ...question };
          saveMockDb();
        }
      }
    }
  }

  static async deleteQuizQuestion(id: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("quiz_questions").deleteOne({ id });
    } else {
      if (mockDbState.quizQuestions) {
        mockDbState.quizQuestions = mockDbState.quizQuestions.filter(q => q.id !== id);
        saveMockDb();
      }
    }
  }

  static async getQuizQuests(): Promise<QuizQuest[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      const list = (await mongo.db.collection("quiz_quests").find({}).toArray()) as QuizQuest[];
      if (list.length === 0) {
        await mongo.db.collection("quiz_quests").insertMany(DEFAULT_QUIZ_QUESTS as any);
        return DEFAULT_QUIZ_QUESTS;
      }
      return list;
    } else {
      if (!mockDbState.quizQuests || mockDbState.quizQuests.length === 0) {
        mockDbState.quizQuests = [...DEFAULT_QUIZ_QUESTS];
        saveMockDb();
      }
      return mockDbState.quizQuests;
    }
  }

  static async addQuizQuest(quest: Omit<QuizQuest, "id">): Promise<QuizQuest> {
    const newId = "quest_" + Date.now();
    const item: QuizQuest = { ...quest, id: newId };
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("quiz_quests").insertOne(item as any);
    } else {
      if (!mockDbState.quizQuests) mockDbState.quizQuests = [];
      mockDbState.quizQuests.push(item);
      saveMockDb();
    }
    return item;
  }

  static async deleteQuizQuest(id: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("quiz_quests").deleteOne({ id });
    } else {
      if (mockDbState.quizQuests) {
        mockDbState.quizQuests = mockDbState.quizQuests.filter(q => q.id !== id);
        saveMockDb();
      }
    }
  }

  static async getQuizSettings(): Promise<EarnQuizSettings> {
    const mongo = await getMongoClient();
    if (mongo) {
      const doc = await mongo.db.collection("quiz_settings").findOne({});
      if (doc) {
        return {
          bannerNotice: doc.bannerNotice || DEFAULT_QUIZ_SETTINGS.bannerNotice,
          adsenseCode: doc.adsenseCode || DEFAULT_QUIZ_SETTINGS.adsenseCode,
          quizQuestionsPerRound: doc.quizQuestionsPerRound ?? DEFAULT_QUIZ_SETTINGS.quizQuestionsPerRound,
          secondsPerQuestion: doc.secondsPerQuestion ?? DEFAULT_QUIZ_SETTINGS.secondsPerQuestion,
          creditsPerQuiz: doc.creditsPerQuiz ?? DEFAULT_QUIZ_SETTINGS.creditsPerQuiz,
          minCorrectToWin: doc.minCorrectToWin ?? DEFAULT_QUIZ_SETTINGS.minCorrectToWin,
          cooldownMinutes: doc.cooldownMinutes ?? DEFAULT_QUIZ_SETTINGS.cooldownMinutes
        };
      }
      return DEFAULT_QUIZ_SETTINGS;
    } else {
      if (mockDbState.quizSettings) {
        return mockDbState.quizSettings;
      }
      mockDbState.quizSettings = DEFAULT_QUIZ_SETTINGS;
      saveMockDb();
      return DEFAULT_QUIZ_SETTINGS;
    }
  }

  static async updateQuizSettings(settings: EarnQuizSettings): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("quiz_settings").updateOne({}, { $set: settings }, { upsert: true });
    } else {
      mockDbState.quizSettings = settings;
      saveMockDb();
    }
  }

  static async recordQuizCompletion(username: string, earnedCredits: number): Promise<{ credits: number; completedQuizzesCount: number; lastQuizTime: Date }> {
    const mongo = await getMongoClient();
    const user = await Database.findUserByUsername(username);
    if (!user) throw new Error("Kullanıcı bulunamadı.");

    const now = new Date();
    const newCompletedCount = (user.completedQuizzesCount || 0) + 1;
    const newCredits = user.credits + earnedCredits;

    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: username.toLowerCase() },
        {
          $set: {
            credits: newCredits,
            completedQuizzesCount: newCompletedCount,
            lastQuizTime: now
          }
        }
      );
    } else {
      const u = mockDbState.users.find(usr => usr.username_lower === username.toLowerCase());
      if (u) {
        u.credits = newCredits;
        u.completedQuizzesCount = newCompletedCount;
        u.lastQuizTime = now;
        saveMockDb();
      }
    }

    return { credits: newCredits, completedQuizzesCount: newCompletedCount, lastQuizTime: now };
  }

  static async claimQuizQuest(username: string, questId: string): Promise<{ credits: number; claimedQuests: string[]; rewardCredits: number }> {
    const user = await Database.findUserByUsername(username);
    if (!user) throw new Error("Kullanıcı bulunamadı.");

    const quests = await Database.getQuizQuests();
    const quest = quests.find(q => q.id === questId);
    if (!quest) throw new Error("Görev bulunamadı.");

    const completedQuizzes = user.completedQuizzesCount || 0;
    if (completedQuizzes < quest.targetCount) {
      throw new Error(`Bu görevi tamamlamak için en az ${quest.targetCount} anket çözmelisiniz! (Mevcut: ${completedQuizzes})`);
    }

    const claimed = user.claimedQuests || [];
    if (claimed.includes(questId)) {
      throw new Error("Bu görevin ödülünü zaten aldınız!");
    }

    const newClaimed = [...claimed, questId];
    const newCredits = user.credits + quest.rewardCredits;

    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: username.toLowerCase() },
        {
          $set: {
            credits: newCredits,
            claimedQuests: newClaimed
          }
        }
      );
    } else {
      const u = mockDbState.users.find(usr => usr.username_lower === username.toLowerCase());
      if (u) {
        u.credits = newCredits;
        u.claimedQuests = newClaimed;
        saveMockDb();
      }
    }

    return { credits: newCredits, claimedQuests: newClaimed, rewardCredits: quest.rewardCredits };
  }

  // PRODUCT CRUD
  static async getAllProducts(): Promise<Product[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("products").find({}).toArray()) as Product[];
    } else {
      return [...mockDbState.products];
    }
  }

  static async findProductById(id: string): Promise<Product | null> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        return (await mongo.db.collection("products").findOne({ _id: new ObjectId(id) })) as Product | null;
      } catch {
        return (await mongo.db.collection("products").findOne({ _id: id as any })) as Product | null;
      }
    } else {
      const prod = mockDbState.products.find(p => String(p._id) === String(id));
      return prod ? { ...prod } : null;
    }
  }

  static async createProduct(prod: Omit<Product, "_id">): Promise<Product> {
    const mongo = await getMongoClient();
    if (mongo) {
      const result = await mongo.db.collection("products").insertOne(prod);
      return { ...prod, _id: result.insertedId } as Product;
    } else {
      const newProd: Product = {
        ...prod,
        _id: "prod_" + Date.now()
      };
      mockDbState.products.push(newProd);
      saveMockDb();
      return newProd;
    }
  }

  static async updateProduct(id: string, updates: Partial<Omit<Product, "_id">>): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: updates });
      } catch {
        await mongo.db.collection("products").updateOne({ _id: id as any }, { $set: updates });
      }
    } else {
      const index = mockDbState.products.findIndex(p => String(p._id) === String(id));
      if (index !== -1) {
        mockDbState.products[index] = { ...mockDbState.products[index], ...updates };
        saveMockDb();
      }
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("products").deleteOne({ _id: new ObjectId(id) });
      } catch {
        await mongo.db.collection("products").deleteOne({ _id: id as any });
      }
    } else {
      mockDbState.products = mockDbState.products.filter(p => String(p._id) !== String(id));
      saveMockDb();
    }
  }

  // CATEGORIES CRUD
  static async getAllCategories(): Promise<Category[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      const cats = (await mongo.db.collection("categories").find({}).toArray()) as any[];
      if (cats.length === 0) {
        const initial = [
          { name: "Rütbeler", imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" },
          { name: "Kozmetikler", imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=400&q=80" },
          { name: "Kasalar", imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80" },
          { name: "Diğer", imageUrl: "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&w=400&q=80" }
        ];
        await mongo.db.collection("categories").insertMany(initial);
        return (await mongo.db.collection("categories").find({}).toArray()) as any[];
      }
      return cats;
    } else {
      if (!mockDbState.categories || mockDbState.categories.length === 0) {
        mockDbState.categories = [
          { _id: "cat_1", name: "Rütbeler", imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" },
          { _id: "cat_2", name: "Kozmetikler", imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=400&q=80" },
          { _id: "cat_3", name: "Kasalar", imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80" },
          { _id: "cat_4", name: "Diğer", imageUrl: "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&w=400&q=80" }
        ];
        saveMockDb();
      }
      return [...mockDbState.categories];
    }
  }

  static async createCategory(cat: Omit<Category, "_id">): Promise<Category> {
    const mongo = await getMongoClient();
    if (mongo) {
      const result = await mongo.db.collection("categories").insertOne(cat);
      return { ...cat, _id: result.insertedId } as any;
    } else {
      const newCat: Category = {
        ...cat,
        _id: "cat_" + Date.now()
      };
      if (!mockDbState.categories) mockDbState.categories = [];
      mockDbState.categories.push(newCat);
      saveMockDb();
      return newCat;
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("categories").deleteOne({ _id: new ObjectId(id) });
      } catch {
        await mongo.db.collection("categories").deleteOne({ _id: id as any });
      }
    } else {
      if (mockDbState.categories) {
        mockDbState.categories = mockDbState.categories.filter(c => String(c._id) !== String(id));
        saveMockDb();
      }
    }
  }

  // PURCHASE REQUESTS
  static async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("purchase_requests").find({}).sort({ createdAt: -1 }).toArray()) as PurchaseRequest[];
    } else {
      return [...mockDbState.purchase_requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  static async createPurchaseRequest(req: Omit<PurchaseRequest, "_id">): Promise<PurchaseRequest> {
    const mongo = await getMongoClient();
    if (mongo) {
      const result = await mongo.db.collection("purchase_requests").insertOne(req);
      return { ...req, _id: result.insertedId } as PurchaseRequest;
    } else {
      const newReq: PurchaseRequest = {
        ...req,
        _id: "req_" + Date.now()
      };
      mockDbState.purchase_requests.push(newReq);
      saveMockDb();
      return newReq;
    }
  }

  static async updatePurchaseRequestStatus(id: string, status: "completed" | "failed", failReason?: string): Promise<void> {
    const mongo = await getMongoClient();
    const updates: any = { status, processedAt: new Date() };
    if (failReason) updates.failReason = failReason;

    if (mongo) {
      try {
        await mongo.db.collection("purchase_requests").updateOne({ _id: new ObjectId(id) }, { $set: updates });
      } catch {
        await mongo.db.collection("purchase_requests").updateOne({ _id: id as any }, { $set: updates });
      }
    } else {
      const index = mockDbState.purchase_requests.findIndex(p => String(p._id) === String(id));
      if (index !== -1) {
        mockDbState.purchase_requests[index] = { ...mockDbState.purchase_requests[index], ...updates };
        saveMockDb();
      }
    }
  }

  // CREDIT REQUESTS
  static async getAllCreditRequests(): Promise<CreditRequest[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("credit_requests").find({}).sort({ createdAt: -1 }).toArray()) as CreditRequest[];
    } else {
      return [...mockDbState.credit_requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  static async createCreditRequest(req: Omit<CreditRequest, "_id">): Promise<CreditRequest> {
    const mongo = await getMongoClient();
    if (mongo) {
      const result = await mongo.db.collection("credit_requests").insertOne(req);
      return { ...req, _id: result.insertedId } as CreditRequest;
    } else {
      const newReq: CreditRequest = {
        ...req,
        _id: "creq_" + Date.now()
      };
      mockDbState.credit_requests.push(newReq);
      saveMockDb();
      return newReq;
    }
  }

  static async updateCreditRequestStatus(id: string, status: "completed" | "failed"): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("credit_requests").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
      } catch {
        await mongo.db.collection("credit_requests").updateOne({ _id: id as any }, { $set: { status } });
      }
    } else {
      const index = mockDbState.credit_requests.findIndex(p => String(p._id) === String(id));
      if (index !== -1) {
        mockDbState.credit_requests[index].status = status;
        saveMockDb();
      }
    }
  }

  // APPLICATIONS
  static async getAllApplications(): Promise<Application[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("applications").find({}).sort({ createdAt: -1 }).toArray()) as Application[];
    } else {
      return [...mockDbState.applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  static async createApplication(app: Omit<Application, "_id">): Promise<Application> {
    const mongo = await getMongoClient();
    if (mongo) {
      const result = await mongo.db.collection("applications").insertOne(app);
      return { ...app, _id: result.insertedId } as Application;
    } else {
      const newApp: Application = {
        ...app,
        _id: "app_" + Date.now()
      };
      mockDbState.applications.push(newApp);
      saveMockDb();
      return newApp;
    }
  }

  static async getApplicationById(id: string): Promise<Application | null> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        return (await mongo.db.collection("applications").findOne({ _id: new ObjectId(id) })) as Application | null;
      } catch {
        return (await mongo.db.collection("applications").findOne({ _id: id as any })) as Application | null;
      }
    } else {
      const app = mockDbState.applications.find(a => String(a._id) === String(id));
      return app ? { ...app } : null;
    }
  }

  static async updateApplicationStatus(id: string, status: "accepted" | "rejected"): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("applications").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
      } catch {
        await mongo.db.collection("applications").updateOne({ _id: id as any }, { $set: { status } });
      }
    } else {
      const index = mockDbState.applications.findIndex(p => String(p._id) === String(id));
      if (index !== -1) {
        mockDbState.applications[index].status = status;
        saveMockDb();
      }
    }
  }

  // COMMAND QUEUE (HTTP API)
  static async addCommandToQueue(username: string, command: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("command_queue").insertOne({
        username,
        command,
        status: "pending",
        createdAt: new Date()
      });
    } else {
      mockDbState.command_queue.push({
        _id: "cmd_" + Date.now() + Math.random().toString(36).substr(2, 5),
        username,
        command,
        status: "pending",
        createdAt: new Date()
      });
      saveMockDb();
    }
  }

  static async getPendingCommands(limit: number): Promise<QueuedCommand[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("command_queue")
        .find({ status: "pending" })
        .limit(limit)
        .toArray()) as QueuedCommand[];
    } else {
      return mockDbState.command_queue
        .filter(c => c.status === "pending")
        .slice(0, limit);
    }
  }

  static async completeCommands(completedIds: string[], failedIds: string[]): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      if (completedIds.length > 0) {
        const objectIds = completedIds.map(id => {
          try { return new ObjectId(id); } catch { return id; }
        });
        await mongo.db.collection("command_queue").updateMany(
          { _id: { $in: objectIds as any } as any },
          { $set: { status: "completed", processedAt: new Date() } }
        );
        // Fallback for string-based IDs
        await mongo.db.collection("command_queue").updateMany(
          { _id: { $in: completedIds as any } as any },
          { $set: { status: "completed", processedAt: new Date() } }
        );
      }
      if (failedIds.length > 0) {
        const objectIds = failedIds.map(id => {
          try { return new ObjectId(id); } catch { return id; }
        });
        await mongo.db.collection("command_queue").updateMany(
          { _id: { $in: objectIds as any } as any },
          { $set: { status: "failed", processedAt: new Date() } }
        );
        // Fallback for string-based IDs
        await mongo.db.collection("command_queue").updateMany(
          { _id: { $in: failedIds as any } as any },
          { $set: { status: "failed", processedAt: new Date() } }
        );
      }
    } else {
      let changed = false;
      mockDbState.command_queue.forEach(c => {
        const strId = String(c._id);
        if (completedIds.includes(strId)) {
          c.status = "completed";
          changed = true;
        } else if (failedIds.includes(strId)) {
          c.status = "failed";
          changed = true;
        }
      });
      if (changed) {
        saveMockDb();
      }
    }
  }

  // ARTICLES
  static async getAllArticles(): Promise<Article[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("articles").find({}).sort({ createdAt: -1 }).toArray()) as Article[];
    } else {
      return [...mockDbState.articles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  static async createArticle(article: Omit<Article, "createdAt" | "views">): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("articles").insertOne({
        ...article,
        views: 0,
        createdAt: new Date()
      });
    } else {
      mockDbState.articles.push({
        ...article,
        _id: "art_" + Date.now(),
        views: 0,
        createdAt: new Date()
      });
      saveMockDb();
    }
  }

  static async deleteArticle(id: string): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("articles").deleteOne({ _id: new ObjectId(id) });
      } catch {
        await mongo.db.collection("articles").deleteOne({ _id: id as any });
      }
    } else {
      mockDbState.articles = mockDbState.articles.filter(a => String(a._id) !== String(id));
      saveMockDb();
    }
  }

  // CHEST
  static async getChestItems(username: string): Promise<ChestItem[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("chest_items").find({ username }).toArray()) as ChestItem[];
    } else {
      return mockDbState.chest_items.filter(c => c.username === username);
    }
  }

  static async addChestItem(item: Omit<ChestItem, "createdAt" | "status">): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("chest_items").insertOne({
        ...item,
        status: "in_chest",
        createdAt: new Date()
      });
    } else {
      mockDbState.chest_items.push({
        ...item,
        _id: "chest_" + Date.now() + Math.random().toString(36).substr(2, 5),
        status: "in_chest",
        createdAt: new Date()
      });
      saveMockDb();
    }
  }

  static async deliverChestItem(id: string): Promise<boolean> {
    const mongo = await getMongoClient();
    let item: ChestItem | null = null;

    if (mongo) {
      try {
        item = (await mongo.db.collection("chest_items").findOne({ _id: new ObjectId(id) })) as ChestItem | null;
        if (!item) {
          item = (await mongo.db.collection("chest_items").findOne({ _id: id as any })) as ChestItem | null;
        }
      } catch {
        item = (await mongo.db.collection("chest_items").findOne({ _id: id as any })) as ChestItem | null;
      }
    } else {
      item = mockDbState.chest_items.find(c => String(c._id) === String(id)) || null;
    }

    if (!item || item.status !== "in_chest") return false;

    // Queue commands
    for (const cmd of item.commands) {
      await this.addCommandToQueue(item.username, cmd);
    }

    // Mark as delivered
    if (mongo) {
      try {
        await mongo.db.collection("chest_items").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "delivered", deliveredAt: new Date() } }
        );
      } catch {
        await mongo.db.collection("chest_items").updateOne(
          { _id: id as any },
          { $set: { status: "delivered", deliveredAt: new Date() } }
        );
      }
    } else {
      const idx = mockDbState.chest_items.findIndex(c => String(c._id) === String(id));
      if (idx !== -1) {
        mockDbState.chest_items[idx].status = "delivered";
        mockDbState.chest_items[idx].deliveredAt = new Date();
        saveMockDb();
      }
    }

    return true;
  }

  // TOP CREDITS RANKING
  static async getTopCredits(limit: number = 5): Promise<User[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("users")
        .find({})
        .sort({ credits: -1 })
        .limit(limit)
        .toArray()) as User[];
    } else {
      return [...mockDbState.users]
        .sort((a, b) => b.credits - a.credits)
        .slice(0, limit);
    }
  }

  static async updateUserAdminStatus(username: string, isAdmin: boolean): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: { isAdmin } }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        user.isAdmin = isAdmin;
        saveMockDb();
      }
    }
  }

  static async deleteUserByUsername(username: string): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").deleteOne({ username_lower: lower });
    } else {
      mockDbState.users = mockDbState.users.filter(u => u.username_lower !== lower);
      saveMockDb();
    }
  }

  static async updatePurchaseRequestStatusById(id: string, status: "pending" | "completed" | "failed"): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("purchase_requests").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status, processedAt: new Date() } }
        );
      } catch {
        await mongo.db.collection("purchase_requests").updateOne(
          { _id: id as any },
          { $set: { status, processedAt: new Date() } }
        );
      }
    } else {
      const idx = mockDbState.purchase_requests.findIndex(p => String(p._id) === String(id));
      if (idx !== -1) {
        mockDbState.purchase_requests[idx].status = status;
        mockDbState.purchase_requests[idx].processedAt = new Date();
        saveMockDb();
      }
    }
  }

  // ONLINE STATUS TRACKING (In-Memory for real-time sync)
  private static onlinePlayers: Set<string> = new Set<string>();

  static isPlayerOnline(username: string): boolean {
    return this.onlinePlayers.has(username.toLowerCase());
  }

  static setPlayerOnline(username: string, isOnline: boolean): void {
    if (isOnline) {
      this.onlinePlayers.add(username.toLowerCase());
    } else {
      this.onlinePlayers.delete(username.toLowerCase());
    }
  }

  static getOnlinePlayers(): string[] {
    return Array.from(this.onlinePlayers);
  }

  static setOnlinePlayersList(players: string[]): void {
    this.onlinePlayers.clear();
    players.forEach(p => this.onlinePlayers.add(p.toLowerCase()));
  }

  // SUPPORT TICKETS CRUD
  static async getAllSupportTickets(): Promise<SupportTicket[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("support_tickets").find({}).sort({ createdAt: -1 }).toArray()) as SupportTicket[];
    } else {
      if (!mockDbState.support_tickets) mockDbState.support_tickets = [];
      return [...mockDbState.support_tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  static async createSupportTicket(ticket: Omit<SupportTicket, "_id" | "replies" | "status" | "createdAt">): Promise<SupportTicket> {
    const mongo = await getMongoClient();
    const newTicket: any = {
      ...ticket,
      status: "open",
      createdAt: new Date(),
      replies: []
    };

    if (mongo) {
      const result = await mongo.db.collection("support_tickets").insertOne(newTicket);
      newTicket._id = result.insertedId;
      return newTicket;
    } else {
      if (!mockDbState.support_tickets) mockDbState.support_tickets = [];
      newTicket._id = "ticket_" + Date.now();
      mockDbState.support_tickets.push(newTicket);
      saveMockDb();
      return newTicket;
    }
  }

  static async addTicketReply(id: string, reply: TicketReply): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("support_tickets").updateOne(
          { _id: new ObjectId(id) },
          { $push: { replies: reply } as any }
        );
      } catch {
        await mongo.db.collection("support_tickets").updateOne(
          { _id: id as any },
          { $push: { replies: reply } as any }
        );
      }
    } else {
      if (!mockDbState.support_tickets) mockDbState.support_tickets = [];
      const ticket = mockDbState.support_tickets.find(t => String(t._id) === String(id));
      if (ticket) {
        if (!ticket.replies) ticket.replies = [];
        ticket.replies.push(reply);
        saveMockDb();
      }
    }
  }

  static async updateTicketStatus(id: string, status: "open" | "closed"): Promise<void> {
    const mongo = await getMongoClient();
    if (mongo) {
      try {
        await mongo.db.collection("support_tickets").updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
      } catch {
        await mongo.db.collection("support_tickets").updateOne(
          { _id: id as any },
          { $set: { status } }
        );
      }
    } else {
      if (!mockDbState.support_tickets) mockDbState.support_tickets = [];
      const ticket = mockDbState.support_tickets.find(t => String(t._id) === String(id));
      if (ticket) {
        ticket.status = status;
        saveMockDb();
      }
    }
  }

  static async updateUserPermissions(username: string, permissions: string[]): Promise<void> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: { permissions } }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        user.permissions = permissions;
        saveMockDb();
      }
    }
  }

  static async createWheelLog(username: string, reward: string): Promise<WheelLog> {
    const mongo = await getMongoClient();
    const newLog: WheelLog = {
      username,
      reward,
      createdAt: new Date()
    };

    if (mongo) {
      const res = await mongo.db.collection("wheel_logs").insertOne(newLog);
      newLog._id = res.insertedId;
      return newLog;
    } else {
      if (!mockDbState.wheel_logs) mockDbState.wheel_logs = [];
      newLog._id = "wheel_log_" + Date.now();
      mockDbState.wheel_logs.unshift(newLog); // Prepend to show newest first in mock too
      saveMockDb();
      return newLog;
    }
  }

  static async getRecentWheelLogs(limit = 10): Promise<WheelLog[]> {
    const mongo = await getMongoClient();
    if (mongo) {
      return (await mongo.db.collection("wheel_logs")
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()) as WheelLog[];
    } else {
      if (!mockDbState.wheel_logs) mockDbState.wheel_logs = [];
      return [...mockDbState.wheel_logs]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }
  }

  // USER ROLE & PERMISSIONS UPDATE
  static async updateUserRoleAndPermissions(username: string, role: string, permissions: string[], isAdmin?: boolean): Promise<void> {
    const lower = username.toLowerCase();
    const updateObj: any = { role, permissions };
    if (typeof isAdmin === "boolean") {
      updateObj.isAdmin = isAdmin;
    }

    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("users").updateOne(
        { username_lower: lower },
        { $set: updateObj }
      );
    } else {
      const user = mockDbState.users.find(u => u.username_lower === lower);
      if (user) {
        user.role = role;
        user.permissions = permissions;
        if (typeof isAdmin === "boolean") user.isAdmin = isAdmin;
        saveMockDb();
      }
    }
  }

  // SEARCH PLAYERS
  static async searchPlayers(query: string): Promise<User[]> {
    const qLower = (query || "").toLowerCase().trim();
    const mongo = await getMongoClient();
    if (mongo) {
      const filter = qLower
        ? { username_lower: { $regex: qLower, $options: "i" } }
        : {};
      return (await mongo.db.collection("users").find(filter).limit(20).toArray()) as User[];
    } else {
      let list = mockDbState.users;
      if (qLower) {
        list = list.filter(u => u.username_lower.includes(qLower) || u.username.toLowerCase().includes(qLower));
      }
      return list.slice(0, 20);
    }
  }

  // FRIENDSHIP METHODS
  static async sendFriendRequest(requester: string, recipient: string): Promise<{ success: boolean; message: string }> {
    const reqLower = requester.toLowerCase();
    const recLower = recipient.toLowerCase();

    if (reqLower === recLower) {
      return { success: false, message: "Kendinize arkadaşlık isteği gönderemezsiniz." };
    }

    const recipientUser = await this.findUserByUsername(recLower);
    if (!recipientUser) {
      return { success: false, message: "Oyuncu bulunamadı." };
    }

    const mongo = await getMongoClient();
    if (mongo) {
      const existing = await mongo.db.collection("friendships").findOne({
        $or: [
          { requester: reqLower, recipient: recLower },
          { requester: recLower, recipient: reqLower }
        ]
      });

      if (existing) {
        if (existing.status === "accepted") {
          return { success: false, message: "Bu oyuncu zaten arkadaşınız." };
        }
        return { success: false, message: "Zaten bekleyen bir arkadaşlık isteği mevcut." };
      }

      await mongo.db.collection("friendships").insertOne({
        requester: reqLower,
        recipient: recLower,
        status: "pending",
        createdAt: new Date()
      });
      return { success: true, message: "Arkadaşlık isteği gönderildi!" };
    } else {
      if (!mockDbState.friendships) mockDbState.friendships = [];
      const existing = mockDbState.friendships.find(f =>
        (f.requester === reqLower && f.recipient === recLower) ||
        (f.requester === recLower && f.recipient === reqLower)
      );

      if (existing) {
        if (existing.status === "accepted") {
          return { success: false, message: "Bu oyuncu zaten arkadaşınız." };
        }
        return { success: false, message: "Zaten bekleyen bir arkadaşlık isteği mevcut." };
      }

      mockDbState.friendships.push({
        _id: "friend_" + Date.now(),
        requester: reqLower,
        recipient: recLower,
        status: "pending",
        createdAt: new Date()
      });
      saveMockDb();
      return { success: true, message: "Arkadaşlık isteği gönderildi!" };
    }
  }

  static async respondFriendRequest(requester: string, recipient: string, action: "accept" | "reject" | "cancel"): Promise<{ success: boolean; message: string }> {
    const reqLower = requester.toLowerCase();
    const recLower = recipient.toLowerCase();

    const mongo = await getMongoClient();
    if (mongo) {
      if (action === "accept") {
        await mongo.db.collection("friendships").updateOne(
          { requester: reqLower, recipient: recLower, status: "pending" },
          { $set: { status: "accepted" } }
        );
        return { success: true, message: "Arkadaşlık isteği kabul edildi." };
      } else {
        await mongo.db.collection("friendships").deleteOne({
          requester: reqLower,
          recipient: recLower
        });
        return { success: true, message: action === "cancel" ? "İstek iptal edildi." : "İstek reddedildi." };
      }
    } else {
      if (!mockDbState.friendships) mockDbState.friendships = [];
      const index = mockDbState.friendships.findIndex(f => f.requester === reqLower && f.recipient === recLower);
      if (index !== -1) {
        if (action === "accept") {
          mockDbState.friendships[index].status = "accepted";
        } else {
          mockDbState.friendships.splice(index, 1);
        }
        saveMockDb();
        return { success: true, message: action === "accept" ? "Kabul edildi." : "İstek kaldırıldı." };
      }
      return { success: false, message: "İstek bulunamadı." };
    }
  }

  static async removeFriend(user1: string, user2: string): Promise<void> {
    const u1 = user1.toLowerCase();
    const u2 = user2.toLowerCase();

    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("friendships").deleteMany({
        $or: [
          { requester: u1, recipient: u2 },
          { requester: u2, recipient: u1 }
        ]
      });
    } else {
      if (!mockDbState.friendships) mockDbState.friendships = [];
      mockDbState.friendships = mockDbState.friendships.filter(f =>
        !((f.requester === u1 && f.recipient === u2) || (f.requester === u2 && f.recipient === u1))
      );
      saveMockDb();
    }
  }

  static async getFriendships(username: string): Promise<{
    friends: Array<{ username: string; role?: string; registerDate?: Date | string; lastMessage?: string; lastMessageTime?: Date | string; unreadCount: number }>;
    receivedRequests: Array<{ requester: string; role?: string; createdAt: Date | string }>;
    sentRequests: Array<{ recipient: string; role?: string; createdAt: Date | string }>;
  }> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();

    let allFriendships: Friendship[] = [];
    if (mongo) {
      allFriendships = (await mongo.db.collection("friendships").find({
        $or: [{ requester: lower }, { recipient: lower }]
      }).toArray()) as Friendship[];
    } else {
      if (!mockDbState.friendships) mockDbState.friendships = [];
      allFriendships = mockDbState.friendships.filter(f => f.requester === lower || f.recipient === lower);
    }

    const acceptedFriendsList: string[] = [];
    const receivedRequests: Array<{ requester: string; role?: string; createdAt: Date | string }> = [];
    const sentRequests: Array<{ recipient: string; role?: string; createdAt: Date | string }> = [];

    for (const f of allFriendships) {
      if (f.status === "accepted") {
        const friendName = f.requester === lower ? f.recipient : f.requester;
        acceptedFriendsList.push(friendName);
      } else if (f.status === "pending") {
        if (f.recipient === lower) {
          const u = await this.findUserByUsername(f.requester);
          receivedRequests.push({
            requester: u ? u.username : f.requester,
            role: u?.role || (u?.isAdmin ? "Yönetici" : "Oyuncu"),
            createdAt: f.createdAt
          });
        } else if (f.requester === lower) {
          const u = await this.findUserByUsername(f.recipient);
          sentRequests.push({
            recipient: u ? u.username : f.recipient,
            role: u?.role || (u?.isAdmin ? "Yönetici" : "Oyuncu"),
            createdAt: f.createdAt
          });
        }
      }
    }

    // Build rich details for accepted friends including last message and unread count
    const friends: Array<{ username: string; role?: string; registerDate?: Date | string; lastMessage?: string; lastMessageTime?: Date | string; unreadCount: number }> = [];

    for (const friendLower of acceptedFriendsList) {
      const friendUser = await this.findUserByUsername(friendLower);
      if (!friendUser) continue;

      // Fetch last message between user and friend
      let lastMsgText = "";
      let lastMsgTime: Date | string | undefined = undefined;
      let unreadCount = 0;

      if (mongo) {
        const lastMsg = await mongo.db.collection("direct_messages").findOne(
          {
            $or: [
              { sender: lower, recipient: friendLower },
              { sender: friendLower, recipient: lower }
            ]
          },
          { sort: { createdAt: -1 } }
        );
        if (lastMsg) {
          lastMsgText = lastMsg.message;
          lastMsgTime = lastMsg.createdAt;
        }

        unreadCount = await mongo.db.collection("direct_messages").countDocuments({
          sender: friendLower,
          recipient: lower,
          read: false
        });
      } else {
        if (!mockDbState.direct_messages) mockDbState.direct_messages = [];
        const msgs = mockDbState.direct_messages
          .filter(m => (m.sender === lower && m.recipient === friendLower) || (m.sender === friendLower && m.recipient === lower))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (msgs.length > 0) {
          lastMsgText = msgs[0].message;
          lastMsgTime = msgs[0].createdAt;
        }

        unreadCount = mockDbState.direct_messages.filter(m => m.sender === friendLower && m.recipient === lower && !m.read).length;
      }

      friends.push({
        username: friendUser.username,
        role: friendUser.role || (friendUser.isAdmin ? "Yönetici" : "Oyuncu"),
        registerDate: friendUser.registerDate,
        lastMessage: lastMsgText,
        lastMessageTime: lastMsgTime,
        unreadCount
      });
    }

    return { friends, receivedRequests, sentRequests };
  }

  // DIRECT MESSAGING METHODS
  static async sendDirectMessage(sender: string, recipient: string, message: string): Promise<DirectMessage> {
    const sndLower = sender.toLowerCase();
    const recLower = recipient.toLowerCase();
    const msgTrimmed = (message || "").trim();

    if (!msgTrimmed) {
      throw new Error("Mesaj boş olamaz.");
    }

    const newMsg: DirectMessage = {
      sender: sndLower,
      recipient: recLower,
      message: msgTrimmed,
      read: false,
      createdAt: new Date()
    };

    const mongo = await getMongoClient();
    if (mongo) {
      const res = await mongo.db.collection("direct_messages").insertOne(newMsg);
      newMsg._id = res.insertedId;
      return newMsg;
    } else {
      if (!mockDbState.direct_messages) mockDbState.direct_messages = [];
      newMsg._id = "msg_" + Date.now();
      mockDbState.direct_messages.push(newMsg);
      saveMockDb();
      return newMsg;
    }
  }

  static async getConversationMessages(user1: string, user2: string): Promise<DirectMessage[]> {
    const u1 = user1.toLowerCase();
    const u2 = user2.toLowerCase();

    const mongo = await getMongoClient();

    // Automatically mark all messages from user2 to user1 as read
    if (mongo) {
      await mongo.db.collection("direct_messages").updateMany(
        { sender: u2, recipient: u1, read: false },
        { $set: { read: true } }
      );

      return (await mongo.db.collection("direct_messages").find({
        $or: [
          { sender: u1, recipient: u2 },
          { sender: u2, recipient: u1 }
        ]
      }).sort({ createdAt: 1 }).toArray()) as DirectMessage[];
    } else {
      if (!mockDbState.direct_messages) mockDbState.direct_messages = [];
      mockDbState.direct_messages.forEach(m => {
        if (m.sender === u2 && m.recipient === u1 && !m.read) {
          m.read = true;
        }
      });
      saveMockDb();

      return mockDbState.direct_messages
        .filter(m => (m.sender === u1 && m.recipient === u2) || (m.sender === u2 && m.recipient === u1))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }

  static async getUnreadMessageCount(username: string): Promise<number> {
    const lower = username.toLowerCase();
    const mongo = await getMongoClient();
    if (mongo) {
      return await mongo.db.collection("direct_messages").countDocuments({
        recipient: lower,
        read: false
      });
    } else {
      if (!mockDbState.direct_messages) mockDbState.direct_messages = [];
      return mockDbState.direct_messages.filter(m => m.recipient === lower && !m.read).length;
    }
  }
}
