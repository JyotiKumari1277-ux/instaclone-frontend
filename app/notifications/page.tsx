"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiHeart, FiMessageCircle, FiArrowLeft } from "react-icons/fi";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);

      // Mark all as read after fetching
      await api.put("/notifications/read-all");
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
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <nav className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold">InstaClone</h1>
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 dark:text-blue-400 text-sm flex items-center gap-1"
        >
          <FiArrowLeft size={16} /> Back to Feed
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        <h2 className="text-xl font-semibold mb-6">Notifications</h2>

        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No notifications yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  !n.read ? "bg-blue-50 dark:bg-gray-900" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {n.sender?.username?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {n.sender?.username}
                    </span>{" "}
                    {n.type === "like" && (
                      <>liked your post <FiHeart className="inline text-red-500" size={14} /></>
                    )}
                    {n.type === "comment" && (
                      <>commented on your post <FiMessageCircle className="inline" size={14} /></>
                    )}
                    {n.type === "story_like" && (
                      <>liked your story <FiHeart className="inline text-red-500" size={14} /></>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                {n.post?.image && (
                  <img
                    src={n.post.image}
                    alt="Post"
                    className="w-10 h-10 object-cover rounded"
                  />
                )}

                {n.story?.image && (
                  <img
                    src={n.story.image}
                    alt="Story"
                    className="w-10 h-10 object-cover rounded-full ring-2 ring-pink-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}