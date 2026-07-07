"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [savedPosts, setSavedPosts] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchPosts();
  }, [router]);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/posts");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleLike = async (postId: string) => {
    try {
      await api.put(`/posts/${postId}/like`);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const res = await api.put(`/posts/${postId}/save`);
      setSavedPosts({ ...savedPosts, [postId]: res.data.saved });
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/posts/${postId}/comment`, { text });
      setCommentText({ ...commentText, [postId]: "" });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800 sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold font-serif">InstaClone</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => router.push("/create")}
            className="bg-blue-500 hover:bg-blue-600 text-sm px-4 py-2 rounded font-semibold"
          >
            + New Post
          </button>
          <button
            onClick={() => router.push(`/profile/${user?.id}`)}
            className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded font-semibold"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-sm px-4 py-2 rounded font-semibold"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto p-4">
        <p className="text-gray-400 mb-4">
          Welcome, {user?.name}! (@{user?.username})
        </p>

        {posts.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            No posts yet. Be the first to share something!
          </p>
        )}

        {posts.map((post) => {
          const isLiked = post.likes?.includes(user?.id);

          return (
            <div
              key={post._id}
              className="border border-gray-800 rounded-lg mb-6 overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                  {post.user?.username?.[0]?.toUpperCase()}
                </div>
                <p
                  className="text-sm font-semibold cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${post.user?._id}`)}
                >
                  {post.user?.username}
                </p>
              </div>

              <img
                src={post.image}
                alt="Post"
                className="w-full max-h-[500px] object-cover"
              />

              <div className="p-3">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`text-sm font-semibold mr-4 ${
                    isLiked ? "text-red-500" : "text-white"
                  }`}
                >
                  {isLiked ? "♥ Liked" : "♡ Like"}
                </button>
                <span className="text-sm text-gray-400">
                  {post.likes?.length || 0} likes
                </span>

                <button
                  onClick={() => handleSave(post._id)}
                  className={`text-sm font-semibold float-right ${
                    savedPosts[post._id] ? "text-yellow-400" : "text-white"
                  }`}
                >
                  {savedPosts[post._id] ? "🔖 Saved" : "🔖 Save"}
                </button>

                {post.caption && (
                  <p className="text-sm mt-2">
                    <span className="font-semibold">{post.user?.username}</span>{" "}
                    {post.caption}
                  </p>
                )}

                <div className="mt-2">
                  {post.comments?.map((c: any, i: number) => (
                    <p key={i} className="text-sm text-gray-300">
                      <span className="font-semibold">{c.user?.username}</span>{" "}
                      {c.text}
                    </p>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText[post._id] || ""}
                    onChange={(e) =>
                      setCommentText({
                        ...commentText,
                        [post._id]: e.target.value,
                      })
                    }
                    className="flex-1 bg-gray-900 text-white text-sm border border-gray-700 rounded px-2 py-1 focus:outline-none"
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    className="text-blue-400 text-sm font-semibold"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}