"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setCurrentUser(JSON.parse(storedUser));
    fetchProfile();
  }, [router, profileId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${profileId}`);
      setProfile(res.data.user);
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await api.put(`/users/${profileId}/follow`);
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileId;

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex justify-between items-center px-6 py-4 border-b border-gray-800 sticky top-0 bg-black z-10">
        <h1 className="text-xl font-bold font-serif">InstaClone</h1>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-400 font-semibold"
        >
          ← Back to Feed
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold">
            {profile?.username?.[0]?.toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{profile?.username}</h2>
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`text-sm px-4 py-1 rounded font-semibold ${
                    profile?.isFollowing
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {profile?.isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm">{profile?.name}</p>
            {profile?.bio && (
              <p className="text-sm mt-1">{profile.bio}</p>
            )}

            <div className="flex gap-4 mt-2 text-sm text-gray-300">
              <span>
                <strong>{posts.length}</strong> posts
              </span>
              <span>
                <strong>{profile?.followersCount}</strong> followers
              </span>
              <span>
                <strong>{profile?.followingCount}</strong> following
              </span>
            </div>
          </div>
        </div>

        <hr className="border-gray-800 mb-4" />

        {posts.length === 0 && (
          <p className="text-gray-500 text-center mt-10">No posts yet.</p>
        )}

        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => (
            <img
              key={post._id}
              src={post.image}
              alt="Post"
              className="w-full h-40 object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}