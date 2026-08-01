import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";
import { 
  BookOpen, 
  Star, 
  Settings, 
  Mail, 
  Lock, 
  ShieldAlert, 
  Trash2, 
  Calendar,
  Grid,
  Users
} from "lucide-react";
import toast from "react-hot-toast";

const Profile = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({ username: "", email: "", starRepos: [] });
  const [starredRepos, setStarredRepos] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "starred", "settings"
  const { currentUser, setCurrentUser } = useAuth();

  // Settings form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchUserDetailsAndRepos = async () => {
      const userId = currentUser?._id;
      if (!userId) {
        navigate("/auth");
        return;
      }

      try {
        const response = await axios.get(`/userProfile/${userId}`);
        const userData = response.data;
        setUserDetails(userData);
        setEmail(userData.email);

        // Fetch all repositories to find which ones are starred
        const repoResponse = await axios.get("/repo/all");
        const allRepos = repoResponse.data || [];

        const starred = allRepos.filter((repo) =>
          (userData.starRepos || []).includes(repo._id)
        );
        setStarredRepos(starred);
      } catch (err) {
        console.error("Cannot fetch profile or repositories: ", err);
        toast.error("Failed to load profile details.");
      }
    };
    fetchUserDetailsAndRepos();
  }, [navigate, currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const userId = currentUser?._id;

    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setUpdating(true);
      const res = await axios.put(`/updateProfile/${userId}`, {
        email,
        password: password || undefined,
      });

      toast.success("Profile updated successfully!");
      setUserDetails(prev => ({ ...prev, email: res.data.email }));
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmDelete = window.confirm(
      "WARNING: This action is permanent! Are you sure you want to delete your profile and all data?"
    );
    if (!confirmDelete) return;

    const userId = currentUser?._id;
    try {
      setDeleting(true);
      await axios.delete(`/deleteProfile/${userId}`);
      toast.success("Profile deleted successfully.");
      
      setCurrentUser(null);
      navigate("/auth");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete profile.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col">
      <Navbar />

      {/* Decorative Banner */}
      <div className="h-40 w-full bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-b border-[#30363d] relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>

      <div className="max-w-6xl w-full mx-auto px-4 md:px-8 -mt-16 pb-12 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Side: Avatar, details */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-4 border-[#161b22] flex items-center justify-center font-extrabold text-white text-4xl shadow-xl -mt-20">
              {userDetails.username?.slice(0, 2).toUpperCase() || "AI"}
            </div>

            <h2 className="font-extrabold text-xl text-white mt-4">
              {userDetails.username || "octocat"}
            </h2>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5 justify-center">
              <Mail className="w-4 h-4 text-slate-500" />
              {userDetails.email || "octocat@github-ai.com"}
            </p>

            {/* Follow stats */}
            <div className="flex gap-6 items-center justify-center mt-6 text-sm">
              <div className="flex gap-1.5 items-center">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-white font-semibold">
                  {userDetails.followedUsers?.length || 0}
                </span>
                <span className="text-slate-400">followers</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#30363d]"></div>
              <div className="flex gap-1">
                <span className="text-white font-semibold">
                  {userDetails.starRepos?.length || 0}
                </span>
                <span className="text-slate-400">stars</span>
              </div>
            </div>

            <div className="w-full border-t border-[#30363d] pt-5 mt-5">
              <p className="text-xs text-slate-500 flex items-center gap-1.5 justify-center">
                <Calendar className="w-3.5 h-3.5" />
                Member since {new Date(userDetails.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Tab panel and settings */}
        <div className="md:col-span-8 space-y-6">
          {/* Underline Tabs */}
          <div className="border-b border-[#30363d] flex gap-2 overflow-x-auto pb-[1px]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("starred")}
              className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "starred"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Star className="w-4 h-4" />
              Starred Repositories
              <span className="bg-[#21262d] border border-[#30363d] text-xs text-slate-300 font-semibold px-2 py-0.5 rounded-full ml-1">
                {starredRepos.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "settings"
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </button>
          </div>

          {/* TAB CONTENT: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm">
                <HeatMapProfile />
              </div>
            </div>
          )}

          {/* TAB CONTENT: Starred Repos */}
          {activeTab === "starred" && (
            <div className="space-y-4">
              {starredRepos.length === 0 ? (
                <div className="bg-[#161b22] border border-dashed border-[#30363d] rounded-xl p-8 text-center space-y-3">
                  <Star className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-white font-bold">No starred repositories</h4>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    Explore repositories from the dashboard to star projects you follow.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {starredRepos.map((repo) => (
                    <div 
                      key={repo._id} 
                      className="bg-[#161b22] border border-[#30363d] hover:border-slate-500 rounded-xl p-5 hover:bg-[#1a202c]/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <h3 
                            onClick={() => navigate(`/repo/${repo._id}`)} 
                            className="font-bold text-white text-base hover:text-blue-400 hover:underline cursor-pointer truncate"
                          >
                            {repo.name}
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#21262d] border border-[#30363d] rounded-full text-slate-300">
                            {repo.visibility ? "Public" : "Private"}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                          {repo.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#30363d]/50 mt-4 text-xs text-slate-400 font-semibold">
                        <span>@{repo.owner?.username || "user"}</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          Starred
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Account Settings (Forms Update and Delete CRUD) */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Profile Details Edit Form */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white">Update Profile</h3>
                  <p className="text-xs text-slate-400 mt-1">Change your profile email address or credentials.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {updating ? "Saving Changes..." : "Save Profile Details"}
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="p-1 bg-red-500/10 rounded-lg text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-red-400">Danger Zone</h3>
                    <p className="text-xs text-red-300 mt-1">
                      Permanently delete your profile workspace, repositories, and all history.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleDeleteProfile}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? "Deleting account..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Profile;
