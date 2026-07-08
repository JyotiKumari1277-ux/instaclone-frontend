"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiGrid, FiBookmark, FiX } from "react-icons/fi";

export default function Profile() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  const [listModalType, setListModalType] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUserId(String(parsed.id));
    }
    fetchProfile();
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${params.id}`);
      setProfile(res.data.user);
      setPosts(res.data.posts);
      setEditName(res.data.user?.name || "");
      setEditBio(res.data.user?.bio || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await api.put(`/users/${params.id}/follow`);
      setProfile({
        ...profile,
        isFollowing: res.data.following,
        followersCount: res.data.followersCount,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = () => {
    setEditName(profile?.name || "");
    setEditBio(profile?.bio || "");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("bio", editBio);

      const res = await api.put("/users/me/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile({
        ...profile,
        name: res.data.name,
        bio: res.data.bio,
      });

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = res.data.name;
        parsed.bio = res.data.bio;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const openListModal = async (type: "followers" | "following") => {
    setListModalType(type);
    setListLoading(true);
    try {
      const res = await api.get(`/users/${params.id}/${type}`);
      setListUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const goToUserProfile = (userId: string) => {
    setListModalType(null);
    router.push(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const isOwnProfile = currentUserId === String(params.id);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="max-w-3xl mx-auto px-4 pt-10">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 text-sm"
          >
            ← Back to Feed
          </button>
        </div>

        {/* Top section: avatar + info - responsive */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-10 mb-8 text-center sm:text-left">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gray-700 flex items-center justify-center text-3xl sm:text-4xl font-bold overflow-hidden shrink-0">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile?.username?.[0]?.toUpperCase()
            )}
          </div>

          <div className="w-full sm:w-auto flex flex-col items-center sm:items-start">
            {/* Username - no button next to it on mobile */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">
              {profile?.username}
            </h1>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-8 text-sm md:text-base mb-3">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <button
                onClick={() => openListModal("followers")}
                className="hover:underline"
              >
                <strong>{profile?.followersCount || 0}</strong> followers
              </button>
              <button
                onClick={() => openListModal("following")}
                className="hover:underline"
              >
                <strong>{profile?.followingCount || 0}</strong> following
              </button>
            </div>

            {/* Name + Bio */}
            <p className="font-semibold text-sm">{profile?.name}</p>
            {profile?.bio && (
              <p className="text-sm text-gray-300 mb-4">{profile.bio}</p>
            )}

            {/* Edit Profile / Follow button - below bio */}
            {isOwnProfile ? (
              <button
                onClick={openEditModal}
                className="bg-gray-800 hover:bg-gray-700 px-6 py-1.5 rounded-lg text-sm font-semibold w-full sm:w-auto"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-6 py-1.5 rounded-lg text-sm font-semibold w-full sm:w-auto ${
                  profile?.isFollowing
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {profile?.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-16 border-t border-gray-800 pt-3">
          <button className="flex items-center gap-2 text-sm font-semibold border-t-2 border-white pt-3 -mt-3">
            <FiGrid size={16} /> POSTS
          </button>
          {isOwnProfile && (
            <button
              onClick={() => router.push("/saved")}
              className="flex items-center gap-2 text-sm text-gray-500 pt-3"
            >
              <FiBookmark size={16} /> SAVED
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1 mt-4 pb-10">
          {posts.length === 0 && (
            <p className="col-span-3 text-center text-gray-500 mt-10">
              No posts yet.
            </p>
          )}
          {posts.map((post) => (
            <div key={post._id} className="aspect-square bg-gray-900">
              <img
                src={post.image}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FiX size={22} />
            </button>

            <h2 className="text-lg font-semibold mb-5">Edit Profile</h2>

            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your name"
            />

            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Write something about yourself..."
            />

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Followers/Following List Modal */}
      {listModalType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-base font-semibold capitalize">
                {listModalType}
              </h2>
              <button
                onClick={() => setListModalType(null)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {listLoading ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Loading...
                </p>
              ) : listUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  No {listModalType} yet.
                </p>
              ) : (
                listUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => goToUserProfile(u._id)}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-800 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        u.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{u.username}</p>
                      <p className="text-xs text-gray-400">{u.name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}