"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { FiX, FiMessageCircle, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function PostDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.id as string;
  const fromProfileId = searchParams.get("from");

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [postList, setPostList] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (fromProfileId) {
      fetchPostList(fromProfileId);
    } else {
      setPostList([]);
    }
  }, [fromProfileId]);

  const fetchPost = async () => {
    setLoading(true);
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

  const fetchPostList = async (profileId: string) => {
    try {
      const res = await api.get(`/users/${profileId}`);
      setPostList(res.data.posts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const currentIndex = postList.findIndex((p) => p._id === postId);
  const prevPost = currentIndex > 0 ? postList[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < postList.length - 1
      ? postList[currentIndex + 1]
      : null;

  const goToNeighborPost = (neighborId: string) => {
    router.push(`/post/${neighborId}?from=${fromProfileId}`);
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

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    setDeleting(true);
    try {
      await api.delete(`/posts/${postId}`);
      router.push(fromProfileId ? `/profile/${fromProfileId}` : "/");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting the post.");
      setDeleting(false);
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
  const isOwnPost = post.user?._id === user?.id;

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center p-4 relative">
      {prevPost && (
        <button
          onClick={() => goToNeighborPost(prevPost._id)}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 z-20 hover:scale-105 transition-transform"
          title="Previous post"
        >
          <FiChevronLeft size={24} />
        </button>
      )}

      {nextPost && (
        <button
          onClick={() => goToNeighborPost(nextPost._id)}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 z-20 hover:scale-105 transition-transform"
          title="Next post"
        >
          <FiChevronRight size={24} />
        </button>
      )}

      <div className="w-full max-w-3xl border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden relative">
        <button
          onClick={() => router.back()}
          className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1 z-10"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-2 p-3 pr-14">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
            {post.user?.username?.[0]?.toUpperCase()}
          </div>
          <p
            className="text-sm font-semibold cursor-pointer hover:underline"
            onClick={() => router.push(`/profile/${post.user?._id}`)}
          >
            {post.user?.username}
          </p>

          {isOwnPost && (
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className="ml-auto text-red-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1 text-sm font-semibold"
              title="Delete post"
            >
              <FiTrash2 size={16} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
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