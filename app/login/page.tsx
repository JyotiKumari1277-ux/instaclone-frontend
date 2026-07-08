"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-10 md:gap-20">
        {/* Left side - branding */}
        <div className="flex-1 text-center md:text-left order-2 md:order-1">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            See everyday moments from your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500">
              close friends
            </span>
            .
          </h1>
        </div>

        {/* Right side - login card (original style kept) */}
        <div className="w-full max-w-sm order-1 md:order-2">
          <div className="border border-gray-800 rounded-2xl p-8 bg-black">
            <h2 className="text-3xl font-bold text-center mb-6 font-serif">
              InstaClone
            </h2>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-100 text-black rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-100 text-black rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm mt-2"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <p className="text-sm text-center mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-400 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}