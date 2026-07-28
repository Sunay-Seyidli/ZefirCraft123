import React, { useState, useEffect } from "react";
import { Award, Trophy, Coins, Search, User, Sparkles, Snowflake, ArrowRight, X, HelpCircle, Check } from "lucide-react";
import { motion } from "motion/react";

interface RankUser {
  rank: number;
  username: string;
  credits: number;
}

export default function Rankings() {
  const [users, setUsers] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch top 50 players sorted by credit bakiye
      const res = await fetch("/api/stats/top-credits?limit=50");
      if (!res.ok) {
        throw new Error("Sıralama verileri sunucudan yüklenemedi.");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Teknik bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Divide into podium and table
  const podiumUsers = users.slice(0, 3);
  const tableUsers = filteredUsers.filter((u) => u.rank > 3);

  // Map rank to podium positions [2nd, 1st, 3rd] for visual presentation
  const getPodiumSorted = () => {
    const second = podiumUsers.find((u) => u.rank === 2);
    const first = podiumUsers.find((u) => u.rank === 1);
    const third = podiumUsers.find((u) => u.rank === 3);
    return { first, second, third };
  };

  const { first, second, third } = getPodiumSorted();

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101e] border border-[#22304d] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,#3b82f615,transparent_50%)]"></div>
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md inline-block">
            ZEFIRCRAFT HALL OF FAME
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">Kredi Sıralaması</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-lg leading-relaxed">
            Sunucumuzun en prestijli ve zengin oyuncuları! Sıralama veritabanımızdan anlık olarak güncellenir ve oyuncu kredilerine göre listelenir.
          </p>
        </div>
        <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20 text-sky-400 animate-pulse shrink-0 shadow-lg">
          <Trophy className="w-8 h-8 text-sky-400" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <Snowflake className="w-10 h-10 animate-spin text-sky-400 mx-auto" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sıralama verileri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-400 max-w-md mx-auto space-y-4 shadow-lg">
          <p className="text-xs font-bold leading-relaxed">{error}</p>
          <button
            onClick={fetchRankings}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Podium Layout with real 3D bodies! */}
          {podiumUsers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-6 px-4">
              
              {/* 2nd Place Silver */}
              {second ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#111625]/75 border border-[#23324f]/60 rounded-3xl p-6 text-center space-y-4 shadow-lg order-2 md:order-1 relative mt-12 md:mt-0"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#2d3a54] border-[#1b3d54] border-[#5a6e94] rounded-xl flex items-center justify-center text-slate-300 font-black text-lg shadow-md uppercase">
                    2
                  </div>
                  
                  {/* 3D Body Skin */}
                  <div className="h-44 flex items-center justify-center relative">
                    <img
                      src={`https://mc-heads.net/body/${second.username}/110`}
                      alt={second.username}
                      referrerPolicy="no-referrer"
                      className="h-full object-contain filter drop-shadow-[0_8px_16px_rgba(100,116,139,0.3)] hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white text-base truncate">{second.username}</h3>
                    <div className="inline-flex items-center gap-1.5 bg-[#172035] border border-[#2b3a5a] px-3 py-1 rounded-xl text-xs font-black text-slate-300">
                      <Coins className="w-3.5 h-3.5 text-sky-500" />
                      <span>{second.credits} Kr</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden md:block"></div>
              )}

              {/* 1st Place Golden Leader */}
              {first && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-b from-[#1c1a18] to-[#111625] border-[#1b3d54] border-sky-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl order-1 md:order-2 relative transform md:-translate-y-4"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-sky-500 border-[#1b3d54] border-[#080b16] rounded-xl flex items-center justify-center text-white shadow-xl">
                    <Trophy className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  
                  {/* 3D Body Skin (Larger for first place) */}
                  <div className="h-56 flex items-center justify-center relative">
                    <img
                      src={`https://mc-heads.net/body/${first.username}/140`}
                      alt={first.username}
                      referrerPolicy="no-referrer"
                      className="h-full object-contain filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-0 right-2 bg-sky-500/10 border border-sky-500/25 text-sky-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider">
                      LİDER
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-black text-white text-lg truncate">{first.username}</h3>
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-sky-500 px-4 py-1.5 rounded-xl text-xs font-black text-slate-950 shadow-lg shadow-sky-500/20">
                      <Coins className="w-4 h-4" />
                      <span>{first.credits} Kr</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3rd Place Bronze */}
              {third ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#111625]/75 border border-[#23324f]/60 rounded-3xl p-6 text-center space-y-4 shadow-lg order-3 relative mt-12 md:mt-0"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#3b2b1f] border-[#1b3d54] border-[#8a5d3b] rounded-xl flex items-center justify-center text-cyan-400 font-black text-lg shadow-md">
                    3
                  </div>

                  {/* 3D Body Skin */}
                  <div className="h-44 flex items-center justify-center relative">
                    <img
                      src={`https://mc-heads.net/body/${third.username}/110`}
                      alt={third.username}
                      referrerPolicy="no-referrer"
                      className="h-full object-contain filter drop-shadow-[0_8px_16px_rgba(138,93,59,0.3)] hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white text-base truncate">{third.username}</h3>
                    <div className="inline-flex items-center gap-1.5 bg-[#172035] border border-[#2b3a5a] px-3 py-1 rounded-xl text-xs font-black text-cyan-400">
                      <Coins className="w-3.5 h-3.5 text-sky-500" />
                      <span>{third.credits} Kr</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden md:block"></div>
              )}

            </div>
          )}

          {/* Table list */}
          <div className="bg-[#111625]/75 border border-[#1e2a40] rounded-3xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-[#1b3d54] border-[#212f4b]/50 pb-4">
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-lg font-black text-white flex items-center justify-center md:justify-start gap-2">
                  <Award className="w-5 h-5 text-sky-400 animate-pulse" />
                  Tüm Sıralama
                </h2>
                <p className="text-xs text-slate-400">Aradığınız oyuncunun ismini yazarak listeyi anında daraltabilirsiniz.</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full md:w-72 shrink-0">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Oyuncu adı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#182035] border border-[#2b3957] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            {/* Render table */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Arama kriterlerinize uygun oyuncu bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-[#1b3d54] border-[#1e2a40]/50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3.5 px-4">Sıra</th>
                      <th className="py-3.5 px-4">Oyuncu Adı</th>
                      <th className="py-3.5 px-4 text-right">Kredi Bakiyesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a40]/45 text-xs">
                    {filteredUsers.map((u) => {
                      const isTop3 = u.rank <= 3;
                      return (
                        <tr
                          key={u.rank}
                          className={`hover:bg-[#1b233a]/30 transition-colors ${
                            isTop3 ? "bg-sky-500/5 font-bold" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                              u.rank === 1 ? "bg-sky-500/15 text-sky-400 font-black border border-sky-500/10" :
                              u.rank === 2 ? "bg-slate-300/10 text-slate-300 font-black border border-slate-300/10" :
                              u.rank === 3 ? "bg-cyan-500/10 text-cyan-400 font-black border border-cyan-500/10" : "text-slate-500"
                            }`}>
                              {u.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {/* Dynamic 2D Head Avatar */}
                              <img
                                src={`https://mc-heads.net/avatar/${u.username}/20`}
                                alt={u.username}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-md border border-slate-700/50"
                              />
                              <span className="text-slate-200 font-semibold">{u.username}</span>
                              {u.rank === 1 && <Trophy className="w-3.5 h-3.5 text-sky-500" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-extrabold text-sky-400 bg-[#0f1425] border border-[#22304d] px-2.5 py-1 rounded-lg">
                              {u.credits} Kr.
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
