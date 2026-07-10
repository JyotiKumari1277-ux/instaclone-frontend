"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { FiMessageCircle, FiX } from "react-icons/fi";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [savedPosts, setSavedPosts] = useState<{ [key: string]: boolean }>({});
  const [openComments, setOpenComments] = useState<{ [key: string]: boolean }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
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

    if (submittingComment[postId]) return;
    setSubmittingComment({ ...submittingComment, [postId]: true });

    try {
      await api.post(`/posts/${postId}/comment`, { text });
      setCommentText({ ...commentText, [postId]: "" });
      fetchPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment({ ...submittingComment, [postId]: false });
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId: string) => {
    setOpenComments({ ...openComments, [postId]: !openComments[postId] });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex">
      <Sidebar />

      {/* Main Feed */}
      <main className="flex-1 md:ml-20 lg:ml-64 pt-16 md:pt-6 max-w-xl mx-auto px-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Welcome, {user?.name}! (@{user?.username})
        </p>

        {posts.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            No posts yet. Be the first to share something!
          </p>
        )}

        {posts.map((post) => {
          const isLiked = post.likes?.includes(user?.id);
          const isCommentsOpen = openComments[post._id];
          const isSubmitting = submittingComment[post._id];

          return (
            <div
              key={post._id}
              className="border border-gray-200 dark:border-gray-800 rounded-lg mb-6 overflow-hidden"
            >
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
                className="w-full max-h-[500px] object-cover"
              />

              <div className="p-3">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`text-sm font-semibold ${
                      isLiked ? "text-red-500" : "text-black dark:text-white"
                    }`}
                  >
                    {isLiked ? "♥ Liked" : "♡ Like"}
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-1"
                  >
                    <FiMessageCircle size={18} />
                    <span className="text-sm">
                      {post.comments?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => handleSave(post._id)}
                    className={`text-sm font-semibold ml-auto ${
                      savedPosts[post._id] ? "text-yellow-500" : "text-black dark:text-white"
                    }`}
                  >
                    {savedPosts[post._id] ? "🔖 Saved" : "🔖 Save"}
                  </button>
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

                {!isCommentsOpen && post.comments?.length > 0 && (
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="text-gray-500 text-sm mt-2"
                  >
                    View all {post.comments.length} comments
                  </button>
                )}

                {isCommentsOpen && (
                  <>
                    <div className="mt-2">
                      {post.comments?.map((c: any) => {
                        const isOwnComment = c.user?._id === user?.id;
                        return (
                          <div
                            key={c._id}
                            className="flex justify-between items-start group"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">
                                {c.user?.username}
                              </span>{" "}
                              {c.text}
                            </p>
                            {isOwnComment && (
                              <button
                                onClick={() =>
                                  handleDeleteComment(post._id, c._id)
                                }
                                className="text-gray-500 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete comment"
                              >
                                <FiX size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleComment(post._id);
                        }}
                        className="flex-1 bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:outline-none"
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        disabled={isSubmitting}
                        className="text-blue-500 dark:text-blue-400 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "..." : "Post"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}