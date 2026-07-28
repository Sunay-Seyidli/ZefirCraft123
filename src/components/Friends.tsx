import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, MessageSquare, UserPlus, Send, Search, Check, X, Shield,
  UserCheck, Clock, AlertCircle, Sparkles, UserX, ArrowLeft, RefreshCw, MessageCircle
} from "lucide-react";
import { FriendUser, DirectMessage } from "../types";

interface FriendsProps {
  user: { username: string; isAdmin?: boolean } | null;
  initialChatFriend?: string | null;
  onOpenProfile?: (targetUsername: string) => void;
  onNavigateLogin?: () => void;
}

export default function Friends({
  user,
  initialChatFriend,
  onOpenProfile,
  onNavigateLogin
}: FriendsProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "received" | "sent" | "search">("friends");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Array<{ requester: string; role?: string; createdAt: string }>>([]);
  const [sentRequests, setSentRequests] = useState<Array<{ recipient: string; role?: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ username: string; role?: string; registerDate?: string; isOnline?: boolean }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Active DM Chat State
  const [activeChatFriend, setActiveChatFriend] = useState<string | null>(initialChatFriend || null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchSocialData();
    }
  }, [user]);

  // Initial friend chat setup if passed from prop
  useEffect(() => {
    if (initialChatFriend) {
      setActiveChatFriend(initialChatFriend);
      setActiveTab("friends");
    }
  }, [initialChatFriend]);

  // Poll chat messages every 3.5 seconds when active chat is open
  useEffect(() => {
    if (!user || !activeChatFriend) return;

    fetchConversation(activeChatFriend);
    const interval = setInterval(() => {
      fetchConversation(activeChatFriend, true);
    }, 3500);

    return () => clearInterval(interval);
  }, [user, activeChatFriend]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const getAuthToken = () => {
    return localStorage.getItem("zefir_token") || localStorage.getItem("koli_token") || "";
  };

  const fetchSocialData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/social/friends", {
        headers: { "Authorization": `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setReceivedRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);

        // Auto select first friend if no chat active and friends exist
        if (!activeChatFriend && data.friends && data.friends.length > 0) {
          setActiveChatFriend(data.friends[0].username);
        }
      }
    } catch (err) {
      console.error("Social data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (friendUsername: string, silent = false) => {
    if (!user) return;
    if (!silent) setChatLoading(true);
    try {
      const res = await fetch(`/api/social/messages/${encodeURIComponent(friendUsername)}`, {
        headers: { "Authorization": `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const msgs = await res.json();
        setChatMessages(msgs);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeChatFriend || sendingMsg) return;

    const msgToSend = chatInput.trim();
    setChatInput("");
    setSendingMsg(true);

    try {
      const res = await fetch("/api/social/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          recipient: activeChatFriend,
          message: msgToSend
        })
      });

      if (res.ok) {
        await fetchConversation(activeChatFriend, true);
        fetchSocialData(); // Refresh friends list last message preview
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out self
        const filtered = data.filter((p: any) => p.username.toLowerCase() !== user?.username.toLowerCase());
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error("Search players error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (targetUsername: string) => {
    setActionMessage(null);
    try {
      const res = await fetch("/api/social/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ recipient: targetUsername })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: `${targetUsername} kullanıcısına arkadaşlık isteği gönderildi!` });
        fetchSocialData();
      } else {
        setActionMessage({ type: "error", text: data.message || data.error || "İstek gönderilemedi." });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "İşlem sırasında hata oluştu." });
    }
  };

  const handleRespondRequest = async (targetUsername: string, action: "accept" | "reject" | "cancel") => {
    try {
      const res = await fetch("/api/social/respond-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ targetUsername, action })
      });
      if (res.ok) {
        fetchSocialData();
      }
    } catch (err) {
      console.error("Respond request error:", err);
    }
  };

  const handleRemoveFriend = async (targetUsername: string) => {
    if (!window.confirm(`${targetUsername} kullanıcısını arkadaş listenizden çıkarmak istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch("/api/social/remove-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ targetUsername })
      });
      if (res.ok) {
        if (activeChatFriend?.toLowerCase() === targetUsername.toLowerCase()) {
          setActiveChatFriend(null);
        }
        fetchSocialData();
      }
    } catch (err) {
      console.error("Remove friend error:", err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-[#0e1424] border border-sky-500/30 rounded-3xl p-10 max-w-md mx-auto shadow-2xl">
          <Users className="w-16 h-16 text-sky-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-white mb-2">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-slate-400 text-sm mb-6">
            Arkadaşlarınızla mesajlaşmak, arkadaş eklemek ve gelen istekleri görüntülemek için lütfen ZefirCraft hesabınızla oturum açın.
          </p>
          <button
            onClick={onNavigateLogin}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition-all"
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </div>
    );
  }

  const unreadCountTotal = friends.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400 shadow-md">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Arkadaşlar & Sosyal Portal
                {unreadCountTotal > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold animate-pulse">
                    {unreadCountTotal} Yeni Mesaj
                  </span>
                )}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Sunucu oyuncularıyla bağlantı kurun, özel mesajlaşın ve yeni arkadaşlar ekleyin.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchSocialData}
          className="p-2.5 bg-[#12192c] hover:bg-[#18223c] border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-sky-400" />
          <span>Yenile</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0b0f1c] border border-slate-800 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === "friends"
              ? "bg-sky-600/20 text-sky-400 border border-sky-500/40 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Arkadaşlarım & Sohbet</span>
          {friends.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-sky-500/20 text-sky-300 rounded-full font-mono">
              {friends.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === "received"
              ? "bg-sky-600/20 text-sky-400 border border-sky-500/40 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Gelen İstekler</span>
          {receivedRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono">
              {receivedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === "sent"
              ? "bg-sky-600/20 text-sky-400 border border-sky-500/40 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Gönderdiğim İstekler</span>
          {sentRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-full font-mono">
              {sentRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === "search"
              ? "bg-sky-600/20 text-sky-400 border border-sky-500/40 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Oyuncu Ara & Ekle</span>
        </button>
      </div>

      {/* Action status message toast */}
      {actionMessage && (
        <div className={`p-4 mb-6 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg ${
          actionMessage.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-sky-400 font-bold flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 animate-spin" />
          <span>Sosyal veriler yükleniyor...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: FRIENDS LIST & MESSAGING CHAT */}
          {activeTab === "friends" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
              {/* Left Friends List Sidebar */}
              <div className="lg:col-span-4 bg-[#0d1222] border border-slate-800/80 rounded-3xl p-4 flex flex-col h-[550px] overflow-hidden">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
                  <span>Mevcut Arkadaşlarım ({friends.length})</span>
                  <span className="text-[10px] text-sky-400">Çevrimiçi / DM</span>
                </div>

                {friends.length === 0 ? (
                  <div className="my-auto text-center py-10 px-4">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-300">Henüz Arkadaşınız Yok</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Oyuncu Ara sekmesinden ZefirCraft oyuncularına arkadaşlık isteği gönderebilirsiniz.
                    </p>
                    <button
                      onClick={() => setActiveTab("search")}
                      className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Oyuncu Ara
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {friends.map((friend) => {
                      const isSelected = activeChatFriend?.toLowerCase() === friend.username.toLowerCase();
                      return (
                        <div
                          key={friend.username}
                          onClick={() => {
                            setActiveChatFriend(friend.username);
                            fetchConversation(friend.username);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? "bg-sky-600/20 border-sky-500/50 shadow-md"
                              : "bg-[#12182c] border-slate-800/60 hover:bg-[#161e38] hover:border-slate-700"
                          }`}
                        >
                          <img
                            src={`https://mc-heads.net/avatar/${friend.username}/48`}
                            alt={friend.username}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl border border-sky-500/30 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-black text-white truncate">
                                {friend.username}
                              </span>
                              {friend.unreadCount && friend.unreadCount > 0 ? (
                                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                                  {friend.unreadCount}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-sky-300 rounded-md font-extrabold uppercase">
                                {friend.role || "Oyuncu"}
                              </span>
                              {friend.lastMessage && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                                  {friend.lastMessage}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Direct Message Chat Window */}
              <div className="lg:col-span-8 bg-[#0d1222] border border-slate-800/80 rounded-3xl p-4 md:p-6 flex flex-col h-[550px] overflow-hidden relative">
                {activeChatFriend ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 shrink-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://mc-heads.net/avatar/${activeChatFriend}/48`}
                          alt={activeChatFriend}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl border border-sky-400/40"
                        />
                        <div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            {activeChatFriend}
                          </h3>
                          <span className="text-[11px] text-sky-400 font-medium">Özel Mesajlaşma Odası</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenProfile && (
                          <button
                            onClick={() => onOpenProfile(activeChatFriend)}
                            className="px-3 py-1.5 bg-[#12182c] hover:bg-[#1a233d] border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Profili Gör
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFriend(activeChatFriend)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                          title="Arkadaşı Çıkar"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
                      {chatLoading ? (
                        <div className="py-12 text-center text-sky-400 font-bold flex flex-col items-center gap-2">
                          <Sparkles className="w-6 h-6 animate-spin" />
                          <span>Sohbet yükleniyor...</span>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 text-xs">
                          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40 text-sky-400" />
                          <span>{activeChatFriend} ile henüz mesajlaşmadınız. Aşağıdan ilk mesajınızı yazın!</span>
                        </div>
                      ) : (
                        chatMessages.map((msg, index) => {
                          const isMe = msg.sender.toLowerCase() === user.username.toLowerCase();
                          const msgDate = new Date(msg.createdAt);
                          const formattedTime = msgDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

                          return (
                            <div
                              key={msg._id || index}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-md ${
                                isMe
                                  ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-br-none"
                                  : "bg-[#141b30] border border-slate-800 text-slate-200 rounded-bl-none"
                              }`}>
                                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 px-1">
                                {formattedTime}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Box */}
                    <form onSubmit={handleSendMessage} className="shrink-0 flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`${activeChatFriend} kullanıcısına mesaj yazın...`}
                        className="flex-1 bg-[#12182b] border border-slate-700/80 focus:border-sky-500 rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || sendingMsg}
                        className="px-5 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Gönder</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="my-auto text-center py-20">
                    <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                    <p className="text-base font-bold text-slate-300">Sohbet Seçilmedi</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Soldaki arkadaş listenizden bir oyuncuya tıklayarak özel sohbeti başlatabilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECEIVED REQUESTS */}
          {activeTab === "received" && (
            <div className="bg-[#0d1222] border border-slate-800/80 rounded-3xl p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                Gelen Arkadaşlık İstekleri ({receivedRequests.length})
              </h2>

              {receivedRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Henüz tarafınıza gelen bir arkadaşlık isteği bulunmamaktadır.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedRequests.map((req) => (
                    <div
                      key={req.requester}
                      className="bg-[#12182b] border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://mc-heads.net/avatar/${req.requester}/48`}
                          alt={req.requester}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl border border-sky-500/30"
                        />
                        <div>
                          <span className="text-xs font-black text-white block">{req.requester}</span>
                          <span className="text-[10px] text-sky-400 font-bold uppercase">{req.role || "Oyuncu"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondRequest(req.requester, "accept")}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl border border-emerald-500/30 cursor-pointer transition-all"
                          title="Kabul Et"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req.requester, "reject")}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/30 cursor-pointer transition-all"
                          title="Reddet"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SENT REQUESTS */}
          {activeTab === "sent" && (
            <div className="bg-[#0d1222] border border-slate-800/80 rounded-3xl p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                Gönderdiğim Bekleyen İstekler ({sentRequests.length})
              </h2>

              {sentRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Bekleyen herhangi bir arkadaşlık isteğiniz bulunmamaktadır.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sentRequests.map((req) => (
                    <div
                      key={req.recipient}
                      className="bg-[#12182b] border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://mc-heads.net/avatar/${req.recipient}/48`}
                          alt={req.recipient}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl border border-sky-500/30"
                        />
                        <div>
                          <span className="text-xs font-black text-white block">{req.recipient}</span>
                          <span className="text-[10px] text-slate-400">Yanıt Bekliyor...</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRespondRequest(req.recipient, "cancel")}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        İptal Et
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SEARCH PLAYERS */}
          {activeTab === "search" && (
            <div className="bg-[#0d1222] border border-slate-800/80 rounded-3xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <Search className="w-5 h-5 text-sky-400" />
                  ZefirCraft Oyuncu Arama
                </h2>
                <p className="text-xs text-slate-400">
                  Sunucuya kaydolmuş tüm oyuncuları arayabilir, profillerine bakabilir veya arkadaşlık isteği gönderebilirsiniz.
                </p>
              </div>

              {/* Search Bar Input */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Oyuncu kullanıcı adını yazın..."
                  className="w-full bg-[#12182b] border border-slate-700/80 focus:border-sky-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white font-medium outline-none transition-all"
                />
              </div>

              {/* Search Results Grid */}
              {searchLoading ? (
                <div className="py-12 text-center text-sky-400 font-bold flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 animate-spin" />
                  <span>Oyuncular aranıyor...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {searchQuery ? "Aramanıza uygun oyuncu bulunamadı." : "Arama yapmak için yukarıya bir oyuncu adı yazın."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((player) => {
                    const isAlreadyFriend = friends.some(f => f.username.toLowerCase() === player.username.toLowerCase());
                    const isPendingSent = sentRequests.some(s => s.recipient.toLowerCase() === player.username.toLowerCase());

                    return (
                      <div
                        key={player.username}
                        className="bg-[#12182b] border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-sky-500/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://mc-heads.net/avatar/${player.username}/48`}
                            alt={player.username}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl border border-sky-500/30"
                          />
                          <div>
                            <span className="text-xs font-black text-white block">{player.username}</span>
                            <span className="text-[10px] text-sky-400 font-bold uppercase">{player.role || "Oyuncu"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenProfile && (
                            <button
                              onClick={() => onOpenProfile(player.username)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Profil
                            </button>
                          )}

                          {isAlreadyFriend ? (
                            <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              Arkadaşsınız
                            </span>
                          ) : isPendingSent ? (
                            <span className="text-[11px] font-bold text-amber-400 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              İstek Gönderildi
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(player.username)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                            >
                              + Ekle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
