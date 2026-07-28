import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Coins, Sparkles, HelpCircle, CheckCircle2,
  Clock, ShieldCheck, Check, AlertCircle, ArrowRight,
  RefreshCw, Award, Play, RotateCcw, Target, Megaphone, Info
} from "lucide-react";

interface EarnCreditsProps {
  user: { username: string; credits: number; registerDate?: string; isAdmin?: boolean } | null;
  onUpdateCredits: (newCredits: number) => void;
  onNavigate: (page: string) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  rewardCredits: number;
}

interface QuizSettings {
  bannerNotice: string;
  adsenseCode: string;
  quizQuestionsPerRound: number;
  secondsPerQuestion: number;
  creditsPerQuiz: number;
  minCorrectToWin: number;
  cooldownMinutes: number;
}

function AdBannerContainer({ code, placeholderText }: { code: string; placeholderText: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    if (code && code.trim()) {
      try {
        const range = document.createRange();
        const fragment = range.createContextualFragment(code);
        containerRef.current.appendChild(fragment);
      } catch (err) {
        console.error("Ad code render error:", err);
      }
    }
  }, [code]);

  if (!code || !code.trim()) {
    return (
      <div className="h-20 sm:h-24 bg-[#111827] border border-dashed border-amber-500/30 rounded-xl flex items-center justify-center text-xs text-amber-400/80 font-bold p-3">
        {placeholderText}
      </div>
    );
  }

  return <div ref={containerRef} className="overflow-hidden flex justify-center items-center my-2 min-h-[60px]" />;
}

// 1. Adsterra 728x90 Leaderboard Banner
function AdsterraLeaderboard728x90() {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '7bf0eedc9106ac59fcf3e2c0c807a58a',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/7bf0eedc9106ac59fcf3e2c0c807a58a/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="w-full flex justify-center items-center overflow-x-auto py-2">
      <iframe
        title="Adsterra 728x90 Leaderboard"
        srcDoc={srcDoc}
        width="728"
        height="90"
        className="border-0 overflow-hidden shrink-0 max-w-full rounded-xl"
        scrolling="no"
      />
    </div>
  );
}

// 2. Adsterra 300x250 Medium Rectangle Box Banner
function AdsterraBox300x250() {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : 'acde311fdaa34c41c807ca257b3755b1',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/acde311fdaa34c41c807ca257b3755b1/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="w-full flex justify-center items-center overflow-hidden py-2">
      <iframe
        title="Adsterra 300x250 Box"
        srcDoc={srcDoc}
        width="300"
        height="250"
        className="border-0 overflow-hidden shrink-0 rounded-xl"
        scrolling="no"
      />
    </div>
  );
}

// 3. Adsterra Native Banner
function AdsterraNativeBanner() {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background: transparent; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
        </style>
      </head>
      <body>
        <script async="async" data-cfasync="false" src="https://pl30574732.effectivecpmnetwork.com/5490d097914bd33005564511b1c45217/invoke.js"></script>
        <div id="container-5490d097914bd33005564511b1c45217"></div>
      </body>
    </html>
  `;

  return (
    <div className="w-full overflow-hidden my-3">
      <iframe
        title="Adsterra Native Banner"
        srcDoc={srcDoc}
        width="100%"
        height="180"
        className="border-0 overflow-hidden w-full rounded-2xl"
        scrolling="no"
      />
    </div>
  );
}

export default function EarnCredits({ user, onUpdateCredits, onNavigate }: EarnCreditsProps) {
  const [activeTab, setActiveTab] = useState<"quiz" | "quests">("quiz");

  // Quiz state
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<QuizSettings>({
    bannerNotice: "Size ücretsiz kredi sağlayabilmek ve sunucu giderlerimizi karşılayabilmek için bu sayfada reklam alanları yer almaktadır. Anket çözerek hem bilginizi test edin hem de ücretsiz kredi kazanın!",
    adsenseCode: "",
    quizQuestionsPerRound: 10,
    secondsPerQuestion: 30,
    creditsPerQuiz: 1,
    minCorrectToWin: 7,
    cooldownMinutes: 0
  });

  const [quests, setQuests] = useState<Quest[]>([]);
  const [completedQuizzesCount, setCompletedQuizzesCount] = useState<number>(0);
  const [claimedQuests, setClaimedQuests] = useState<string[]>([]);
  const [lastQuizTime, setLastQuizTime] = useState<string | null>(null);

  // Active Quiz State
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    minRequired: number;
    passed: boolean;
    earnedCredits: number;
  } | null>(null);

  // Notifications
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);

  // Fetch status on mount
  useEffect(() => {
    fetchQuizStatus();
  }, [user]);

  const fetchQuizStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
      const res = await fetch("/api/earn/quiz/status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.quests) setQuests(data.quests);
        setCompletedQuizzesCount(data.completedQuizzesCount || 0);
        setClaimedQuests(data.claimedQuests || []);
        setLastQuizTime(data.lastQuizTime || null);
        if (data.credits !== undefined && user) {
          onUpdateCredits(data.credits);
        }
      }
    } catch (err) {
      console.error("Fetch quiz status error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Timer logic during active question
  useEffect(() => {
    if (!quizStarted || quizResult || questions.length === 0) return;

    if (timeLeft <= 0) {
      // Time out for current question, auto record -1 (unanswered) and move next
      handleAnswerSelect(-1);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, currentIdx, timeLeft, quizResult, questions]);

  // Start Quiz
  const handleStartQuiz = async () => {
    if (!user) {
      onNavigate("login");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
      const res = await fetch("/api/earn/quiz/start", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setQuestions(data.questions || []);
        setCurrentIdx(0);
        setSelectedAnswers([]);
        setTimeLeft(data.secondsPerQuestion || settings.secondsPerQuestion || 30);
        setQuizResult(null);
        setQuizStarted(true);
      } else {
        setMessage({ type: "error", text: data.error || "Anket başlatılamadı." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Bağlantı hatası oluştu." });
    } finally {
      setLoading(false);
    }
  };

  // Handle user clicking an option (0=A, 1=B, 2=C, 3=D or -1 if timeout)
  const handleAnswerSelect = (optionIdx: number) => {
    if (!questions[currentIdx]) return;

    const currentQ = questions[currentIdx];
    const newAnswers = [...selectedAnswers, { questionId: currentQ.id, selectedIndex: optionIdx }];
    setSelectedAnswers(newAnswers);

    if (currentIdx + 1 < questions.length) {
      // Move to next question
      setCurrentIdx(prev => prev + 1);
      setTimeLeft(settings.secondsPerQuestion || 30);
    } else {
      // Finished all questions! Submit to server
      submitQuizResults(newAnswers);
    }
  };

  // Submit Quiz Answers to backend
  const submitQuizResults = async (answers: { questionId: string; selectedIndex: number }[]) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
      const res = await fetch("/api/earn/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();

      if (res.ok) {
        setQuizResult({
          score: data.score,
          total: data.total,
          minRequired: data.minRequired,
          passed: data.passed,
          earnedCredits: data.earnedCredits
        });
        if (data.newCredits !== undefined) {
          onUpdateCredits(data.newCredits);
        }
        if (data.completedQuizzesCount !== undefined) {
          setCompletedQuizzesCount(data.completedQuizzesCount);
        }
        if (data.passed) {
          setMessage({ type: "success", text: `Tebrikler! ${data.score}/${data.total} yaptınız ve +${data.earnedCredits} Kredi kazandınız!` });
        } else {
          setMessage({ type: "error", text: `Üzgünüz! ${data.score}/${data.total} yaptınız. Kredi kazanmak için en az ${data.minRequired} doğru gereklidir.` });
        }
      } else {
        setMessage({ type: "error", text: data.error || "Cevaplar kaydedilirken hata oluştu." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Sonuçlar gönderilirken bağlantı hatası." });
    } finally {
      setSubmitting(false);
    }
  };

  // Claim Quest Reward
  const handleClaimQuest = async (questId: string) => {
    if (!user) {
      onNavigate("login");
      return;
    }

    setClaimingQuestId(questId);
    try {
      const token = localStorage.getItem("zefir_token") || localStorage.getItem("koli_token");
      const res = await fetch("/api/earn/quiz/claim-quest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ questId })
      });
      const data = await res.json();

      if (res.ok) {
        onUpdateCredits(data.newCredits);
        setClaimedQuests(data.claimedQuests || []);
        setMessage({ type: "success", text: data.message || "Görev ödülü hesabınıza eklendi!" });
      } else {
        setMessage({ type: "error", text: data.error || "Görev ödülü alınamadı." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası oluştu." });
    } finally {
      setClaimingQuestId(null);
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
              message.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : "bg-red-950/90 border-red-500/50 text-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <Check className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROMINENT REKLAM & HAKKINDA BİLGİLENDİRME BANNERI (USER SPECIFIED) */}
      <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-yellow-950/90 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Megaphone className="w-48 h-48 text-amber-300" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Megaphone className="w-4 h-4 text-amber-400" />
            Önemli Bilgilendirme ve Reklam Duyurusu
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
            Neden Reklam Gösteriyoruz? <span className="text-amber-300 font-extrabold">Size Ücretsiz Kredi Sağlayabilmek İçin!</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium max-w-4xl">
            {settings.bannerNotice ||
              "Size ücretsiz kredi sağlayabilmek ve sunucu giderlerimizi karşılayabilmek için bu sayfada reklam alanları yer almaktadır. Anket ve Minecraft bilgi testlerini çözerek hem bilginizi test edin hem de mağazamızda harcayabileceğiniz ücretsiz krediler kazanın!"}
          </p>
        </div>
      </div>

      {/* TOP REKLAM BANNERLARI (Leaderboard & Smartlink) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="w-full bg-[#0a0f1d] border border-amber-500/30 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden space-y-3"
      >
        <div className="text-[10px] uppercase font-black tracking-widest text-amber-400 flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5 text-amber-400" /> Sponsor Reklam Alanı
        </div>
        
        {/* Leaderboard Banner */}
        <AdsterraLeaderboard728x90 />

        {/* Custom Admin Code if configured */}
        {settings.adsenseCode ? (
          <AdBannerContainer
            code={settings.adsenseCode}
            placeholderText=""
          />
        ) : null}
      </motion.div>

      {/* SMARTLINK SPONSOR CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-yellow-950/60 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-black text-amber-300 flex items-center justify-center sm:justify-start gap-1.5">
              Sponsor Bağlantısı
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black rounded-full uppercase">
                Aktif
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Sponsor bağlantısını ziyaret ederek sunucumuza ve kredi sistemine destek olun(linke tıklayınca ne çıkacağından sorumlu değiliz).
            </p>
          </div>
        </div>
        <a
          href="https://www.effectivecpmnetwork.com/cs5m4z1hd5?key=3c6909ed230acc836b43757f2fb49c9d"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
        >
          Sponsor Linkine Git <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>

      {/* Hero Stats Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="bg-[#0f1629] border border-[#202d4a] rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Minecraft Bilgi Testi & Anket Portalı
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded-full uppercase tracking-wider ml-1">
              Canlı
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Anket Çöz & Ücretsiz Kredi Kazan</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            10 soruluk Minecraft bilgi yarışmasını tamamla. En az {settings.minCorrectToWin} doğruya ulaşınca +{settings.creditsPerQuiz} Kredin hesabına anında tanımlansın!
          </p>
        </div>

        {/* User Balance & Quiz Stat */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#151d36] border border-[#27385e] rounded-2xl px-5 py-3 text-center shadow-md">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bakiyeniz</span>
            <div className="flex items-center justify-center gap-1.5 text-xl font-black text-amber-400">
              <Coins className="w-5 h-5" />
              <span>{user ? user.credits : 0} Kredi</span>
            </div>
          </div>

          <div className="bg-[#151d36] border border-[#27385e] rounded-2xl px-5 py-3 text-center shadow-md">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tamamlanan Anket</span>
            <div className="flex items-center justify-center gap-1.5 text-xl font-black text-sky-400">
              <Award className="w-5 h-5 text-sky-400" />
              <span>{completedQuizzesCount} Adet</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1d2a47] pb-2">
        <button
          onClick={() => setActiveTab("quiz")}
          className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "quiz"
              ? "bg-amber-500 text-slate-950 shadow-lg"
              : "bg-[#111728] text-slate-400 hover:text-white border border-[#223152]"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Minecraft 10 Soruluk Anket Testi
        </button>

        <button
          onClick={() => setActiveTab("quests")}
          className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "quests"
              ? "bg-sky-500 text-slate-950 shadow-lg"
              : "bg-[#111728] text-slate-400 hover:text-white border border-[#223152]"
          }`}
        >
          <Target className="w-4 h-4" />
          Anket Görevleri ({quests.length})
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center Main Game Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "quiz" && (
            <div className="bg-[#0f1629] border border-[#202d4a] rounded-3xl p-5 sm:p-8 shadow-xl relative min-h-[420px] flex flex-col justify-between">
              {!quizStarted ? (
                /* START SCREEN */
                <div className="my-auto text-center space-y-6 py-6 max-w-xl mx-auto">
                  <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
                    <HelpCircle className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Minecraft Anket Testine Hoş Geldiniz!</h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Sistem rastgele 10 adet Minecraft sorusu seçecektir. Her soru için <strong>{settings.secondsPerQuestion} saniye</strong> süreniz bulunmaktadır.
                    </p>
                  </div>

                  {/* Rules Pill List */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-300 text-left">
                    <div className="bg-[#131b31] border border-[#233357] p-3.5 rounded-2xl flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-white block font-black">Soru Başına</span>
                        <span className="text-slate-400 text-[11px]">{settings.secondsPerQuestion} Saniye</span>
                      </div>
                    </div>

                    <div className="bg-[#131b31] border border-[#233357] p-3.5 rounded-2xl flex items-center gap-2.5">
                      <Target className="w-5 h-5 text-sky-400 shrink-0" />
                      <div>
                        <span className="text-white block font-black">Gereken Doğru</span>
                        <span className="text-slate-400 text-[11px]">En az {settings.minCorrectToWin} / 10</span>
                      </div>
                    </div>

                    <div className="bg-[#131b31] border border-[#233357] p-3.5 rounded-2xl flex items-center gap-2.5">
                      <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-white block font-black">Ödül</span>
                        <span className="text-slate-400 text-[11px]">+{settings.creditsPerQuiz} Kredi</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartQuiz}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-slate-950" /> 10 Soruluk Anketi Başlat
                      </>
                    )}
                  </button>
                </div>
              ) : quizResult ? (
                /* RESULT SCREEN */
                <div className="my-auto text-center space-y-6 py-6 max-w-md mx-auto">
                  <div
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border-2 ${
                      quizResult.passed
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-red-500/20 border-red-500 text-red-400"
                    }`}
                  >
                    {quizResult.passed ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">
                      {quizResult.passed ? "Tebrikler! Testi Geçtiniz" : "Maalesef Barajı Geçemediniz"}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {quizResult.passed
                        ? `Skorunuz: ${quizResult.score} / ${quizResult.total}. Hesabınıza +${quizResult.earnedCredits} Kredi eklendi!`
                        : `Skorunuz: ${quizResult.score} / ${quizResult.total}. Kredi kazanmak için en az ${quizResult.minRequired} doğru yapmalısınız.`}
                    </p>
                  </div>

                  <div className="bg-[#131b31] border border-[#233357] p-5 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-bold">
                      <span>Doğru Sayısı:</span>
                      <span className="text-white font-extrabold">{quizResult.score} Adet</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-bold">
                      <span>Gerekli Baraj:</span>
                      <span className="text-amber-400 font-extrabold">{quizResult.minRequired} Doğru</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-bold pt-2 border-t border-slate-800">
                      <span>Kazanılan Ödül:</span>
                      <span className="text-emerald-400 font-extrabold">+{quizResult.earnedCredits} Kredi</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartQuiz}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Yeniden Anket Çöz
                  </button>
                </div>
              ) : questions[currentIdx] ? (
                /* ACTIVE QUESTION VIEW */
                <div className="space-y-6">
                  {/* Question Header & Countdown */}
                  <div className="flex items-center justify-between gap-4 border-b border-[#1e2a45] pb-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
                        Soru {currentIdx + 1} / {questions.length}
                      </span>
                    </div>

                    {/* Countdown Badge */}
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-1.5 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-400 font-black font-mono text-sm flex items-center gap-2 shadow-inner">
                        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>{timeLeft}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Timer Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      style={{ width: `${(timeLeft / (settings.secondsPerQuestion || 30)) * 100}%` }}
                    />
                  </div>

                  {/* Question Text Box */}
                  <div className="bg-[#11182c] border border-[#233357] rounded-2xl p-6 sm:p-8 min-h-[120px] flex items-center justify-center text-center shadow-lg">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                      {questions[currentIdx].question}
                    </h3>
                  </div>

                  {/* Options Grid (A, B, C, D) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {questions[currentIdx].options.map((opt, optionIdx) => (
                      <button
                        key={optionIdx}
                        onClick={() => handleAnswerSelect(optionIdx)}
                        className="p-4 bg-[#131d36] hover:bg-amber-500/20 border border-[#283b66] hover:border-amber-500/60 rounded-2xl text-left transition-all flex items-center gap-3.5 group cursor-pointer shadow-md"
                      >
                        <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          {optionLabels[optionIdx] || optionIdx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white leading-snug">
                          {opt}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Sponsor Ad Banner inside Quiz Active View */}
                  <div className="pt-3 border-t border-[#1d2a47]">
                    <div className="text-[10px] uppercase font-black tracking-widest text-amber-400/80 mb-1 text-center flex items-center justify-center gap-1">
                      <Info className="w-3 h-3 text-amber-400" /> Sponsor Reklamı
                    </div>
                    <AdsterraLeaderboard728x90 />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: QUESTS (GÖREVLER) */}
          {activeTab === "quests" && (
            <div className="bg-[#0f1629] border border-[#202d4a] rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#1e2a45] pb-4">
                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Anket Çözme Görevleri</h2>
                  <p className="text-xs text-slate-400">Belirli sayıda anket tamamlayarak extra toplu kredi ödülleri kazanın.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {quests.map(quest => {
                  const isClaimed = claimedQuests.includes(quest.id);
                  const isCompleted = completedQuizzesCount >= quest.targetCount;
                  const progressPct = Math.min(100, Math.round((completedQuizzesCount / quest.targetCount) * 100));

                  return (
                    <div
                      key={quest.id}
                      className="bg-[#090e1c] border border-[#1b2742] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-white">{quest.title}</h3>
                          <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg">
                            +{quest.rewardCredits} Kredi
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{quest.description}</p>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400">
                            <span>İlerleme: {completedQuizzesCount} / {quest.targetCount}</span>
                            <span>%{progressPct}</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-sky-500 to-amber-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        {isClaimed ? (
                          <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Ödül Alındı
                          </div>
                        ) : isCompleted ? (
                          <button
                            onClick={() => handleClaimQuest(quest.id)}
                            disabled={claimingQuestId === quest.id}
                            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {claimingQuestId === quest.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Coins className="w-4 h-4" /> +{quest.rewardCredits} Krediyi Al
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-500 text-xs font-extrabold rounded-xl text-center">
                            Devam Ediyor
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Ad Space (1 Col) */}
        <div className="space-y-6">
          <div className="bg-[#0f1629] border border-[#202d4a] rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-400" /> Sponsor Reklamlar
            </h3>

            {/* Sidebar Ad Unit 1: Box Banner */}
            <div className="bg-[#090e1c] border border-amber-500/30 rounded-2xl p-3 text-center overflow-hidden">
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400/80 mb-2">
                Sponsor Reklamı
              </div>
              <AdsterraBox300x250 />
            </div>

            {/* Sidebar Ad Unit 2: Native Banner */}
            <div className="bg-[#090e1c] border border-amber-500/30 rounded-2xl p-3 text-center overflow-hidden">
              <div className="text-[10px] uppercase font-black tracking-widest text-amber-400/80 mb-2">
                Sponsorlu İçerik Reklamı
              </div>
              <AdsterraNativeBanner />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SPONSOR BANNER */}
      <div className="w-full bg-[#0a0f1d] border border-amber-500/30 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden space-y-2">
        <div className="text-[10px] uppercase font-black tracking-widest text-amber-400 mb-1 flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5 text-amber-400" /> Alt Sponsor Banner Reklam Alanı
        </div>
        <AdsterraLeaderboard728x90 />
      </div>
    </div>
  );
}
