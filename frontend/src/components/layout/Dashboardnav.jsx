"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  Briefcase, 
  Map, 
  Video, 
  FileQuestion, 
  Menu, 
  X, 
  ChevronDown,
  User,
  LogOut,
  Settings
} from "lucide-react";

export default function DashboardNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "loading@example.com",
    profileImage: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get authentication token from cookies
      const uniquePresence = document.cookie
        .split('; ')
        .find(row => row.startsWith('uniquePresence='))
        ?.split('=')[1];

      if (!uniquePresence) {
        console.error("No authentication token found");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/getProfile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${uniquePresence}`,
          'Content-Type': 'application/json',
        },
      });
      

      if (response.ok) {
        const data = await response.json();
        
        setUserData({
          name: data.data.name || data.username || "User",
          email: data.data.email || "user@example.com",
          profileImage: data.data.profileImage || data.avatar || null,
        });
      } else {
        console.error("Failed to fetch user data:", response.statusText);
        // Fallback to localStorage
        const storedName = localStorage.getItem("user_name");
        const storedEmail = localStorage.getItem("user_email");
        if (storedName) {
          setUserData({
            name: storedName,
            email: storedEmail || "user@example.com",
            profileImage: null
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to localStorage
      const storedName = localStorage.getItem("user_name");
      const storedEmail = localStorage.getItem("user_email");
      if (storedName) {
        setUserData({
          name: storedName,
          email: storedEmail || "user@example.com",
          profileImage: null
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navLinks = [
    {
      name: "Jobs",
      path: "/dashboard/jobs",
      icon: <Briefcase className="w-5 h-5" />,
      description: "Browse opportunities"
    },
    {
      name: "Roadmap",
      path: "/dashboard/roadmap",
      icon: <Map className="w-5 h-5" />,
      description: "Career path"
    },
    {
      name: "Interview",
      path: "/dashboard/interview",
      icon: <Video className="w-5 h-5" />,
      description: "Practice sessions"
    },
    {
      name: "Quiz",
      path: "/dashboard/quiz",
      icon: <FileQuestion className="w-5 h-5" />,
      description: "Test knowledge"
    }
  ];

  const handleLogout = async () => {
    try {
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("role");
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">
              CareerAI
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 group ${
                  isActive(link.path)
                    ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive(link.path) ? "" : "group-hover:scale-110"}`}>
                  {link.icon}
                </span>
                <span>{link.name}</span>
                {isActive(link.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                )}
              </a>
            ))}
          </div>

          {/* User Profile Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 border border-gray-700 hover:border-purple-500/50 group"
              >
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-lg object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {getInitials(userData.name)}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-white">{isLoading ? "Loading..." : userData.name}</p>
                  <p className="text-xs text-gray-400">View Profile</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                    <p className="text-sm font-semibold text-white">{userData.name}</p>
                    <p className="text-xs text-gray-400">{userData.email}</p>
                  </div>
                  
                  <div className="py-2">
                    <a
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </a>
                    <a
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </a>
                  </div>

                  <div className="border-t border-gray-700 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800 animate-fadeIn">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(link.path)
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  <div>
                    <p className="font-medium">{link.name}</p>
                    <p className="text-xs opacity-75">{link.description}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Mobile User Section */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 mb-2">
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-lg object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {getInitials(userData.name)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{isLoading ? "Loading..." : userData.name}</p>
                  <p className="text-xs text-gray-400">{userData.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <a
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}