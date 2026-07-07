"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiBookmark } from "react-icons/fi";

export default function SavedPosts() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSaved();
  }, [router]);

  const fetchSaved = async () => {
    try {
      const res = await api.get("/users/me/saved");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 pt-10">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 text-sm"
          >
            ← Back to Feed
          </button>
        </div>

        <div className="flex items-center gap-2 mb-8 border-t border-gray-800 pt-4">
          <FiBookmark size={20} />
          <h1 className="text-lg font-semibold">Saved Posts</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No saved posts yet. Save posts from the feed to see them here.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post._id} className="aspect-square bg-gray-900">
                <img
                  src={post.image}
                  alt="Saved post"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}