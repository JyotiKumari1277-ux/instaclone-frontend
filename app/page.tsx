"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ShareModal from "@/components/ShareModal";
import { FiMessageCircle, FiX, FiSend, FiPlus } from "react-icons/fi";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [savedPosts, setSavedPosts] = useState<{ [key: string]: boolean }>({});
  const [openComments, setOpenComments] = useState<{ [key: string]: boolean }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [key: string]: boolean }>({});
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);

  // Stories state
  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null);
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0);

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
    fetchStories();
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

  const fetchStories = async () => {
    try {
      const res = await api.get("/stories");
      setStoryGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStoryUploadClick = () => {
    storyInputRef.current?.click();
  };

  const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStory(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchStories();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while uploading your story.");
    } finally {
      setUploadingStory(false);
      if (storyInputRef.current) storyInputRef.current.value = "";
    }
  };

  const openStoryViewer = (groupIndex: number) => {
    setViewerGroupIndex(groupIndex);
    setViewerStoryIndex(0);

    const story = storyGroups[groupIndex]?.stories?.[0];
    if (story) {
      api.put(`/stories/${story._id}/view`).catch(() => {});
    }
  };

  const closeStoryViewer = () => {
    setViewerGroupIndex(null);
    setViewerStoryIndex(0);
  };

  const goToNextStory = () => {
    if (viewerGroupIndex === null) return;
    const currentGroup = storyGroups[viewerGroupIndex];

    if (viewerStoryIndex < currentGroup.stories.length - 1) {
      const nextIndex = viewerStoryIndex + 1;
      setViewerStoryIndex(nextIndex);
      const nextStory = currentGroup.stories[nextIndex];
      api.put(`/stories/${nextStory._id}/view`).catch(() => {});
    } else if (viewerGroupIndex < storyGroups.length - 1) {
      openStoryViewer(viewerGroupIndex + 1);
    } else {
      closeStoryViewer();
    }
  };

  const goToPrevStory = () => {
    if (viewerGroupIndex === null) return;

    if (viewerStoryIndex > 0) {
      setViewerStoryIndex(viewerStoryIndex - 1);
    } else if (viewerGroupIndex > 0) {
      const prevGroup = storyGroups[viewerGroupIndex - 1];
      setViewerGroupIndex(viewerGroupIndex - 1);
      setViewerStoryIndex(prevGroup.stories.length - 1);
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

  const myStoryGroup = storyGroups.find((g) => g.user._id === user?.id);
  const otherStoryGroups = storyGroups.filter((g) => g.user._id !== user?.id);
  const orderedGroups = myStoryGroup
    ? [myStoryGroup, ...otherStoryGroups]
    : otherStoryGroups;

  const activeGroup =
    viewerGroupIndex !== null ? orderedGroups[viewerGroupIndex] : null;
  const activeStory = activeGroup?.stories?.[viewerStoryIndex];

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex">
      <Sidebar />

      {/* Main Feed */}
      <main className="flex-1 md:ml-20 lg:ml-64 pt-16 md:pt-6 max-w-xl mx-auto px-4">
        {/* Stories row */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-4 border-b border-gray-200 dark:border-gray-800">
          {/* Your story */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              onClick={() =>
                myStoryGroup ? openStoryViewer(0) : handleStoryUploadClick()
              }
              className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer overflow-hidden ${
                myStoryGroup
                  ? "ring-2 ring-pink-500"
                  : "bg-gray-200 dark:bg-gray-800"
              }`}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              )}

              {!myStoryGroup && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStoryUploadClick();
                  }}
                  className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-black"
                >
                  <FiPlus size={12} className="text-white" />
                </div>
              )}

              {uploadingStory && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs">...</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Your Story
            </span>
            <input
              ref={storyInputRef}
              type="file"
              accept="image/*"
              onChange={handleStoryFileChange}
              className="hidden"
            />
          </div>

          {/* Other users' stories */}
          {otherStoryGroups.map((group, idx) => (
            <div
              key={group.user._id}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              onClick={() => openStoryViewer(myStoryGroup ? idx + 1 : idx)}
            >
              <div className="w-16 h-16 rounded-full ring-2 ring-pink-500 flex items-center justify-center cursor-pointer overflow-hidden">
                {group.user.avatar ? (
                  <img
                    src={group.user.avatar}
                    alt={group.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold bg-gray-200 dark:bg-gray-800 w-full h-full flex items-center justify-center">
                    {group.user.username?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 text-center">
                {group.user.username}
              </span>
            </div>
          ))}
        </div>

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

                  <button onClick={() => setSharingPostId(post._id)}>
                    <FiSend size={18} />
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

      {sharingPostId && (
        <ShareModal
          postId={sharingPostId}
          onClose={() => setSharingPostId(null)}
        />
      )}

      {/* Story Viewer */}
      {activeGroup && activeStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={closeStoryViewer}
            className="absolute top-4 right-4 text-white z-10"
          >
            <FiX size={28} />
          </button>

          {/* Progress bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {activeGroup.stories.map((_: any, i: number) => (
              <div
                key={i}
                className="h-0.5 flex-1 bg-gray-500 rounded overflow-hidden"
              >
                <div
                  className={`h-full bg-white ${
                    i < viewerStoryIndex ? "w-full" : i === viewerStoryIndex ? "w-full" : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute top-8 left-3 flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
              {activeGroup.user.avatar ? (
                <img
                  src={activeGroup.user.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                activeGroup.user.username?.[0]?.toUpperCase()
              )}
            </div>
            <span className="text-white text-sm font-semibold">
              {activeGroup.user.username}
            </span>
          </div>

          {/* Tap zones for navigation */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full" onClick={goToPrevStory} />
            <div className="w-1/2 h-full" onClick={goToNextStory} />
          </div>

          <img
            src={activeStory.image}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}