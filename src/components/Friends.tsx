import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Users, MessageSquare, UserPlus, Send, Search, Check, CheckCheck, X,
  Clock, AlertCircle, Sparkles, UserX, RefreshCw, MessageCircle, Calendar, ChevronUp
} from "lucide-react";
import { FriendUser, DirectMessage } from "../types";

interface FriendsProps {
  user: { username: string; isAdmin?: boolean } | null;
  initialChatFriend?: string | null;
  onOpenProfile?: (targetUsername: string) => void;
  onNavigateLogin?: () => void;
}

// Date formatting with cache
const dateCache = new Map<string, { timeLabel: string; dateLabel: string; dayKey: string; fullLabel: string; relativeDay: string }>();

function formatMessageDateTime(dateInput: string | Date) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { dateLabel: "", timeLabel: "", dayKey: "", fullLabel: "", relativeDay: "" };

  const timeLabel = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const dateLabel = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  let relativeDay = dateLabel;
  if (isToday) relativeDay = "Bugün";
  else if (isYesterday) relativeDay = "Dün";

  const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  return {
    timeLabel,
    dateLabel,
    relativeDay,
    fullLabel: `${dateLabel}, ${timeLabel}`,
    dayKey
  };
}

function getCachedMessageDate(dateInput: string | Date) {
  const key = String(dateInput);
  const cached = dateCache.get(key);
  if (cached) return cached;
  const res = formatMessageDateTime(dateInput);
  if (dateCache.size > 2000) dateCache.clear();
  dateCache.set(key, res);
  return res;
}

function formatSidebarTime(dateInput?: string | Date) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return "Dün";
  }
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

// Subcomponent: Isolated Chat Input Box (Prevents re-rendering message list on keystrokes)
interface ChatInputBoxProps {
  friendName: string;
  onSend: (text: string) => void;
  disabled?: boolean;
}

const ChatInputBox = React.memo(function ChatInputBox({
  friendName,
  onSend,
  disabled
}: ChatInputBoxProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  return (
    <form onSubmit={handleSubmit} className="shrink-0 flex items-center gap-2 pt-2 border-t border-slate-800/80">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`${friendName} kullanıcısına mesaj yazın...`}
        disabled={disabled}
        className="flex-1 bg-[#12182b] border border-slate-700/80 focus:border-sky-500 rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="px-5 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
      >
        <Send className="w-4 h-4" />
        <span className="hidden sm:inline">Gönder</span>
      </button>
    </form>
  );
});

// Subcomponent: Memoized Single Message Bubble
interface MessageBubbleProps {
  msg: DirectMessage;
  isMe: boolean;
  showDateDivider: boolean;
  dt: ReturnType<typeof formatMessageDateTime>;
}

const ChatMessageBubble = React.memo(
  function ChatMessageBubble({ msg, isMe, showDateDivider, dt }: MessageBubbleProps) {
    return (
      <div className="flex flex-col space-y-1">
        {showDateDivider && (
          <div className="flex items-center justify-center my-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151d33] border border-sky-500/20 text-[10px] font-bold text-sky-300 shadow-sm">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>
                {dt.relativeDay === "Bugün" || dt.relativeDay === "Dün"
                  ? `${dt.relativeDay} • ${dt.dateLabel}`
                  : dt.dateLabel}
              </span>
            </div>
          </div>
        )}

        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          <div
            className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-md transition-all ${
              isMe
                ? "bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-600 text-white rounded-br-xs border border-sky-400/30"
                : "bg-[#141b30] border border-slate-700/80 text-slate-100 rounded-bl-xs"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
          </div>

          <div className={`flex items-center gap-1.5 mt-1 px-1.5 text-[10px] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-slate-400 font-medium tracking-tight">
              {dt.fullLabel || dt.timeLabel}
            </span>

            {isMe && (
              <div className="flex items-center">
                {msg.read ? (
                  <div
                    className="flex items-center gap-0.5 text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded-md"
                    title={`Görüldü (Okundu)${msg.readAt ? ' - ' + getCachedMessageDate(msg.readAt).fullLabel : ''}`}
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
                    <span className="text-[9px] font-extrabold text-cyan-300 uppercase tracking-tighter">Görüldü</span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-0.5 text-slate-400 bg-slate-800/80 border border-slate-700/50 px-1.5 py-0.5 rounded-md"
                    title="İletildi (Henüz görülmedi)"
                  >
                    <Check className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                    <span className="text-[9px] font-bold text-slate-400 tracking-tighter">İletildi</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.msg._id === next.msg._id &&
    prev.msg.read === next.msg.read &&
    prev.msg.message === next.msg.message &&
    prev.showDateDivider === next.showDateDivider
);

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
  const [chatLoading, setChatLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Message windowing for ultra-smooth performance with massive chats
  const INITIAL_VISIBLE_COUNT = 80;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // In-memory conversation cache to make switching friends instant (0ms)
  const messagesCache = useRef<Record<string, DirectMessage[]>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const getAuthToken = () => {
    return localStorage.getItem("zefir_token") || localStorage.getItem("koli_token") || "";
  };

  // Mark messages as read explicitly
  const markChatAsRead = async (friendUsername: string) => {
    if (!user || !friendUsername) return;
    try {
      await fetch("/api/social/messages/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ friendUsername })
      });
    } catch (err) {
      // silent
    }
  };

  // Fetch Friends and Requests
  const fetchSocialData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent && friends.length === 0) setLoading(true);
    try {
      const res = await fetch("/api/social/friends", {
        headers: { "Authorization": `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const incomingFriends: FriendUser[] = data.friends || [];
        setFriends(incomingFriends);
        setReceivedRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);

        // Auto select unread friend or first friend if no chat is currently active
        if (!activeChatFriend && incomingFriends.length > 0) {
          const unreadFriend = incomingFriends.find(f => (f.unreadCount || 0) > 0);
          setActiveChatFriend(unreadFriend ? unreadFriend.username : incomingFriends[0].username);
        }
      }
    } catch (err) {
      console.error("Social data fetch error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, activeChatFriend, friends.length]);

  // Sort friends: 1. Unread messages first (highest count first), 2. Most recent message time, 3. Alphabetical
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const unreadA = a.unreadCount || 0;
      const unreadB = b.unreadCount || 0;
      if (unreadB !== unreadA) {
        return unreadB - unreadA;
      }
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return a.username.localeCompare(b.username);
    });
  }, [friends]);

  // Handle friend selection
  const handleSelectFriend = useCallback((friendUsername: string) => {
    if (activeChatFriend?.toLowerCase() !== friendUsername.toLowerCase()) {
      setActiveChatFriend(friendUsername);
    }
    // Optimistically clear unread count for this friend locally
    setFriends(prev =>
      prev.map(f =>
        f.username.toLowerCase() === friendUsername.toLowerCase()
          ? { ...f, unreadCount: 0 }
          : f
      )
    );
    markChatAsRead(friendUsername);
  }, [activeChatFriend]);

  // Fetch Chat Conversation
  const fetchConversation = useCallback(async (friendUsername: string, silent = false) => {
    if (!user || !friendUsername || isFetchingRef.current) return;
    isFetchingRef.current = true;

    // If we have cached messages, display them immediately
    if (!silent && messagesCache.current[friendUsername]) {
      setChatMessages(messagesCache.current[friendUsername]);
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      });
    } else if (!silent && (!chatMessages || chatMessages.length === 0)) {
      setChatLoading(true);
    }

    try {
      const res = await fetch(`/api/social/messages/${encodeURIComponent(friendUsername)}`, {
        headers: { "Authorization": `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const msgs: DirectMessage[] = await res.json();
        messagesCache.current[friendUsername] = msgs;

        setChatMessages(prev => {
          // Optimization: Skip state update if messages are identical
          if (
            prev.length === msgs.length &&
            prev.every((m, idx) => m._id === msgs[idx]?._id && m.read === msgs[idx]?.read)
          ) {
            return prev;
          }

          requestAnimationFrame(() => {
            if (chatContainerRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 220;
              if (!silent || isNearBottom) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }
          });

          return msgs;
        });
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setChatLoading(false);
    }
  }, [user, chatMessages]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchSocialData(false);
    }
  }, [user]);

  // Background polling for social data and friends list (every 3 seconds)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchSocialData(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [user, fetchSocialData]);

  // When initialChatFriend changes from props
  useEffect(() => {
    if (initialChatFriend) {
      setActiveChatFriend(initialChatFriend);
      setActiveTab("friends");
    }
  }, [initialChatFriend]);

  // When active friend changes, reset windowing & load
  useEffect(() => {
    if (!user || !activeChatFriend) return;
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    markChatAsRead(activeChatFriend);
    fetchConversation(activeChatFriend, false);
  }, [activeChatFriend]);

  // Background polling every 2.5s (strictly silent, no UI interruption)
  useEffect(() => {
    if (!user || !activeChatFriend) return;

    const interval = setInterval(() => {
      fetchConversation(activeChatFriend, true);
    }, 2500);

    const handleFocus = () => {
      markChatAsRead(activeChatFriend);
      fetchConversation(activeChatFriend, true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, activeChatFriend, fetchConversation]);

  // Optimistic Instant Message Sending (Zero Lag)
  const handleSendMessage = useCallback(async (msgToSend: string) => {
    if (!activeChatFriend || !user) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: DirectMessage = {
      _id: tempId,
      sender: user.username,
      recipient: activeChatFriend,
      message: msgToSend,
      read: false,
      createdAt: nowIso
    };

    // 1. Immediately append to active chat
    setChatMessages(prev => [...prev, optimisticMsg]);
    if (!messagesCache.current[activeChatFriend]) {
      messagesCache.current[activeChatFriend] = [];
    }
    messagesCache.current[activeChatFriend].push(optimisticMsg);

    // 2. Immediately update sidebar preview
    setFriends(prev =>
      prev.map(f =>
        f.username.toLowerCase() === activeChatFriend.toLowerCase()
          ? { ...f, lastMessage: `Siz: ${msgToSend}`, lastMessageTime: nowIso, unreadCount: 0 }
          : f
      )
    );

    // 3. Scroll smoothly to bottom
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    });

    // 4. Send to server in background silently (NO loading screen, NO unmounting)
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
        // Silently sync real message ID in background
        fetchConversation(activeChatFriend, true);
        fetchSocialData(true);
      }
    } catch (err) {
      console.error("Send message background error:", err);
    }
  }, [activeChatFriend, user, fetchConversation, fetchSocialData]);

  // Load older messages handler
  const handleLoadMoreOlderMessages = () => {
    const container = chatContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    setVisibleCount(prev => prev + 80);

    requestAnimationFrame(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
      }
    });
  };

  // Sliced visible messages for 60fps rendering performance
  const visibleMessages = useMemo(() => {
    if (chatMessages.length <= visibleCount) return chatMessages;
    return chatMessages.slice(-visibleCount);
  }, [chatMessages, visibleCount]);

  const hasOlderMessages = chatMessages.length > visibleMessages.length;
  const olderCount = chatMessages.length - visibleMessages.length;

  // Search logic
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
        fetchSocialData(true);
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
        fetchSocialData(true);
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
        delete messagesCache.current[targetUsername];
        fetchSocialData(true);
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
                Sunucu oyuncularıyla bağlantı kurun, anlık mesajlaşın ve yeni arkadaşlar edinin.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchSocialData(false)}
          className="p-2.5 bg-[#12192c] hover:bg-[#18223c] border border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
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
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-sky-500/20 text-sky-300 rounded-full font-mono font-bold">
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
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono font-bold">
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
            <span className="ml-1 px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-full font-mono font-bold">
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
          <button onClick={() => setActionMessage(null)} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading && friends.length === 0 ? (
        <div className="py-20 text-center text-sky-400 font-bold flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 animate-spin" />
          <span>Sosyal veriler yükleniyor...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: FRIENDS LIST & MESSAGING CHAT */}
          {activeTab === "friends" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
              {/* Left Friends List Sidebar */}
              <div className="lg:col-span-4 bg-[#0d1222] border border-slate-800/80 rounded-3xl p-4 flex flex-col h-[560px] overflow-hidden">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
                  <span>Mevcut Arkadaşlarım ({friends.length})</span>
                  <span className="text-[10px] text-sky-400 font-bold">Özel Mesaj</span>
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
                    {sortedFriends.map((friend) => {
                      const isSelected = activeChatFriend?.toLowerCase() === friend.username.toLowerCase();
                      const hasUnread = (friend.unreadCount || 0) > 0;
                      const timeFormatted = formatSidebarTime(friend.lastMessageTime);

                      return (
                        <div
                          key={friend.username}
                          onClick={() => handleSelectFriend(friend.username)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative group ${
                            isSelected
                              ? "bg-gradient-to-r from-sky-600/25 to-sky-500/10 border-sky-400/80 shadow-lg shadow-sky-950/40"
                              : hasUnread
                              ? "bg-gradient-to-r from-[#172140] to-[#12182c] border-sky-400/60 shadow-md shadow-sky-950/40 ring-1 ring-sky-400/30 hover:border-sky-300"
                              : "bg-[#111728] border-slate-800/80 hover:bg-[#151e38] hover:border-slate-700"
                          }`}
                        >
                          {/* Minecraft Head Avatar with Unread Badge */}
                          <div className="relative shrink-0">
                            <img
                              src={`https://mc-heads.net/avatar/${friend.username}/48`}
                              alt={friend.username}
                              referrerPolicy="no-referrer"
                              className={`w-11 h-11 rounded-xl border transition-transform group-hover:scale-105 ${
                                hasUnread
                                  ? "border-sky-400 ring-2 ring-sky-400/40"
                                  : isSelected
                                  ? "border-sky-400"
                                  : "border-slate-700/80"
                              }`}
                            />
                            {hasUnread && (
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-slate-950"></span>
                              </span>
                            )}
                          </div>

                          {/* Friend Info & Latest Message */}
                          <div className="flex-1 min-w-0">
                            {/* Top row: Username + Role + Time */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-xs font-black truncate ${
                                  hasUnread ? "text-white" : isSelected ? "text-sky-300" : "text-slate-200"
                                }`}>
                                  {friend.username}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 bg-slate-800/90 text-sky-400 border border-sky-500/20 rounded font-black uppercase shrink-0">
                                  {friend.role || "Oyuncu"}
                                </span>
                              </div>

                              {timeFormatted && (
                                <span className={`text-[10px] shrink-0 font-medium ${
                                  hasUnread ? "text-sky-300 font-bold" : "text-slate-400"
                                }`}>
                                  {timeFormatted}
                                </span>
                              )}
                            </div>

                            {/* Bottom row: Last Message Preview + Unread Count Badge */}
                            <div className="flex items-center justify-between gap-2">
                              {friend.lastMessage ? (
                                <p className={`text-xs truncate ${
                                  hasUnread
                                    ? "text-slate-100 font-bold"
                                    : isSelected
                                    ? "text-sky-200/90"
                                    : "text-slate-400"
                                }`}>
                                  {friend.lastMessage}
                                </p>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Henüz mesaj yok
                                </span>
                              )}

                              {hasUnread && (
                                <span className="shrink-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-md shadow-red-950/50 flex items-center gap-1">
                                  <span>{friend.unreadCount}</span>
                                  <span className="hidden xs:inline">Yeni</span>
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
              <div className="lg:col-span-8 bg-[#0d1222] border border-slate-800/80 rounded-3xl p-4 md:p-6 flex flex-col h-[560px] overflow-hidden relative">
                {activeChatFriend ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-3 shrink-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://mc-heads.net/avatar/${activeChatFriend}/48`}
                          alt={activeChatFriend}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl border border-sky-400/40 shrink-0"
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
                    <div
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto pr-2 space-y-3 mb-2 scroll-smooth"
                    >
                      {/* Load Older Messages Button if conversation is large */}
                      {hasOlderMessages && (
                        <div className="flex items-center justify-center pt-1 pb-3">
                          <button
                            onClick={handleLoadMoreOlderMessages}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#151f38] hover:bg-[#1d2b4e] border border-sky-500/30 text-[11px] font-bold text-sky-300 hover:text-white transition-all cursor-pointer shadow-md"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
                            <span>Daha Eski Mesajları Göster ({olderCount} mesaj daha var)</span>
                          </button>
                        </div>
                      )}

                      {chatLoading && chatMessages.length === 0 ? (
                        <div className="py-16 text-center text-sky-400 font-bold flex flex-col items-center gap-2">
                          <Sparkles className="w-6 h-6 animate-spin" />
                          <span>Sohbet yükleniyor...</span>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="py-20 text-center text-slate-500 text-xs">
                          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40 text-sky-400" />
                          <span>{activeChatFriend} ile henüz mesajlaşmadınız. Aşağıdan ilk mesajınızı yazın!</span>
                        </div>
                      ) : (
                        visibleMessages.map((msg, index) => {
                          const isMe = msg.sender.toLowerCase() === user.username.toLowerCase();
                          const dt = getCachedMessageDate(msg.createdAt);
                          
                          // Determine if day divider is needed
                          const prevMsg = index > 0 ? visibleMessages[index - 1] : null;
                          const prevDt = prevMsg ? getCachedMessageDate(prevMsg.createdAt) : null;
                          const showDateDivider = !prevDt || prevDt.dayKey !== dt.dayKey;

                          return (
                            <ChatMessageBubble
                              key={msg._id || index}
                              msg={msg}
                              isMe={isMe}
                              showDateDivider={showDateDivider}
                              dt={dt}
                            />
                          );
                        })
                      )}
                    </div>

                    {/* Isolated Chat Input Box */}
                    <ChatInputBox
                      friendName={activeChatFriend}
                      onSend={handleSendMessage}
                    />
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
