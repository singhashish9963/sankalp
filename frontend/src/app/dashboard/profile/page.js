"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Bookmark,
  Edit2,
  Save,
  X,
  Linkedin,
  Github,
  Globe,
  Award,
  Book,
  TrendingUp
} from "lucide-react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
   const [loading, setLoading] = useState(false); // ✅ for save status
    const [error, setError] = useState(null);
    const [fetching, setFetching] = useState(true); // ✅ for initial fetch

    const getUniquePresence = () => {
    if (typeof window === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("uniquePresence="));
    return match ? match.split("=")[1] : null;
  };
  

  const [profileData, setProfileData] = useState({
    name: "Loading...",
    email: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    linkedin: "",
    github: "",
    website: "",
    joinDate: "",
    bookmarkedJobs: [], // ✅
  skills: [],         // ✅
  goals: []           // ✅
  });

  const [tempData, setTempData] = useState(profileData);
  console.log('Temp Data:', tempData);
 

  

  // const bookmarkedJobs = [
  //   {
  //     id: 1,
  //     title: "Senior Frontend Developer",
  //     company: "TechCorp Inc.",
  //     location: "Remote",
  //     salary: "$120k - $150k",
  //     type: "Full-time",
  //     bookmarkedDate: "2 days ago"
  //   },
  //   {
  //     id: 2,
  //     title: "Full Stack Engineer",
  //     company: "StartupXYZ",
  //     location: "San Francisco, CA",
  //     salary: "$130k - $160k",
  //     type: "Full-time",
  //     bookmarkedDate: "5 days ago"
  //   },
  //   {
  //     id: 3,
  //     title: "React Developer",
  //     company: "Digital Agency",
  //     location: "New York, NY",
  //     salary: "$110k - $140k",
  //     type: "Contract",
  //     bookmarkedDate: "1 week ago"
  //   }
  // ];

 

  // const skills = [
  //   "React", "Node.js", "TypeScript", "Python", "AWS",
  //   "Docker", "MongoDB", "PostgreSQL", "GraphQL", "Next.js",
  //   "Tailwind CSS", "Git", "CI/CD", "REST APIs", "Microservices"
  // ];
  const uniquePresence = getUniquePresence();

     // ✅ Fetch real data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!uniquePresence) return;
      try {
        setFetching(true);
        const response = await fetch("/api/getProfile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${uniquePresence}`,
          },
        });

        const result = await response.json();
        console.log("Fetched profile data:", result);
        if (result.status === "success" && result.data) {
          setProfileData(result.data);
          setTempData(result.data);
        } else {
          console.warn("No profile found, creating new profile...");
          setProfileData({
            name: "New User",
            email: "",
            phone: "",
            location: "",
            title: "",
            bio: "Write something about yourself...",
            linkedin: "",
            github: "",
            website: "",
            joinDate: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
          });
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError("Failed to fetch profile");
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [uniquePresence]);
    // --- Save to DB ---
  const saveUserProfile = async () => {
    setLoading(true);
    setError(null);

console.log('Saving profile with uniquePresence:', uniquePresence);
    try {
      const response = await fetch("/api/saveProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${uniquePresence}`, // Supabase token
        },
        body: JSON.stringify(tempData),
      });
      console.log('Save profile response:', );

      const result = await response.json();
      if (result.status === "success") {
        setProfileData(tempData); // update main state
        setIsEditing(false);
        alert("svaed to db");
      } else {
        setError(result.message || "Failed to save profile");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving profile");
    } finally {
      setLoading(false);
    }
  };
   const stats = [
    { label: "Bookmarked", value: profileData.bookmarkedJobs?.length || 0, icon: <Bookmark className="w-5 h-5" />, color: "blue" },
    { label: "Interviews", value: "8", icon: <Calendar className="w-5 h-5" />, color: "pink" },
    { label: "Skills", value: profileData.skills?.length || 0, icon: <Award className="w-5 h-5" />, color: "green" }
  ];


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setTempData(profileData);
    setIsEditing(true);
  };

  const handleSave = async() => {
    await saveUserProfile(); 
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempData({ ...tempData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl border-2 border-purple-500/20 shadow-2xl overflow-hidden mb-8">
          {/* Cover Image with Upload */}
          <div className="relative h-48 group">
            {bannerImage ? (
              <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            )}
            
            {/* Banner Upload Button */}
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-4 right-4 px-4 py-2 bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center gap-2 shadow-lg hover:bg-gray-900 transition-all opacity-0 group-hover:opacity-100"
            >
              <Camera className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Change Banner</span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20">
              {/* Profile Image */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-gray-900 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Name and Title */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                  
                    <input
                      type="text"
                      value={tempData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="text-xl text-gray-300 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white mb-2">{profileData.name}</h1>
                    <p className="text-xl text-gray-300 mb-3">{profileData.name}</p>
                  </>
                )}
              </div>

              {/* Edit Button */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-gray-700 rounded-xl font-semibold hover:bg-gray-600 transition-all flex items-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border-2 border-${stat.color}-500/20 shadow-lg hover:shadow-${stat.color}-500/30 transition-all duration-300 hover:scale-105`}
            >
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-400 mb-3`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-500/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Book className="w-6 h-6 text-purple-400" />
                About
              </h2>
              {isEditing ? (
                <textarea
                  value={tempData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-purple-500 resize-none"
                />
              ) : (
                <p className="text-gray-300 leading-relaxed">{profileData.bio}</p>
              )}
            </div>

            {/* Skills Section */}
           <div className="flex flex-wrap gap-2">
  {profileData.skills && profileData.skills.length > 0 ? (
    profileData.skills.map((skill, index) => (
      <span
        key={index}
        className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl text-sm font-medium text-purple-300 hover:border-purple-500/50 transition-colors"
      >
        {skill}
      </span>
    ))
  ) : (
    <p className="text-gray-400">No skills added yet.</p>
  )}
</div>


           {/* Bookmarked Jobs */}
<div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-500/20 shadow-2xl">
  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
    <Bookmark className="w-6 h-6 text-purple-400" />
    Bookmarked Jobs
  </h2>

  <div className="space-y-4">
    {profileData.bookmarkedJobs && profileData.bookmarkedJobs.length > 0 ? (
      profileData.bookmarkedJobs.map((job, index) => (
        <div
          key={job.id || index} // fallback in case job.id is missing
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{job.title || "Untitled Job"}</h3>
              <p className="text-purple-400 font-medium">{job.company || "Unknown Company"}</p>
            </div>
            <button className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center hover:bg-purple-600/30 transition-colors">
              <Bookmark className="w-5 h-5 text-purple-400 fill-purple-400" />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location || "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {job.type || "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {job.salary || "N/A"}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Bookmarked {job.bookmarkedDate || "Unknown date"}
            </p>
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-400">You haven’t bookmarked any jobs yet.</p>
    )}
  </div>
</div>
</div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-500/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Contact Info</h2>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-purple-400" />
                        <input
                          type="email"
                          value={tempData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Phone</label>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-purple-400" />
                        <input
                          type="tel"
                          value={tempData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Location</label>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <input
                          type="text"
                          value={tempData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-white font-medium">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="text-white font-medium">{profileData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p className="text-white font-medium">{profileData.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Joined</p>
                        <p className="text-white font-medium">{profileData.joinDate}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border-2 border-purple-500/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Social Links</h2>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-blue-400" />
                      <input
                        type="text"
                        value={tempData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Github className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={tempData.github}
                        onChange={(e) => handleInputChange('github', e.target.value)}
                        className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-purple-400" />
                      <input
                        type="text"
                        value={tempData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="flex-1 bg-gray-800/50 border-2 border-purple-500/30 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <a
                      href={`https://${profileData.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all group"
                    >
                      <Linkedin className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">LinkedIn</span>
                    </a>
                    <a
                      href={`https://${profileData.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-500/10 border border-gray-500/30 hover:bg-gray-500/20 transition-all group"
                    >
                      <Github className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">GitHub</span>
                    </a>
                    <a
                      href={`https://${profileData.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-all group"
                    >
                      <Globe className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300 group-hover:text-white transition-colors">Website</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}