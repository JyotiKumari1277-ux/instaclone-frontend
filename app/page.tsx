"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useTheme } from "./context/ThemeContext";
import { getSocket } from "@/lib/socket";
import {
  FiHome,
  FiSearch,
  FiPlusSquare,
  FiHeart,
  FiUser,
  FiLogOut,
  FiBookmark,
  FiSend,
  FiMessageCircle,
  FiX,
  FiSun,
  FiMoon,
} from "react-icons/fi";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [savedPosts, setSavedPosts] = useState<{ [key: string]: boolean }>({});
  const [openComments, setOpenComments] = useState<{ [key: string]: boolean }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});
  const [unreadCount, setUnreadCount] = useState(0);

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
    fetchUnreadCount(parsedUser.id);

    // Setup socket connection
    const socket = getSocket();
    socket.emit("register", parsedUser.id);

    socket.on("newNotification", () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
    };
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

  const fetchUnreadCount = async (userId: string) => {
    try {
      const res = await api.get("/notifications");
      const unread = res.data.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
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
      {/* Sidebar - Instagram style */}
      <aside className="hidden md:flex flex-col justify-between w-20 lg:w-64 border-r border-gray-200 dark:border-gray-800 p-4 fixed h-screen">
        <div>
          <h1 className="text-2xl font-bold mb-8 px-2 hidden lg:block">
            InstaClone
          </h1>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left"
            >
              <FiHome size={24} /> <span className="hidden lg:inline">Home</span>
            </button>

            <button
              onClick={() => alert("Messages feature coming soon!")}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left opacity-50"
            >
              <FiSend size={24} /> <span className="hidden lg:inline">Messages</span>
            </button>

            <button className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left">
              <FiSearch size={24} /> <span className="hidden lg:inline">Search</span>
            </button>

            <button
              onClick={() => router.push("/notifications")}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left relative"
            >
              <div className="relative">
                <FiHeart size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline">Notifications</span>
            </button>

            <button
              onClick={() => router.push("/create")}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left"
            >
              <FiPlusSquare size={24} /> <span className="hidden lg:inline">Create</span>
            </button>

            <button
              onClick={() => router.push(`/profile/${user?.id}`)}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left"
            >
              <FiUser size={24} /> <span className="hidden lg:inline">Profile</span>
            </button>

            <button
              onClick={() => router.push("/saved")}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left"
            >
              <FiBookmark size={24} /> <span className="hidden lg:inline">Saved</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left"
            >
              {theme === "dark" ? <FiSun size={24} /> : <FiMoon size={24} />}
              <span className="hidden lg:inline">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left text-red-500 dark:text-red-400"
        >
          <FiLogOut size={24} /> <span className="hidden lg:inline">Logout</span>
        </button>
      </aside>

      {/* Mobile top bar */}
      <nav className="md:hidden flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 fixed top-0 w-full bg-white dark:bg-black z-10">
        <h1 className="text-lg font-bold">InstaClone</h1>
        <div className="flex gap-4 items-center">
          <button onClick={toggleTheme}>
            {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button onClick={() => router.push("/notifications")} className="relative">
            <FiHeart size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => router.push("/create")}>
            <FiPlusSquare size={22} />
          </button>
          <button onClick={() => router.push("/saved")}>
            <FiBookmark size={22} />
          </button>
          <button onClick={() => router.push(`/profile/${user?.id}`)}>
            <FiUser size={22} />
          </button>
          <button onClick={handleLogout} className="text-red-500 dark:text-red-400">
            Logout
          </button>
        </div>
      </nav>

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