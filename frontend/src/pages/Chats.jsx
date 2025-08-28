import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Send, LogOut, ArrowLeft, BrainCircuit, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThreeDots } from "react-loader-spinner";


const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const WelcomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);


const socketURL = import.meta.env.VITE_API_URL;
const apiURL = import.meta.env.VITE_API_URL;

const aiUser = {
  id: 'ai-chat',
  name: 'AI Buddy',
  email: 'Your helpful AI companion',
};

const Chats = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAiReplying, setIsAiReplying] = useState(false);
  const navigate = useNavigate();

  const logOut = async () => {
    await axios.post(`${apiURL}auth/logout`, {}, { withCredentials: true });
    navigate("/login");
  };

  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lastSelectedUser");
    if (saved) setSelected(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const s = io(socketURL, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => s.emit("join", `${user.id}`));
    s.on("online_users", (ids) => setOnlineUserIds(ids.map((x) => `${x}`)));

    s.on("receive_message", (payload) => {
      const isChattingWithSender = selected?.id !== 'ai-chat' &&
        ((payload.sender_id === user.id && payload.receiver_id === selected?.id) &&
        (payload.receiver_id === user.id && payload.sender_id === selected?.id));
      
      if (isChattingWithSender) {
        setMessages((prev) => [...prev, payload]);
      }
    });

    return () => s.disconnect();
  }, [user?.id, selected?.id]);

  

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${apiURL}messages/users`, { withCredentials: true });
      
        setAllUsers([aiUser, ...(res.data?.users || [])]);
      } catch (err) {
        console.error(err);
        if (err?.response?.status === 401) {
          return navigate("/login");
        }
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isAiReplying]);

  
  useEffect(() => {
    if (!selected?.id || !user?.id) return;

    const fetchHistory = async () => {
      try {
        if (selected.id === 'ai-chat') {
          const res = await axios.get(`${apiURL}messages/aiChatHistory`, { withCredentials: true });
          
          const formattedHistory = (res.data?.chat || []).flatMap(item => [
            {
              sender_id: user.id,
              message: item.message,
              created_at: item.created_at,
            },
            {
              sender_id: 'ai-model', 
              message: item.ai_response,
              created_at: item.created_at,
            }
          ]);
          setMessages(formattedHistory);
        } else {
         
          const res = await axios.get(`${apiURL}messages/${user.id}/${selected.id}`, { withCredentials: true });
          setMessages(res.data?.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
        if (err?.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchHistory();
  }, [user?.id, selected?.id]);

  const selectUser = (u) => {
    setSelected(u);
    localStorage.setItem("lastSelectedUser", JSON.stringify(u));
  };

  const sendAiMessage = async () => {
    const userMessage = text.trim();
    if (!userMessage) return;

    const userMessagePayload = {
      sender_id: user.id,
      message: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessagePayload]);
    setText("");
    setIsAiReplying(true);

    try {
      const res = await axios.post(
        `${apiURL}messages/aiChat`,
        { text: userMessage }, 
        { withCredentials: true }
      );
      
      const aiResponsePayload = {
        sender_id: 'ai-model',
        message: res.data?.data?.ai_response || "Sorry, I couldn't process that.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponsePayload]);

    } catch (err) {
      console.error("AI chat error:", err);
      const errorPayload = {
        sender_id: 'ai-model',
        message: "An error occurred. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorPayload]);
    } finally {
      setIsAiReplying(false);
    }
  };

  const sendUserMessage = () => {
    if (!text.trim() || !selected?.id || !user?.id) return;
    const payload = { sender_id: user.id, receiver_id: selected.id, message: text.trim() };
    socketRef.current?.emit("private_message", payload);
    setMessages((prev) => [...prev, { ...payload, created_at: new Date().toISOString() }]);
    setText("");
  };
  
  // Universal send message handler
  const handleSendMessage = () => {
    if (selected?.id === 'ai-chat') {
      sendAiMessage();
    } else {
      sendUserMessage();
    }
  };


  const fmt = (d) => {
    const date = new Date(d);
    if (isNaN(date)) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [allUsers, query]);

  const isOnline = (id) => onlineUserIds.includes(`${id}`);

  return (
    <div className="relative text-white h-screen w-screen flex font-sans">

      <div className="absolute inset-0">
        <div className="relative bg-[linear-gradient(90deg,#14353b,#040a25_0%)] h-full w-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle,#6483c8_1px,transparent_1px)] bg-[size:22px_22px]" />
        </div>
      </div>

   
      <div className="relative z-10 flex w-full h-full">
        
        {(!isMobile || !selected) && (
          
          <div className="relative flex flex-col w-full overflow-hidden md:w-1/4 min-w-[280px] max-w-[320px] bg-black/50 backdrop-blur-xl border-r border-slate-300/10">
            
           
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `
                  radial-gradient(ellipse 120% 80% at 70% 20%, rgba(255, 20, 147, 0.15), transparent 50%),
                  radial-gradient(ellipse 100% 60% at 30% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
                  radial-gradient(ellipse 90% 70% at 50% 0%, rgba(138, 43, 226, 0.18), transparent 65%),
                  radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
                  #000000
                `,
              }}
            />
            
           
            <div className="relative z-10 flex flex-col flex-1 h-full">
              {/* User info */}
              <div className="flex items-center justify-between p-4 border-b border-slate-300/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="font-semibold text-slate-200">{user?.name}</span>
                </div>
                <button onClick={logOut} className="p-2 hover:bg-red-600/80 text-white rounded-lg transition-colors duration-200">
                  <LogOut size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-300/10">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/60 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  <AnimatePresence>
                    {filteredUsers.map((u) => (
                      <motion.li
                        key={u.id}
                        onClick={() => selectUser(u)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        layout
                        className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-4 ${
                          selected?.id === u.id
                            ? "bg-gradient-to-r from-[#1c7d53] via-[#433f82] to-[#353090] shadow-md"
                            : "hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold">
                            {u.id === 'ai-chat' ? <Brain size={22} /> : u.name[0].toUpperCase()}
                          </div>
                          {u.id !== 'ai-chat' && (
                            <span
                              title={isOnline(u.id) ? "Online" : "Offline"}
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
                                isOnline(u.id) ? "bg-emerald-500" : "rounded-none border-0 border-transparent"
                              }`}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name}</p>
                          <p className={`text-xs truncate ${selected?.id === u.id ? "text-purple-200" : "text-slate-400"}`}>
                            {u.email}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {filteredUsers.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">No users found.</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}


        {/* Chat Area */}
        {(!isMobile || selected) && (
          <div className="flex-1 flex flex-col relative z-10">
            {selected ? (
              <>
                {/* Header */}
                <div className="px-6 py-3 border-b border-slate-300/10 bg-black/20 backdrop-blur-xl flex items-center gap-4 shadow-sm">
                  {isMobile && (
                    <button onClick={() => setSelected(null)} className="mr-2 p-2 hover:bg-slate-700 rounded-full">
                      <ArrowLeft />
                    </button>
                  )}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold">
                      {selected.id === 'ai-chat' ? <BrainCircuit size={22} /> : selected.name[0].toUpperCase()}
                    </div>
                    {selected.id !== 'ai-chat' && (
                        <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
                            isOnline(selected.id) ? "bg-emerald-500" : "bg-slate-500"
                        }`}
                        />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                    {selected.id !== 'ai-chat' && (
                      <p className={`text-xs ${isOnline(selected.id) ? "text-emerald-400" : "text-slate-400"}`}>
                        {isOnline(selected.id) ? "Online" : "Offline"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                  {messages.map((m, idx) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`inline-block px-4 py-2 rounded-t-xl shadow-md max-w-[80%] break-words ${
                            mine
                              ? "bg-gradient-to-br from-indigo-800 to-purple-950 rounded-l-xl"
                              : "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 rounded-r-xl"
                          }`}
                        >
                          <div>{m.message}</div>
                          <div className="text-[10px] mt-1.5 opacity-70 text-right">{fmt(m.created_at)}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {isAiReplying && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                       <div className="inline-block px-4 py-2 rounded-t-xl rounded-r-xl shadow-md bg-gradient-to-br from-slate-700 to-slate-800">
                         <ThreeDots height="20" width="40" radius="9" color="#a7a3b3" ariaLabel="three-dots-loading" />
                       </div>
                    </motion.div>
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-300/10 bg-black/20 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-800/60 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      disabled={selected?.id === 'ai-chat' && isAiReplying}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!text.trim() || (selected?.id === 'ai-chat' && isAiReplying)}
                    >
                      <Send />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                <WelcomeIcon />
                <h2 className="text-2xl font-semibold mt-4 text-slate-300">Welcome to Chat</h2>
                <p>Select a user or the AI Buddy to start a conversation.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;