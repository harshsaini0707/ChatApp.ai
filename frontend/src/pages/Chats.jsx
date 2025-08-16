import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {SendHorizontal} from 'lucide-react'
import { useNavigate } from "react-router-dom";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
      clipRule="evenodd"
    />
  </svg>
);



const WelcomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const socketURL = import.meta.env.VITE_API_URL;

const Chats = () => {
  const { user, logout } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const logOut = async()=>{
    await axios.post(`${import.meta.env.VITE_API_URL}auth/logout`, {withCredentials:true})
    navigate('/login')
    
}

  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("lastSelectedUser");
    if (saved) setSelected(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const s = io(socketURL, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("join", `${user.id}`);
    });

    s.on("online_users", (ids) => setOnlineUserIds(ids.map((x) => `${x}`)));

    s.on("receive_message", (payload) => {
      const isActive =
        (payload.sender_id === user.id && payload.receiver_id === selected?.id) ||
        (payload.receiver_id === user.id && payload.sender_id === selected?.id);
      if (isActive) {
        setMessages((prev) => [...prev, payload]);
        queueMicrotask(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
      }
    });

    return () => s.disconnect();
  }, [user?.id, selected?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}messages/users`, { withCredentials: true });
        setAllUsers(res.data?.users || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selected?.id) return;
    (async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}messages/${user.id}/${selected.id}`, {
          withCredentials: true,
        });
        setMessages(res.data?.messages || []);
        queueMicrotask(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    })();
  }, [user?.id, selected?.id]);

  const selectUser = (u) => {
    setSelected(u);
    localStorage.setItem("lastSelectedUser", JSON.stringify(u));
  };

  const sendMessage = () => {
    if (!text.trim() || !selected?.id || !user?.id) return;
    const payload = { sender_id: user.id, receiver_id: selected.id, message: text.trim() };
    socketRef.current?.emit("private_message", payload);
    setText("");
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
    <div
      className="relative text-white h-screen w-screen flex font-sans"
    >

      <div className="absolute inset-0">
        <div className="relative bg-[linear-gradient(90deg,#14353b,#040a25_0%)] h-full w-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle,#6483c8_1px,transparent_1px)] bg-[size:22px_22px]" />
        </div>
      </div>

      {/* LEFT SIDEBAR */}
      <div className="relative z-10 flex flex-col w-1/4 min-w-[280px] max-w-[320px] bg-black/40 backdrop-blur-xl border-r border-slate-300/10">
        {/* User info */}
        <div className="flex items-center justify-between p-4 border-b border-slate-300/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="font-semibold text-slate-200">{user?.name}</span>
          </div>
          <button
            onClick={logOut}
            className="px-3 py-1.5 bg-slate-700/50 hover:bg-red-600/80 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
          >
            Logout
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
                      ? "bg-gradient-to-r from-[#3d49cf] to-[#5a2190] shadow-md"
                      : "hover:bg-slate-700/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold">
                      {u.name[0].toUpperCase()}
                    </div>
                    <span
                      title={isOnline(u.id) ? "Online" : "Offline"}
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
                        isOnline(u.id) ? "bg-emerald-500" : "bg-slate-500"
                      }`}
                    />
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

      {/* RIGHT CHAT */}
      <div className="flex-1 flex flex-col relative z-10">
        {selected ? (
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b border-slate-300/10 bg-black/20 backdrop-blur-xl flex items-center gap-4 shadow-sm">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold">
                  {selected.name[0].toUpperCase()}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
                    isOnline(selected.id) ? "bg-emerald-500" : "bg-slate-500"
                  }`}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                <p className={`text-xs ${isOnline(selected.id) ? "text-emerald-400" : "text-slate-400"}`}>
                  {isOnline(selected.id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, idx) => {
                const mine = m.sender_id === user.id;
                return (
                  <motion.div
                    key={m.id ?? `${m.sender_id}-${m.receiver_id}-${idx}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`inline-block px-4 py-2.5 rounded-t-xl shadow-md max-w-[70%] break-words ${
                        mine
                          ? "bg-gradient-to-br from-[#3d49cf] to-[#5a2190] text-white rounded-l-xl"
                          : "bg-slate-700/80 text-slate-200 rounded-r-xl"
                      }`}
                    >
                      <div>{m.message}</div>
                      <div className="text-[10px] mt-1.5 opacity-70 text-right">{fmt(m.created_at)}</div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t border-slate-300/10 bg-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-800/60 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <button
                  onClick={sendMessage}
                  className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full hover:scale-105 active:scale-95 transition-transform duration-200 shadow-lg"
                >
                  <SendHorizontal/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <WelcomeIcon />
            <h2 className="text-2xl font-semibold mt-4 text-slate-300">Welcome to Chat</h2>
            <p>Select a user from the list to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
