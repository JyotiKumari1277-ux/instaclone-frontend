"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { FiX, FiMessageCircle } from "react-icons/fi";

export default function PostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${postId}`);
      setPost(res.data);
    } catch (err) {
      console.error(err);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await api.put(`/posts/${postId}/like`);
      fetchPost();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comment`, { text: commentText });
      setCommentText("");
      fetchPost();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white gap-4">
        <p>Post not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 font-semibold"
        >
          ← Back to Feed
        </button>
      </div>
    );
  }

  const isLiked = post.likes?.includes(user?.id);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden relative">
        <button
          onClick={() => router.back()}
          className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 z-10"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-2 p-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
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
          className="w-full max-h-[600px] object-contain bg-black"
        />

        <div className="p-3">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handleLike}
              className={`text-sm font-semibold ${
                isLiked ? "text-red-500" : "text-black dark:text-white"
              }`}
            >
              {isLiked ? "♥ Liked" : "♡ Like"}
            </button>
            <div className="flex items-center gap-1">
              <FiMessageCircle size={18} />
              <span className="text-sm">{post.comments?.length || 0}</span>
            </div>
          </div>

          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
            {post.likes?.length || 0} likes
          </span>

          {post.caption && (
            <p className="text-sm mt-1">
              <span className="font-semibold">{post.user?.username}</span>{" "}
              {post.caption}
            </p>
          )}

          <div className="mt-3 max-h-40 overflow-y-auto">
            {post.comments?.map((c: any) => (
              <p key={c._id} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                <span className="font-semibold">{c.user?.username}</span>{" "}
                {c.text}
              </p>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              className="flex-1 bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:outline-none"
            />
            <button
              onClick={handleComment}
              disabled={submitting}
              className="text-blue-500 dark:text-blue-400 text-sm font-semibold disabled:opacity-40"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}