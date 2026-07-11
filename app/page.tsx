"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ShareModal from "@/components/ShareModal";
import { FiMessageCircle, FiX, FiSend, FiPlus, FiHeart, FiTrash2, FiEye, FiChevronUp } from "react-icons/fi";

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
  const [deletingStory, setDeletingStory] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Seen-by state
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [viewersData, setViewersData] = useState<any>(null);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [addingToStory, setAddingToStory] = useState<string | null>(null);

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<{ [key: string]: boolean }>({});

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
    fetchSuggestedUsers();
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

  const fetchSuggestedUsers = async () => {
    try {
      const res = await api.get("/users/suggested");
      setSuggestedUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowSuggestion = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/follow`);
      setFollowingIds({ ...followingIds, [userId]: true });
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
    setReplyText("");

    const story = storyGroups[groupIndex]?.stories?.[0];
    if (story) {
      api.put(`/stories/${story._id}/view`).catch(() => {});
    }
  };

  const closeStoryViewer = () => {
    setViewerGroupIndex(null);
    setViewerStoryIndex(0);
    setReplyText("");
  };

  const goToNextStory = () => {
    if (viewerGroupIndex === null) return;
    setReplyText("");
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
    setReplyText("");

    if (viewerStoryIndex > 0) {
      setViewerStoryIndex(viewerStoryIndex - 1);
    } else if (viewerGroupIndex > 0) {
      const prevGroup = storyGroups[viewerGroupIndex - 1];
      setViewerGroupIndex(viewerGroupIndex - 1);
      setViewerStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleLikeStory = async (storyId: string) => {
    try {
      await api.put(`/stories/${storyId}/like`);

      setStoryGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          stories: group.stories.map((s: any) => {
            if (s._id !== storyId) return s;
            const alreadyLiked = s.likes?.includes(user?.id);
            const newLikes = alreadyLiked
              ? s.likes.filter((id: string) => id !== user?.id)
              : [...(s.likes || []), user?.id];
            return { ...s, likes: newLikes };
          }),
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Delete this story?")) return;

    setDeletingStory(true);
    try {
      await api.delete(`/stories/${storyId}`);
      closeStoryViewer();
      fetchStories();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting the story.");
    } finally {
      setDeletingStory(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeStory || !activeGroup) return;
    if (sendingReply) return;

    setSendingReply(true);
    try {
      await api.post(`/messages/${activeGroup.user._id}`, {
        text: replyText,
        storyId: activeStory._id,
      });
      setReplyText("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while sending your reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const openViewersModal = async (storyId: string) => {
    setShowViewersModal(true);
    setLoadingViewers(true);
    try {
      const res = await api.get(`/stories/${storyId}/viewers`);
      setViewersData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingViewers(false);
    }
  };

  const closeViewersModal = () => {
    setShowViewersModal(false);
    setViewersData(null);
  };

  const handleViewPost = () => {
    if (!activeStory?.sourcePost?._id) return;
    const postId = activeStory.sourcePost._id;
    closeStoryViewer();
    router.push(`/post/${postId}`);
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
  const handleAddToStory = async (postId: string) => {
    setAddingToStory(postId);
    try {
      await api.post(`/stories/from-post/${postId}`);
      fetchStories();
      alert("Added to your story!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while adding to story.");
    } finally {
      setAddingToStory(null);
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
  const isOwnStory = activeGroup?.user?._id === user?.id;
  const isStoryLiked = activeStory?.likes?.includes(user?.id);

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

        {/* Suggested for you */}
        {suggestedUsers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              Suggested for you
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {suggestedUsers.map((s) => (
                <div
                  key={s._id}
                  className="flex flex-col items-center gap-2 flex-shrink-0 w-24 border border-gray-200 dark:border-gray-800 rounded-lg p-3"
                >
                  <div
                    onClick={() => router.push(`/profile/${s._id}`)}
                    className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden cursor-pointer"
                  >
                    {s.avatar ? (
                      <img src={s.avatar} alt={s.username} className="w-full h-full object-cover" />
                    ) : (
                      s.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate w-full text-center">
                    {s.username}
                  </p>
                  <button
                    onClick={() => handleFollowSuggestion(s._id)}
                    disabled={followingIds[s._id]}
                    className={`text-xs font-semibold px-3 py-1 rounded w-full ${
                      followingIds[s._id]
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-500"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {followingIds[s._id] ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    onClick={() => handleAddToStory(post._id)}
                    disabled={addingToStory === post._id}
                    title="Add to your story"
                    className="disabled:opacity-50"
                  >
                    <FiPlus size={18} />
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
            className="absolute top-4 right-4 text-white z-20"
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

          {/* Seen by (own story only) */}
          {isOwnStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openViewersModal(activeStory._id);
              }}
              className="absolute bottom-20 left-4 flex items-center gap-1 text-white z-20"
            >
              <FiEye size={16} />
              <span className="text-sm">
                Seen by {activeStory.viewers?.length || 0}
              </span>
            </button>
          )}

          {/* View Post - only if this story was made from a post */}
          {activeStory?.sourcePost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewPost();
              }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white z-20"
            >
              <FiChevronUp size={18} />
              <span className="text-xs font-semibold">View Post</span>
            </button>
          )}

          {/* Reply + Like + Delete bar */}
          <div
            className="absolute bottom-6 left-0 right-0 flex items-center gap-3 px-4 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {!isOwnStory && (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Reply to ${activeGroup.user.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendReply();
                  }}
                  className="flex-1 bg-transparent border border-white/60 text-white placeholder-white/70 text-sm rounded-full px-4 py-2 focus:outline-none"
                />
                {replyText.trim() && (
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply}
                    className="text-white disabled:opacity-50"
                  >
                    <FiSend size={22} />
                  </button>
                )}
              </div>
            )}

            {!isOwnStory && (
              <button
                onClick={() => handleLikeStory(activeStory._id)}
                className="flex items-center gap-1 text-white"
              >
                <FiHeart
                  size={26}
                  className={isStoryLiked ? "fill-red-500 text-red-500" : "text-white"}
                />
              </button>
            )}

            {isOwnStory && activeStory.likes?.length > 0 && (
              <span className="flex items-center gap-1 text-white text-sm">
                <FiHeart size={20} className="fill-red-500 text-red-500" />
                {activeStory.likes.length}
              </span>
            )}

            {isOwnStory && (
              <button
                onClick={() => handleDeleteStory(activeStory._id)}
                disabled={deletingStory}
                className="text-white disabled:opacity-50"
              >
                <FiTrash2 size={24} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Viewers + Likes Modal (own story) */}
      {showViewersModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] px-4"
          onClick={closeViewersModal}
        >
          <div
            className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-t-xl sm:rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-semibold">
                {loadingViewers
                  ? "Loading..."
                  : `Seen by ${viewersData?.viewCount || 0} · Liked by ${viewersData?.likeCount || 0}`}
              </h2>
              <button onClick={closeViewersModal}>
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingViewers ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Loading...
                </p>
              ) : !viewersData?.viewers?.length ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  No views yet.
                </p>
              ) : (
                viewersData.viewers.map((v: any) => (
                  <div
                    key={v._id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                      {v.avatar ? (
                        <img
                          src={v.avatar}
                          alt={v.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        v.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{v.username}</p>
                      <p className="text-xs text-gray-500">{v.name}</p>
                    </div>
                    {v.liked && (
                      <FiHeart size={16} className="fill-red-500 text-red-500" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}