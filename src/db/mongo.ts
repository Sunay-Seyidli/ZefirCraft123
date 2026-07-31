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
  enabled?: boolean;
}

export interface EarnSettings {
  adsterraUrl: string;
  monlixUrl?: string;
  adRewardCredits: number;
  adCooldownMinutes: number;
  dailyBonusCredits: number;
  enabled?: boolean;
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
  { id: "q1", question: "Minecraft resmi olarak ilk kez hangi yılda tam sürüm olarak satışa sunulmıştır?", options: ["2009", "2011", "2013", "2015"], correctIndex: 1 },
  { id: "q2", question: "Nether portalı (Cehennem Kapısı) oluşturmak için minimum kaç adet Obsidian (Obsidyen - 🧱 Mor/Siyah Sert Blok) gereklidir?", options: ["8 Adet", "10 Adet", "12 Adet", "14 Adet"], correctIndex: 1 },
  { id: "q3", question: "Creeper (🟩 Yeşil Patlayan Yaratık) yaratığına şimşek çaktığında hangi güçlü forma dönüşür?", options: ["Ateşli Creeper", "⚡ Yüklü (Charged) Creeper", "Büyük Creeper", "Mavi Creeper"], correctIndex: 1 },
  { id: "q4", question: "Ender Ejderhası (Ender Dragon - 🐉 Mor Gözlü Ejderha) ilk kez yenildiğinde kaç XP seviyesi kazandırır?", options: ["20 Seviye", "35 Seviye", "68 Seviye", "100 Seviye"], correctIndex: 2 },
  { id: "q5", question: "Köylüler (Villagers - 🧑‍🌾) ile ticaret yaparken kullanılan temel değerli taş hangisidir?", options: ["💎 Elmas (Diamond)", "🟩 Zümrüt (Emerald)", "🟡 Altın (Gold)", "🔴 Kızıltaş (Redstone)"], correctIndex: 1 },
  { id: "q6", question: "Büyü Masasında (Enchantment Table) 30. seviye büyü açmak için etrafına kaç Kitaplık yerleştirilmelidir?", options: ["12 Kitaplık", "15 Kitaplık", "18 Kitaplık", "20 Kitaplık"], correctIndex: 1 },
  { id: "q7", question: "Elmas Kazma (Diamond Pickaxe - ⛏️) üretmek için kaç Elmas ve kaç Çubuk gereklidir?", options: ["2 Elmas, 3 Çubuk", "3 Elmas, 2 Çubuk", "3 Elmas, 3 Çubuk", "4 Elmas, 2 Çubuk"], correctIndex: 1 },
  { id: "q8", question: "Aşağıdaki yaratıklardan hangisi Minecraft'ta oyuncu tarafından evcilleştirilemez?", options: ["🐺 Kurt (Wolf)", "🐱 Kedi (Cat)", "🦜 Papağan (Parrot)", "🕷️ Örümcek (Spider)"], correctIndex: 3 },
  { id: "q9", question: "Beacon (Fener) bloğunu aktifleştirmek için altındaki piramit hangi cevherden YAPILAMAZ?", options: ["⬜ Demir Bloğu", "🟡 Altın Bloğu", "🟩 Zümrüt Bloğu", "⬛ Kömür Bloğu"], correctIndex: 3 },
  { id: "q10", question: "Phantom (🦇 Gece Uçan Yaratık) oyuncunun kaç gün boyunca uyumaması durumunda saldırmaya başlar?", options: ["1 Gün", "2 Gün", "3 Gün", "5 Gün"], correctIndex: 2 },
  { id: "q11", question: "Wither boss yaratığını çağırmak için kaç Ruh Kumu ve kaç Wither İskelet Kafası gereklidir?", options: ["3 Ruh Kumu, 3 Kafa", "4 Ruh Kumu, 3 Kafa", "4 Ruh Kumu, 2 Kafa", "5 Ruh Kumu, 4 Kafa"], correctIndex: 1 },
  { id: "q12", question: "Aşağıdaki eşyalardan hangisi Kızıltaş sinyalini tersine çevirmek (Invert) için kullanılır?", options: ["🔥 Kızıltaş Meşalesi", "⏱️ Yineleyici (Repeater)", "🔍 Karşılaştırıcı (Comparator)", "🧱 Piston"], correctIndex: 0 },
  { id: "q13", question: "Minecraft'ta tam bir gündüz ve gece döngüsü gerçek hayatta kaç dakika sürer?", options: ["10 Dakika", "15 Dakika", "20 Dakika", "30 Dakika"], correctIndex: 2 },
  { id: "q14", question: "Kurtları (Wolf - 🐺) iyileştirmek veya çiftleştirmek için ne verilmelidir?", options: ["🦴 Kemik", "🥩 Çiğ veya Pişmiş Et", "🍎 Elma", "🌾 Buğday"], correctIndex: 1 },
  { id: "q15", question: "Hayatta kalma (Survival) modunda kırılamayan katman kayası bloğu hangisidir?", options: ["🧱 Obsidyen", "🪨 Bedrock (Katman Kayası)", "🔥 Netherite Bloğu", "🌑 Derin Taş"], correctIndex: 1 },
  { id: "q16", question: "Netherite (Siyah Güçlü Maden - 🖤) zırh yapmak için hangi eşya geliştirilir?", options: ["Demir Zırh", "Altın Zırh", "💎 Elmas Zırh", "Zümrüt Zırh"], correctIndex: 2 },
  { id: "q17", question: "Enderman (💜 Mor Gözlü Uzun Yaratık) oyuncuya ne zaman saldırır?", options: ["Yalınayak yüründüğünde", "Gözlerinin içine bakıldığında", "Gece olduğunda", "Suya girdiğinde"], correctIndex: 1 },
  { id: "q18", question: "Alex ve Steve karakterlerinin varsayılan kol genişlikleri sırasıyla kaç pikseldir?", options: ["3 Piksel / 4 Piksel", "4 Piksel / 4 Piksel", "2 Piksel / 3 Piksel", "3 Piksel / 3 Piksel"], correctIndex: 0 },
  { id: "q19", question: "Köylüleri zombiye dönüştükten sonra iyileştirmek için hangi iksir ve meyve kullanılır?", options: ["Görünmezlik İksiri & Elma", "Zayıflık İksiri & 🟡 Altın Elma", "Güç İksiri & Havuç", "İyileşme İksiri & Karpuz"], correctIndex: 1 },
  { id: "q20", question: "Aşağıdaki iksir malzemelerinden hangisi Hız İksiri (Swiftness) yapmak için gereklidir?", options: ["Magma Kremi", "⚡ Şeker", "Örümcek Gözü", "Işık Taşı Tozu"], correctIndex: 1 },
  { id: "q21", question: "Minecraft'ta Kediler (Cats) hangi yaratığı korkutup kaçırır?", options: ["🧟 Zombi", "🟩 Creeper", "💀 İskelet", "🕷️ Örümcek"], correctIndex: 1 },
  { id: "q22", question: "Kurtları evcilleştirmek için hangi eşya kullanılır?", options: ["🥩 Çiğ Et", "🦴 Kemik", "🐟 Balık", "🌾 Buğday"], correctIndex: 1 },
  { id: "q23", question: "Kedileri evcilleştirmek için hangi yiyecek verilmelidir?", options: ["🦴 Kemik", "🐟 Çiğ Morina veya Somon Balığı", "🥩 Çiğ Tavuk", "🍎 Elma"], correctIndex: 1 },
  { id: "q24", question: "Aşağıdakilerden hangisi Nether boyutunda doğal olarak yetişen mantar türlerinden biridir?", options: ["Kırmızı Mantar", "🔥 Çarpık (Warped) Mantar", "Sarı Mantar", "Yeşil Mantar"], correctIndex: 1 },
  { id: "q25", question: "Su altında nefes almayı sağlayan kask büyüsü hangisidir?", options: ["Derinlik Koşucusu", "Solunum (Respiration)", "Sudakı Lütuf", "Su Koruması"], correctIndex: 1 },
  { id: "q26", question: "Deniz Kabuğu (Nautilus Shell) ve Deniz Kalbi (Heart of the Sea) birleştirilerek hangi blok yapılır?", options: ["Beacon (Fener)", "🌊 Oluk (Conduit)", "Sünger", "Deniz Feneri"], correctIndex: 1 },
  { id: "q27", question: "Büyülü Altın Elma (Enchanted Golden Apple) oyuncuya aşağıdaki efektlerden hangisini VERMEZ?", options: ["Yenilenme II", "Direnç I", "Ateş Direnci", "⚡ Görünmezlik"], correctIndex: 3 },
  { id: "q28", question: "Ender Gözü (Eye of Ender) üretmek için hangi iki eşya birleştirilir?", options: ["Ender İnci & 🔥 Blaze Tozu", "Ender İnci & Elmas", "Ender İnci & Barut", "Göz & Işık Taşı"], correctIndex: 0 },
  { id: "q29", question: "Demir Golem (Iron Golem - 🤖) oluşturmak için kaç Demir Bloğu ve kaç Oyulmuş Balkabağı gerekir?", options: ["3 Demir Bloğu, 1 Balkabağı", "4 Demir Bloğu, 1 Balkabağı", "4 Demir Bloğu, 2 Balkabağı", "5 Demir Bloğu, 1 Balkabağı"], correctIndex: 1 },
  { id: "q30", question: "Minecraft'ta Müzik Kutusu (Jukebox) üretmek için merkezde hangi değerli eşya kullanılır?", options: ["🟡 Altın", "🟩 Zümrüt", "💎 Elmas", "🔴 Kızıltaş"], correctIndex: 2 },
  { id: "q31", question: "Kılıç üzerine koyulabilen ve yaratıklardan daha fazla eşya/ganimet düşmesini sağlayan büyü hangisidir?", options: ["Keskinlik (Sharpness)", "Ganimet (Looting)", "Savurma (Knockback)", "Darbe (Smite)"], correctIndex: 1 },
  { id: "q32", question: "Kazma ile cevher kırıldığında bloğun kendisini doğrudan düşüren büyü hangisidir?", options: ["İpeksi Dokunuş (Silk Touch)", "Servet (Fortune)", "Kırılmazlık", "Verimlilik"], correctIndex: 0 },
  { id: "q33", question: "Minecraft boyutları arasında kaç adet ana boyut bulunmaktadır?", options: ["2 Boyut", "3 Boyut (Dünya, Nether, End)", "4 Boyut", "5 Boyut"], correctIndex: 1 },
  { id: "q34", question: "Nether portalından geçerken 1 blok Mesafe Dünya'da kaç bloğa denk gelir?", options: ["3 Blok", "5 Blok", "8 Blok", "10 Blok"], correctIndex: 2 },
  { id: "q35", question: "Sniffer (Koklayıcı - 🌺) yaratığı yumurtadan çıkarıldıktan sonra hangi nadir tohumları bulabilir?", options: ["Buğday Tohumu", "🌺 Meşale Çiçeği & Sürahi Tohumu", "Karpuz Tohumu", "Balkabağı Tohumu"], correctIndex: 1 },
  { id: "q36", question: "Minecraft'ta Tavuklar hangi yiyecekle beslenip çiftleştirilir?", options: ["🌾 Buğday", "🌽 Tohumlar (Seeds)", "🥕 Havuç", "🍎 Elma"], correctIndex: 1 },
  { id: "q37", question: "İnekler ve Koyunlar hangi ürünle beslenip çiftleştirilir?", options: ["🌾 Buğday", "🥕 Havuç", "🥔 Patates", "🍎 Elma"], correctIndex: 0 },
  { id: "q38", question: "Domuzları (Pigs) sürmek ve yönlendirmek için oltanın ucuna ne takılır?", options: ["🌾 Buğday", "🥕 Havuç", "🍎 Elma", "🍞 Ekmek"], correctIndex: 1 },
  { id: "q39", question: "Atları çiftleştirmek için kullanılan en etkili altın yiyecek hangisidir?", options: ["🟡 Altın Elma veya Altın Havuç", "Çiğ Et", "Buğday", "Şeker"], correctIndex: 0 },
  { id: "q40", question: "Lama (Llama) yaratıkları eşya taşımak için sırtlarına ne takılmasına izin verir?", options: ["Çanta", "📦 Sandık (Chest)", "Fırın", "Varil"], correctIndex: 1 },
  { id: "q41", question: "Nether'da bulunan Ghast (Uçan Beyaz Yaratık) öldüğünde hangi değerli malzemeyi düşürür?", options: ["💧 Ghast Gözyaşı", "Ruh Kumu", "Blaze Çubuğu", "Işık Taşı"], correctIndex: 0 },
  { id: "q42", question: "Blaze yaratığı öldürüldüğünde ne düşürür?", options: ["🔥 Blaze Çubuğu", "Ateş Topu", "Kızıltaş", "Lav Kovası"], correctIndex: 0 },
  { id: "q43", question: "İskeletler ve Zombiler gündüz güneşe maruz kaldığında ne olur?", options: ["Patlar", "🔥 Alev alıp yanarlar", "Işınlanırlar", "Büyürler"], correctIndex: 1 },
  { id: "q44", question: "Örümcekler gündüz vakti ışık seviyesi yüksekken oyuncuya nasıl davranırlar?", options: ["Doğrudan saldırırlar", "😴 Tarafsızdırlar (Saldırmazlar)", "Kaçarlar", "Ölürler"], correctIndex: 1 },
  { id: "q45", question: "Minecraft'ta Olta ile tutulabilen en nadir hazine büyü kitabı büyüsü hangisidir?", options: ["Kırılmazlık III", "✨ Tamir (Mending)", "Keskinlik I", "Koruma I"], correctIndex: 1 },
  { id: "q46", question: "Tamir (Mending) büyüsü eşyaları ne kullanarak otomatik tamir eder?", options: ["Demir", "✨ XP (Deneyim Puanı)", "Elmas", "Örs"], correctIndex: 1 },
  { id: "q47", question: "Örs (Anvil) yapmak için kaç Demir Külçesi ve kaç Demir Bloğu gereklidir?", options: ["3 Demir Bloğu, 4 Demir Külçesi", "4 Demir Bloğu, 3 Demir Külçesi", "2 Demir Bloğu, 5 Demir Külçesi", "5 Demir Bloğu, 2 Demir Külçesi"], correctIndex: 0 },
  { id: "q48", question: "Minecraft'ta deniz feneri görevi gören ve su altı yaratıklarına saldıran yapı hangisidir?", options: ["Beacon", "🌊 Oluk (Conduit)", "Sünger", "Mercan"], correctIndex: 1 },
  { id: "q49", question: "Shulker Kutusu (Shulker Box) üretmek için ne gereklidir?", options: ["📦 2 Shulker Kabuğu + 1 Sandık", "4 Shulker Kabuğu", "2 Sandık", "1 Shulker Kabuğu + 2 Demir"], correctIndex: 0 },
  { id: "q50", question: "Elytra (Süzülme Kanatları) nerede bulunur?", options: ["Nether Kalesinde", "🐉 End Gemisinde (End Ship)", "Maden Tünelinde", "Okyanus Tapınağında"], correctIndex: 1 },
  { id: "q51", question: "Elytra ile uçarken havada hızlanmak için elinizde ne kullanırsınız?", options: ["Tüy", "🚀 Havai Fişek", "Rüzgar Küresi", "Ateş Yükü"], correctIndex: 1 },
  { id: "q52", question: "Slime (Yeşil Zıpzıp) yaratığı öldüğünde ne düşürür?", options: ["🟢 Slime Topu", "Yapışkan Piston", "Bal Topu", "Yeşil Boya"], correctIndex: 0 },
  { id: "q53", question: "Yapışkan Piston (Sticky Piston) yapmak için normal pistona ne eklenir?", options: ["Bal Bloğu", "🟢 Slime Topu", "Kızıltaş", "İp"], correctIndex: 1 },
  { id: "q54", question: "Bal Arıları (Bees) kovanından bal toplarken saldırmamaları için kovanın altına ne koyulur?", options: ["Su", "🔥 Kamp Ateşi (Campfire)", "Meşale", "Çiçek"], correctIndex: 1 },
  { id: "q55", question: "Aksolotl (Axolotl) savaşa götürüldüğünde oyuncuya hangi desteği verir?", options: ["✨ Yenilenme (Regeneration)", "⚡ Hız", "💪 Güç", "Görünmezlik"], correctIndex: 0 },
  { id: "q56", question: "Kurbağalar (Frogs) küçük magma küplerini yediklerinde ne üretirler?", options: ["Magma Kremi", "🐸 Kurbağa Işığı (Froglight)", "Işık Taşı", "Balçık"], correctIndex: 1 },
  { id: "q57", question: "Warden (Kör Muhafız) yaratığı hangi biyom ve yapıda ortaya çıkar?", options: ["Nether Kalesi", "🏛️ Derin Karanlık (Deep Dark / Antik Şehir)", "Maden Tüneli", "Çöl Tapınağı"], correctIndex: 1 },
  { id: "q58", question: "Warden yaratığı oyuncunun varlığını nasıl tespit eder?", options: ["Gözleriyle bakarak", "🔊 Titreşim ve Sesleri algılayarak", "Kokusunu alarak", "Işığa bakarak"], correctIndex: 1 },
  { id: "q59", question: "Sculk Sensör (Sculk Sensor) bloğu neye duyarlıdır?", options: ["Işığa", "🔊 Ses ve Titreşimlere", "Ateşe", "Suya"], correctIndex: 1 },
  { id: "q60", question: "Netherite Külçesi (Netherite Ingot) yapmak için kaç Netherite Hurdası ve Altın Külçesi gerekir?", options: ["4 Netherite Hurdası, 4 Altın Külçesi", "2 Netherite Hurdası, 2 Altın Külçesi", "3 Netherite Hurdası, 3 Altın Külçesi", "5 Netherite Hurdası, 5 Altın Külçesi"], correctIndex: 0 },
  { id: "q61", question: "Minecraft'ta Pusula (Compass) ibresi varsayılan olarak nereyi gösterir?", options: ["Kuzey Yönünü", "🏠 Doğuş Noktasını (World Spawn)", "En Yakın Köyü", "Madenleri"], correctIndex: 1 },
  { id: "q62", question: "Mıknatıs Taşı (Lodestone) ile etkileşime giren pusula neyi göstermeye başlar?", options: ["Doğuş Noktasını", "🧲 Mıknatıs Taşının Konumunu", "Kuzeyi", "Elmasları"], correctIndex: 1 },
  { id: "q63", question: "Saat (Clock) üretmek için kızıltaşın etrafına hangi maden külçesi dizilir?", options: ["Demir", "🟡 Altın Külçesi", "Elmas", "Bakır"], correctIndex: 1 },
  { id: "q64", question: "Süzme İksir (Splash Potion) yapmak için normal iksire ne eklenir?", options: ["💥 Barut", "Işık Taşı Tozu", "Kızıltaş", "Ejderha Nefesi"], correctIndex: 0 },
  { id: "q65", question: "Kalıcı İksir (Lingering Potion) yapmak için süzme iksire ne eklenir?", options: ["🐲 Ejderha Nefesi", "Barut", "Magma Kremi", "Göz"], correctIndex: 0 },
  { id: "q66", question: "Minecraft'ta Trident (Üçlü Mızrak) hangi yaratık öldürüldüğünde düşebilir?", options: ["🧟 Boğulmuş (Drowned)", "İskelet", "Zombi", "Gardiyan"], correctIndex: 0 },
  { id: "q67", question: "Trident mızrağına 'Sadakat' (Loyalty) büyüsü basıldığında ne olur?", options: ["Mızrak alev alır", "🎯 Fırlatıldıktan sonra sahibine geri döner", "Yıldırım çaktırır", "Suda hızlı yüzdürür"], correctIndex: 1 },
  { id: "q68", question: "Trident mızrağına 'Yıldırım' (Channeling) büyüsü basıldığında ne zaman yıldırım çakar?", options: ["Her zaman", "🌩️ Fırtınalı havalarda", "Gece vakti", "Nether'da"], correctIndex: 1 },
  { id: "q69", question: "Trident ile suyun içinden fırlayarak uçmayı sağlayan büyü hangisidir?", options: ["🌊 Girdap (Riptide)", "Sadakat", "Savurma", "Mızrak Darbesi"], correctIndex: 0 },
  { id: "q70", question: "Minecraft'ta Papağanlar müzik kutusu çaldığında ne yaparlar?", options: ["Kaçarlar", "💃 Dans ederler", "Uykulara dalarlar", "Öterler"], correctIndex: 1 },
  { id: "q71", question: "Aşağıdaki renklerden hangisi Minecraft'ta mürekkep kesesinden elde edilir?", options: ["Kırmızı", "Sarı", "Mavi", "⬛ Siyah"], correctIndex: 3 },
  { id: "q72", question: "Gözlemci (Observer) bloğu ne işe yarar?", options: ["Işık saçar", "🔍 Önündeki blok değişimini algılayıp sinyal verir", "Kameralı görünüm sağlar", "Sesi yükseltir"], correctIndex: 1 },
  { id: "q73", question: "Kızıltaş Karşılaştırıcı (Comparator) arkasındaki sandığın neyini ölçer?", options: ["Ağırlığını", "📦 İçindeki eşya doluluk oranını", "Sandık türünü", "Sıcaklığını"], correctIndex: 1 },
  { id: "q74", question: "Minecraft'ta Islak Sünger (Wet Sponge) fırında pişirilirse ne olur?", options: ["Yanar", "🧽 Kuru Sünger olur", "Taş olur", "Kaybolur"], correctIndex: 1 },
  { id: "q75", question: "Okyanus Tapınağı (Ocean Monument) koruyucusu ana boss yaratık hangisidir?", options: ["Muhafız", "👁️ Yaşlı Muhafız (Elder Guardian)", "Boğulmuş", "Aksolotl"], correctIndex: 1 },
  { id: "q76", question: "Yaşlı Muhafız oyuncuya hangi kötü efekti verir?", options: ["Körlük", "⛏️ Madenci Yorgunluğu (Mining Fatigue)", "Zehir", "Yavaşlık"], correctIndex: 1 },
  { id: "q77", question: "Süt Kovası (Bucket of Milk) içildiğinde ne olur?", options: ["Can tazeler", "✨ Tüm aktif efektleri (iyi ve kötü) temizler", "Açlığı doyurur", "Hızlandırır"], correctIndex: 1 },
  { id: "q78", question: "Bal Kovanından Makas (Shears) ile ne toplanır?", options: ["Bal Şişesi", "🐝 Petek (Honeycomb)", "Çiçek", "Bal Kütlesi"], correctIndex: 1 },
  { id: "q79", question: "Minecraft'ta Yıldırım Siperi (Lightning Rod) hangi madenden yapılır?", options: ["Demir", "🥉 Bakır (Copper)", "Altın", "Kızıltaş"], correctIndex: 1 },
  { id: "q80", question: "Bakır blokları zamanla açık havada kaldığında ne renk alır?", options: ["Siyah", "🟩 Yeşile döner (Oksitlenir)", "Mavi", "Kırmızı"], correctIndex: 1 },
  { id: "q81", question: "Bakır blokların oksitlenmesini durdurmak için üzerine ne sürülür?", options: ["Slime", "🐝 Bal mumu (Waxed / Petek)", "Yağ", "Su"], correctIndex: 1 },
  { id: "q82", question: "Aşağıdaki büyülerden hangisi Olta (Fishing Rod) için kullanılır?", options: ["Keskinlik", "🎣 Deniz Lütfu (Luck of the Sea)", "Ganimet", "Güç"], correctIndex: 1 },
  { id: "q83", question: "Yay (Bow) silahına 'Sonsuzluk' (Infinity) büyüsü basıldığında çantada kaç ok olması yeterlidir?", options: ["0 Ok", "🎯 1 Adet Ok", "10 Ok", "64 Ok"], correctIndex: 1 },
  { id: "q84", question: "Sonsuzluk (Infinity) büyüsü ile hangi büyü aynı yaya BİRLİKTE basılamaz?", options: ["Güç", "✨ Tamir (Mending)", "Kırılmazlık", "Alev"], correctIndex: 1 },
  { id: "q85", question: "Fırlatıcı (Dispenser) ile Bırakıcı (Dropper) arasındaki temel fark nedir?", options: ["Ağırlığı", "🏹 Fırlatıcı oku fırlatır/zırhı giydirir, Bırakıcı eşyayı yere atar", "Hiçbir fark yoktur", "Kapasitesi"], correctIndex: 1 },
  { id: "q86", question: "TNT patlayıcısı üretmek için kaç Kum ve kaç Barut gereklidir?", options: ["4 Barut, 5 Kum", "💥 5 Barut, 4 Kum", "3 Barut, 6 Kum", "6 Barut, 3 Kum"], correctIndex: 1 },
  { id: "q87", question: "Minecraft'ta Kamp Ateşi (Campfire) üzerinde aynı anda kaç adet yemek pişirilebilir?", options: ["2 Yemek", "3 Yemek", "🥩 4 Yemek", "6 Yemek"], correctIndex: 2 },
  { id: "q88", question: "Maden Arabası (Minecart) için Hızlı Ray (Powered Rail) çalıştırmak ne gerektirir?", options: ["Kömür", "⚡ Kızıltaş Sinyali (Redstone)", "Ateş", "Demir"], correctIndex: 1 },
  { id: "q89", question: "Çöl Tapınağındaki (Desert Pyramid) gizli sandık odasının ortasında ne tuzağı bulunur?", options: ["Lav", "💥 TNT Tuzağı ve Basınç Plakası", "Aptal Zombi", "Ok Fırlatıcı"], correctIndex: 1 },
  { id: "q90", question: "Orman Tapınağındaki (Jungle Temple) bulmaca sandığına ulaşmak için ne çözülür?", options: ["Şifreli Kapı", "🕹️ Şalter / Kol Kombinasyonu", "Parkur", "Soru"], correctIndex: 1 },
  { id: "q91", question: "Minecraft'ta Bir Harita (Map) büyütülmek istenirse Kartograf Masasında ne ile birleştirilir?", options: ["İp", "📜 Kağıt", "Mürekkep", "Deri"], correctIndex: 1 },
  { id: "q92", question: "Pusula ve Harita birleştirilerek ne elde edilir?", options: ["Büyük Harita", "📍 Konum Gösteren Harita", "Hazine Haritası", "Duvar Haritası"], correctIndex: 1 },
  { id: "q93", question: "Minecraft'ta Tilkiler (Foxes) ağızlarında ne taşıyabilirler?", options: ["Sadece Et", "🦊 Eşya/Silah/Yiyecek tutabilirler", "Sadece Odun", "Hiçbir şey"], correctIndex: 1 },
  { id: "q94", question: "Aksolotllar (Axolotls) hangi yiyecek canlı kovayla beslenip çiftleştirilir?", options: ["Çiğ Balık", "🪣 Kovadaki Tropikal Balık", "Solucan", "Yosun"], correctIndex: 1 },
  { id: "q95", question: "Dev Mantar ağaçları (Mushroom Trees) büyütmek için küçük mantarın üzerine ne dökülür?", options: ["Su", "🦴 Kemik Tozu", "Gübre", "İksir"], correctIndex: 1 },
  { id: "q96", question: "Minecraft'ta 'Bad Omen' (Kötü Kehanet) efekti hangi yaratık öldürüldüğünde kazanılır?", options: ["Zombi", "🏹 Bayraklı Yağmacı Kaptanı (Raid Captain)", "Enderman", "Cadı"], correctIndex: 1 },
  { id: "q97", question: "Bad Omen efektiyle bir köye girildiğinde ne başlar?", options: ["Festival", "⚔️ Yağma (Raid / Baskın)", "Köylüler kaçar", "Gece olur"], correctIndex: 1 },
  { id: "q98", question: "Yağma (Raid) etkinliği başarıyla tamamlandığında oyuncuya hangi unvan/efekt verilir?", options: ["Köyün Kralı", "🛡️ Köyün Kahramanı (Hero of the Village)", "Zengin Köylü", "Savaşçı"], correctIndex: 1 },
  { id: "q99", question: "Köyün Kahramanı efekti aktifken köylüler oyuncuya nasıl davranır?", options: ["Korkarlar", "🎁 İndirim yapar ve hediye fırlatırlar", "Evlerini kilitlerler", "Ücretsiz elmas verirler"], correctIndex: 1 },
  { id: "q100", question: "Allay (Mavi Süzülen Peri) oyuncudan eline verilen eşyayı alınca ne yapar?", options: ["Eşyayı yer", "💎 Etraftan aynı eşyadan bulup oyuncuya getirir", "Saldırır", "Işınlanır"], correctIndex: 1 }
];

const DEFAULT_QUIZ_QUESTS: QuizQuest[] = [
  { id: "quest_1", title: "1 Anket Tamamla", description: "Haftalık Görev: En az 1 adet Minecraft bilgi testini başarıyla tamamla.", targetCount: 1, rewardCredits: 2 },
  { id: "quest_2", title: "3 Anket Tamamla (1 Günlük Hak)", description: "Haftalık Görev: Toplamda 3 adet anket tamamlayarak günlük haklarını doldur.", targetCount: 3, rewardCredits: 5 },
  { id: "quest_3", title: "7 Anket Tamamla", description: "Haftalık Görev: Haftalık sürecinde toplam 7 adet anketi başarıyla tamamla.", targetCount: 7, rewardCredits: 12 },
  { id: "quest_4", title: "12 Anket Tamamla", description: "Haftalık Görev: Toplamda 12 adet Minecraft testini başarıyla çöz.", targetCount: 12, rewardCredits: 20 },
  { id: "quest_5", title: "15 Anket Maratonu", description: "Haftalık Görev: 15 adet anket çözerek Minecraft bilgi ustalığını kanıtla.", targetCount: 15, rewardCredits: 30 },
  { id: "quest_6", title: "21 Anket (Haftalık Şampiyon)", description: "Haftalık Görev: Haftanın tüm 21 anket hakkını başarıyla tamamla ve büyük ödülü kap!", targetCount: 21, rewardCredits: 50 }
];

const DEFAULT_QUIZ_SETTINGS: EarnQuizSettings = {
  bannerNotice: "Size ücretsiz kredi sağlayabilmek ve sunucu giderlerimizi karşılayabilmek için bu sayfada reklam alanları yer almaktadır. Anket ve Minecraft bilgi testlerini çözerek hem bilginizi test edin hem de mağazamızda harcayabileceğiniz ücretsiz krediler kazanın!",
  adsenseCode: "<!-- Google AdSense / Reklam Kodu -->",
  quizQuestionsPerRound: 10,
  secondsPerQuestion: 30,
  creditsPerQuiz: 1,
  minCorrectToWin: 7,
  cooldownMinutes: 0,
  enabled: true
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
  wheelSettings?: { enabled: boolean; price: number; multiplier: number };
  quiz_daily_logs?: { date: string; username: string; ip: string; deviceId: string; count: number }[];
  pluginSettings?: {
    secretKey: string;
    requireOnlineForPurchase: boolean;
    serverIp: string;
    serverPort: number;
    lastHeartbeat: Date | null;
    serverVersion?: string;
    maxPlayers?: number;
  };
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
  quizQuests: [],
  wheelSettings: { enabled: true, price: 0, multiplier: 1 },
  quiz_daily_logs: []
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
      adsterraUrl: "https://www.effectivecpmnetwork.com/cs5m4z1hd5?key=3c6909ed230acc836b43757f2fb49c9d",
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
          dailyBonusCredits: doc.dailyBonusCredits ?? defaultSettings.dailyBonusCredits,
          enabled: doc.enabled !== false
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
      if (list.length < DEFAULT_QUIZ_QUESTIONS.length) {
        await mongo.db.collection("quiz_questions").deleteMany({});
        await mongo.db.collection("quiz_questions").insertMany(DEFAULT_QUIZ_QUESTIONS as any);
        return DEFAULT_QUIZ_QUESTIONS;
      }
      return list;
    } else {
      if (!mockDbState.quizQuestions || mockDbState.quizQuestions.length < DEFAULT_QUIZ_QUESTIONS.length) {
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
          cooldownMinutes: doc.cooldownMinutes ?? DEFAULT_QUIZ_SETTINGS.cooldownMinutes,
          enabled: doc.enabled !== false
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

  static async getPendingPurchases(): Promise<PurchaseRequest[]> {
    const all = await Database.getAllPurchaseRequests();
    return all.filter(p => p.status === "pending");
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

  // ONLINE STATUS TRACKING & PLUGIN INTEGRATION
  private static onlinePlayers: Set<string> = new Set<string>();
  private static pluginLastHeartbeat: Date | null = null;

  static isPlayerOnline(username: string): boolean {
    return this.onlinePlayers.has(username.toLowerCase());
  }

  static async isPlayerOnlineCheck(username: string): Promise<boolean> {
    const lower = username.toLowerCase();
    if (this.onlinePlayers.has(lower)) {
      return true;
    }

    const mongo = await getMongoClient();
    if (mongo) {
      const doc = await mongo.db.collection("online_players").findOne({
        $or: [
          { username_lower: lower },
          { username: new RegExp(`^${username}$`, "i") }
        ]
      });
      if (doc) {
        this.onlinePlayers.add(lower);
        return true;
      }

      // Check users collection in case plugin updates user status or isOnline flag
      const userDoc = await mongo.db.collection("users").findOne({
        $or: [
          { username_lower: lower, isOnline: true },
          { username: new RegExp(`^${username}$`, "i"), isOnline: true },
          { username_lower: lower, online: true },
          { username: new RegExp(`^${username}$`, "i"), online: true }
        ]
      });

      if (userDoc) {
        this.onlinePlayers.add(lower);
        return true;
      }
    }
    return false;
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

  static isPluginConnected(): boolean {
    if (!Database.pluginLastHeartbeat) return false;
    return (Date.now() - new Date(Database.pluginLastHeartbeat).getTime()) < 180000;
  }

  static async getPluginSettings(): Promise<{
    secretKey: string;
    requireOnlineForPurchase: boolean;
    serverIp: string;
    serverPort: number;
    lastHeartbeat: Date | null;
    serverVersion?: string;
    maxPlayers?: number;
  }> {
    const mongo = await getMongoClient();
    if (mongo) {
      const doc = await mongo.db.collection("plugin_settings").findOne({});
      if (doc) {
        return {
          secretKey: doc.secretKey || "zefir_sec_982374829374",
          requireOnlineForPurchase: Boolean(doc.requireOnlineForPurchase),
          serverIp: doc.serverIp || "zefircraft.mcsh.io",
          serverPort: doc.serverPort || 25565,
          lastHeartbeat: Database.pluginLastHeartbeat || doc.lastHeartbeat || null,
          serverVersion: doc.serverVersion || "1.20.4",
          maxPlayers: doc.maxPlayers || 100
        };
      }
      return {
        secretKey: "zefir_sec_982374829374",
        requireOnlineForPurchase: false,
        serverIp: "zefircraft.mcsh.io",
        serverPort: 25565,
        lastHeartbeat: Database.pluginLastHeartbeat,
        serverVersion: "1.20.4",
        maxPlayers: 100
      };
    } else {
      if (!mockDbState.pluginSettings) {
        mockDbState.pluginSettings = {
          secretKey: "zefir_sec_982374829374",
          requireOnlineForPurchase: false,
          serverIp: "zefircraft.mcsh.io",
          serverPort: 25565,
          lastHeartbeat: Database.pluginLastHeartbeat,
          serverVersion: "1.20.4",
          maxPlayers: 100
        };
      }
      return {
        ...mockDbState.pluginSettings,
        lastHeartbeat: Database.pluginLastHeartbeat || mockDbState.pluginSettings.lastHeartbeat || null
      };
    }
  }

  static async updatePluginSettings(settings: Partial<{
    secretKey: string;
    requireOnlineForPurchase: boolean;
    serverIp: string;
    serverPort: number;
  }>): Promise<any> {
    const mongo = await getMongoClient();
    const current = await Database.getPluginSettings();
    const updated = { ...current, ...settings };

    if (mongo) {
      await mongo.db.collection("plugin_settings").updateOne({}, { $set: updated }, { upsert: true });
    } else {
      mockDbState.pluginSettings = updated;
      saveMockDb();
    }
    return updated;
  }

  static async recordPluginHeartbeat(players: string[], version?: string, maxPlayers?: number): Promise<void> {
    const now = new Date();
    Database.pluginLastHeartbeat = now;
    Database.setOnlinePlayersList(players);

    const mongo = await getMongoClient();
    if (mongo) {
      await mongo.db.collection("plugin_settings").updateOne(
        {},
        {
          $set: {
            lastHeartbeat: now,
            onlineCount: players.length,
            ...(version ? { serverVersion: version } : {}),
            ...(maxPlayers ? { maxPlayers } : {})
          }
        },
        { upsert: true }
      );

      await mongo.db.collection("online_players").deleteMany({});
      if (players.length > 0) {
        await mongo.db.collection("online_players").insertMany(
          players.map(p => ({ username: p, username_lower: p.toLowerCase(), joinedAt: now }))
        );
      }
    } else {
      if (!mockDbState.pluginSettings) {
        mockDbState.pluginSettings = {
          secretKey: "zefir_sec_982374829374",
          requireOnlineForPurchase: true,
          serverIp: "zefircraft.mcsh.io",
          serverPort: 25565,
          lastHeartbeat: now,
          serverVersion: version || "1.20.4",
          maxPlayers: maxPlayers || 100
        };
      } else {
        mockDbState.pluginSettings.lastHeartbeat = now;
        if (version) mockDbState.pluginSettings.serverVersion = version;
        if (maxPlayers) mockDbState.pluginSettings.maxPlayers = maxPlayers;
      }
      saveMockDb();
    }
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

  // WHEEL SETTINGS (ENABLE/DISABLE, PRICE, MULTIPLIER)
  static async getWheelSettings(): Promise<{ enabled: boolean; price: number; multiplier: number }> {
    const mongo = await getMongoClient();
    if (mongo) {
      const doc = await mongo.db.collection("wheel_settings").findOne({});
      if (doc) {
        return {
          enabled: doc.enabled !== false,
          price: doc.price ?? 0,
          multiplier: doc.multiplier ?? 1
        };
      }
      return { enabled: true, price: 0, multiplier: 1 };
    } else {
      if (!mockDbState.wheelSettings) {
        mockDbState.wheelSettings = { enabled: true, price: 0, multiplier: 1 };
      }
      return mockDbState.wheelSettings;
    }
  }

  static async updateWheelSettings(settings: Partial<{ enabled: boolean; price: number; multiplier: number }>): Promise<{ enabled: boolean; price: number; multiplier: number }> {
    const mongo = await getMongoClient();
    const current = await Database.getWheelSettings();
    const updated = { ...current, ...settings };

    if (mongo) {
      await mongo.db.collection("wheel_settings").updateOne({}, { $set: updated }, { upsert: true });
    } else {
      mockDbState.wheelSettings = updated;
      saveMockDb();
    }
    return updated;
  }

  // DAILY QUIZ ATTEMPT & ANTI-ABUSE TRACKER (USER, IP, DEVICE FINGERPRINT)
  static async getQuizDailyCount(username: string, ip: string, deviceId: string): Promise<number> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const mongo = await getMongoClient();

    let maxCount = 0;

    if (mongo) {
      const docs = await mongo.db.collection("quiz_daily_logs").find({
        date: todayStr,
        $or: [
          { username_lower: username.toLowerCase() },
          ...(ip && ip !== "::1" && ip !== "127.0.0.1" ? [{ ip }] : []),
          ...(deviceId && deviceId.length > 5 ? [{ deviceId }] : [])
        ]
      }).toArray();

      for (const d of docs) {
        if ((d.count || 0) > maxCount) maxCount = d.count;
      }
    } else {
      if (!mockDbState.quiz_daily_logs) mockDbState.quiz_daily_logs = [];
      const userLower = username.toLowerCase();

      for (const item of mockDbState.quiz_daily_logs) {
        if (item.date === todayStr) {
          const matchUser = item.username.toLowerCase() === userLower;
          const matchIp = ip && ip !== "::1" && ip !== "127.0.0.1" && item.ip === ip;
          const matchDev = deviceId && deviceId.length > 5 && item.deviceId === deviceId;

          if (matchUser || matchIp || matchDev) {
            if (item.count > maxCount) maxCount = item.count;
          }
        }
      }
    }

    return maxCount;
  }

  static async recordQuizDailyAttempt(username: string, ip: string, deviceId: string): Promise<number> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const mongo = await getMongoClient();
    const userLower = username.toLowerCase();

    const current = await Database.getQuizDailyCount(username, ip, deviceId);
    const newCount = current + 1;

    if (mongo) {
      await mongo.db.collection("quiz_daily_logs").updateOne(
        { date: todayStr, username_lower: userLower },
        {
          $set: {
            date: todayStr,
            username,
            username_lower: userLower,
            ip: ip || "",
            deviceId: deviceId || "",
            count: newCount,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      if (ip && ip !== "::1" && ip !== "127.0.0.1") {
        await mongo.db.collection("quiz_daily_logs").updateOne(
          { date: todayStr, ip },
          { $set: { count: newCount, updatedAt: new Date() } },
          { upsert: true }
        );
      }

      if (deviceId && deviceId.length > 5) {
        await mongo.db.collection("quiz_daily_logs").updateOne(
          { date: todayStr, deviceId },
          { $set: { count: newCount, updatedAt: new Date() } },
          { upsert: true }
        );
      }
    } else {
      if (!mockDbState.quiz_daily_logs) mockDbState.quiz_daily_logs = [];

      let found = false;
      for (const item of mockDbState.quiz_daily_logs) {
        if (item.date === todayStr && (item.username.toLowerCase() === userLower || (ip && item.ip === ip) || (deviceId && item.deviceId === deviceId))) {
          item.count = newCount;
          found = true;
        }
      }

      if (!found) {
        mockDbState.quiz_daily_logs.push({
          date: todayStr,
          username,
          ip: ip || "",
          deviceId: deviceId || "",
          count: newCount
        });
      }
      saveMockDb();
    }

    return newCount;
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
