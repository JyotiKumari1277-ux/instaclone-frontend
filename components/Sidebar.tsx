"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { useTheme } from "@/app/context/ThemeContext";
import { getSocket } from "@/lib/socket";
import {
  FiHome,
  FiSearch,
  FiPlusSquare,
  FiHeart,
  FiUser,
  FiSend,
  FiSun,
  FiMoon,
  FiLogOut,
  FiCamera,
} from "react-icons/fi";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchUnreadCount();

    const socket = getSocket();
    socket.emit("register", parsedUser.id);

    socket.on("newNotification", () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
    };
  }, []);

  const fetchUnreadCount = async () => {
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

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const navItemClass = (path: string) =>
    `flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-left ${
      isActive(path) ? "font-bold" : ""
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-20 lg:w-64 border-r border-gray-200 dark:border-gray-800 p-4 fixed h-screen">
        <div>
          <h1 className="text-2xl font-bold mb-8 px-2 hidden lg:flex items-center gap-2">
            <FiCamera size={24} className="text-pink-500" />
            InstaClone
          </h1>

          <nav className="flex flex-col gap-2">
            <button onClick={() => router.push("/")} className={navItemClass("/")}>
              <FiHome size={24} /> <span className="hidden lg:inline">Home</span>
            </button>

            <button
              onClick={() => router.push("/messages")}
              className={navItemClass("/messages")}
            >
              <FiSend size={24} /> <span className="hidden lg:inline">Messages</span>
            </button>

            <button
              onClick={() => router.push("/search")}
              className={navItemClass("/search")}
            >
              <FiSearch size={24} /> <span className="hidden lg:inline">Search</span>
            </button>

            <button
              onClick={() => router.push("/notifications")}
              className={navItemClass("/notifications") + " relative"}
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
              className={navItemClass("/create")}
            >
              <FiPlusSquare size={24} /> <span className="hidden lg:inline">Create</span>
            </button>

            <button onClick={toggleTheme} className={navItemClass("__theme__")}>
              {theme === "dark" ? <FiSun size={24} /> : <FiMoon size={24} />}
              <span className="hidden lg:inline">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>

            <button
              onClick={() => router.push(`/profile/${user?.id}`)}
              className={navItemClass("/profile")}
            >
              <FiUser size={24} /> <span className="hidden lg:inline">Profile</span>
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
        <h1 className="text-lg font-bold flex items-center gap-2">
          <FiCamera size={20} className="text-pink-500" />
          InstaClone
        </h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => router.push("/search")}>
            <FiSearch size={22} />
          </button>
          <button onClick={() => router.push("/messages")}>
            <FiSend size={22} />
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
          <button onClick={toggleTheme}>
            {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
          <button onClick={() => router.push(`/profile/${user?.id}`)}>
            <FiUser size={22} />
          </button>
          <button onClick={handleLogout} className="text-red-500 dark:text-red-400">
            <FiLogOut size={20} />
          </button>
        </div>
      </nav>
    </>
  );
}