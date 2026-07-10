"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("OTP sent to your email. Check your inbox.");
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="border border-gray-800 rounded-2xl p-8 bg-black">
          <h2 className="text-3xl font-bold text-center mb-2 font-serif">
            InstaClone
          </h2>
          <p className="text-center text-gray-400 text-sm mb-6">
            {step === 1
              ? "Enter your email to receive a reset code"
              : "Enter the code sent to your email"}
          </p>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center mb-4">
              {success}
            </p>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-100 text-black rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm mt-2"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="bg-gray-100 text-black rounded-lg px-3 py-2.5 text-sm focus:outline-none tracking-widest text-center"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-gray-100 text-black rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm mt-2"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-blue-400 text-sm mt-1"
              >
                ← Change email
              </button>
            </form>
          )}

          <p className="text-sm text-center mt-5">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-400 font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}