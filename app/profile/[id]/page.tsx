"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiGrid, FiBookmark } from "react-icons/fi";

export default function Profile() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const isOwnProfile = currentUserId === String(params.id);

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

        <div className="flex items-center gap-10 mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-bold overflow-hidden shrink-0">
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

          <div>
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-xl md:text-2xl font-semibold">
                {profile?.username}
              </h1>

              {isOwnProfile ? (
                <button className="bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-lg text-sm font-semibold">
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                    profile?.isFollowing
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {profile?.isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            <div className="flex gap-8 text-sm md:text-base mb-4">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <span>
                <strong>{profile?.followersCount || 0}</strong> followers
              </span>
              <span>
                <strong>{profile?.followingCount || 0}</strong> following
              </span>
            </div>

            <p className="font-semibold text-sm">{profile?.name}</p>
            {profile?.bio && (
              <p className="text-sm text-gray-300">{profile.bio}</p>
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
    </div>
  );
}