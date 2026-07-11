"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { FiArrowLeft } from "react-icons/fi";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchConversations();
  }, [router]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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

      <div className="flex-1 md:ml-20 lg:ml-64 pt-16 md:pt-0">
        <nav className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-bold">Messages</h1>
          <button
            onClick={() => router.push("/")}
            className="text-blue-500 dark:text-blue-400 text-sm flex items-center gap-1"
          >
            <FiArrowLeft size={16} /> Back to Feed
          </button>
        </nav>

        <div className="max-w-2xl mx-auto px-4 pt-6">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">
              No conversations yet.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((c) => (
                <div
                  key={c.user._id}
                  onClick={() => router.push(`/messages/${c.user._id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                    {c.user.avatar ? (
                      <img src={c.user.avatar} className="w-full h-full object-cover" />
                    ) : (
                      c.user.username?.[0]?.toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.user.username}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.lastMessage.sharedPost ? "Shared a post" : c.lastMessage.text}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-400">
                      {timeAgo(c.lastMessage.createdAt)}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}