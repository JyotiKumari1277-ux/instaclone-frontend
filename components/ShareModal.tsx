"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { FiX, FiCheck } from "react-icons/fi";

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

export default function ShareModal({ postId, onClose }: ShareModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const myId = user.id || user._id;

      const [followingRes, followersRes] = await Promise.all([
        api.get(`/users/${myId}/following`),
        api.get(`/users/${myId}/followers`),
      ]);

      const map = new Map();
      [...followingRes.data, ...followersRes.data].forEach((u: any) => {
        map.set(u._id, u);
      });

      setUsers(Array.from(map.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (selected.length === 0) return;
    setSending(true);
    try {
      await Promise.all(
        selected.map((userId) =>
          api.post(`/messages/${userId}`, { sharedPostId: postId })
        )
      );
      setSentTo(selected);
      setSelected([]);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-sm">Share to...</h2>
          <button onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-6">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">
              No followers or following yet.
            </p>
          ) : (
            users.map((u) => {
              const isSelected = selected.includes(u._id);
              const wasSent = sentTo.includes(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => !wasSent && toggleUser(u._id)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden">
                    {u.avatar ? (
                      <img src={u.avatar} className="w-full h-full object-cover" />
                    ) : (
                      u.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">{u.username}</span>
                  {wasSent ? (
                    <span className="text-xs text-green-500 font-semibold">Sent</span>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-400"
                      }`}
                    >
                      {isSelected && <FiCheck size={12} className="text-white" />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {users.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSend}
              disabled={selected.length === 0 || sending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2"
            >
              {sending ? "Sending..." : `Send${selected.length > 0 ? ` (${selected.length})` : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}