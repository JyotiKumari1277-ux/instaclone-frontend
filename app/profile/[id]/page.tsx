"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { FiArrowLeft, FiGrid } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string;
  const { theme } = useTheme();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setCurrentUser(JSON.parse(storedUser));
    fetchProfile();
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${profileId}`);
      setProfile(res.data.user || res.data);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white flex items-center justify-center">
        User not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {/* Top bar */}
      <nav className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold">InstaClone</h1>
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 dark:text-blue-400 text-sm flex items-center gap-1"
        >
          <FiArrowLeft size={16} /> Back to Feed
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-10">
        {/* Profile header */}
        <div className="flex items-center gap-8 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {profile.username?.[0]?.toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-semibold">{profile.username}</h2>
            {profile.name && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {profile.name}
              </p>
            )}
            {profile.bio && (
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                {profile.bio}
              </p>
            )}

            <div className="flex gap-6 mt-3 text-sm">
              <span>
                <span className="font-semibold">{posts.length}</span> posts
              </span>
              <span>
                <span className="font-semibold">
                  {profile.followers?.length || 0}
                </span>{" "}
                followers
              </span>
              <span>
                <span className="font-semibold">
                  {profile.following?.length || 0}
                </span>{" "}
                following
              </span>
            </div>
          </div>
        </div>

        {/* Posts grid */}
        <div className="flex items-center gap-2 mb-4 border-t border-gray-200 dark:border-gray-800 pt-4">
          <FiGrid size={18} />
          <span className="text-sm font-semibold tracking-wide">POSTS</span>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No posts yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post._id} className="aspect-square bg-gray-200 dark:bg-gray-900">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}