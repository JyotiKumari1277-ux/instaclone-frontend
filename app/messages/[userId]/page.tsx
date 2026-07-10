"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import { FiArrowLeft, FiSend } from "react-icons/fi";

export default function ChatWindow() {
  const router = useRouter();
  const params = useParams();
  const otherUserId = params.userId as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setMyId(user._id || user.id);

    fetchThread();

    const socket = getSocket();
    socket.emit("register", user._id || user.id);

    socket.on("newMessage", (msg: any) => {
      if (msg.sender._id === otherUserId || msg.receiver._id === otherUserId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [router, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchThread = async () => {
    try {
      const res = await api.get(`/messages/${otherUserId}`);
      setMessages(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        const other =
          first.sender._id === otherUserId ? first.sender : first.receiver;
        setOtherUser(other);
      } else {
        // No messages yet — still try to get the other user's basic info
        try {
          const userRes = await api.get(`/users/${otherUserId}`);
          setOtherUser(userRes.data.user);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await api.post(`/messages/${otherUserId}`, { text });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToSharedPost = (sharedPost: any) => {
    if (sharedPost?._id) {
      router.push(`/post/${sharedPost._id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex">
      <Sidebar />

      <div className="flex-1 md:ml-20 lg:ml-64 flex flex-col h-screen pt-16 md:pt-0">
        {/* Header */}
        <nav className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <button onClick={() => router.push("/messages")} className="md:hidden">
            <FiArrowLeft size={20} />
          </button>
          <div
            className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden cursor-pointer"
            onClick={() => router.push(`/profile/${otherUserId}`)}
          >
            {otherUser?.avatar ? (
              <img src={otherUser.avatar} className="w-full h-full object-cover" />
            ) : (
              otherUser?.username?.[0]?.toUpperCase()
            )}
          </div>
          <p
            className="font-semibold text-sm cursor-pointer"
            onClick={() => router.push(`/profile/${otherUserId}`)}
          >
            {otherUser?.username || "Chat"}
          </p>
        </nav>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold overflow-hidden mb-3">
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} className="w-full h-full object-cover" />
                ) : (
                  otherUser?.username?.[0]?.toUpperCase()
                )}
              </div>
              <p className="font-semibold">{otherUser?.username}</p>
              <p className="text-gray-500 text-sm mt-1">
                Say hi to start the conversation.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const isMine = m.sender._id === myId;
                return (
                  <div
                    key={m._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {m.sharedPost ? (
                        <div>
                          <img
                            src={m.sharedPost.image}
                            onClick={() => goToSharedPost(m.sharedPost)}
                            className="w-40 h-40 object-cover rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          {m.text && <p>{m.text}</p>}
                        </div>
                      ) : (
                        <p>{m.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex items-center gap-2 max-w-2xl mx-auto w-full flex-shrink-0">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2.5"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}