"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { FiSearch } from "react-icons/fi";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchUsers(query);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const searchUsers = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/search/${searchQuery}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="max-w-2xl mx-auto px-4 pt-10">
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 dark:text-blue-400 text-sm mb-6"
        >
          ← Back to Feed
        </button>

        <h1 className="text-xl font-semibold mb-6">Search</h1>

        <div className="relative mb-6">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            autoFocus
            placeholder="Search by username or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        {loading && (
          <p className="text-gray-500 text-sm text-center">Searching...</p>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <p className="text-gray-500 text-sm text-center">
            No users found.
          </p>
        )}

        <div className="flex flex-col gap-1">
          {results.map((user) => (
            <div
              key={user._id}
              onClick={() => router.push(`/profile/${user._id}`)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.username?.[0]?.toUpperCase()
                )}
              </div>

              <div>
                <p className="text-sm font-semibold">{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}