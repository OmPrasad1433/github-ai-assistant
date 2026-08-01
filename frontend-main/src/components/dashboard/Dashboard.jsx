import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import { useAuth } from "../../authContext";
import { 
  Search, 
  GitFork, 
  Star, 
  BookOpen, 
  Globe, 
  Lock, 
  Activity, 
  Sparkles, 
  ArrowUpDown, 
  Filter, 
  Plus, 
  GitCommit,
  AlertCircle
} from "lucide-react";
import HeatMapProfile from "../user/HeatMap";
import { RepoCardSkeleton, SidebarSkeleton } from "../common/Skeleton";
import axios from "axios";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [repositories, setRepositories] = useState([]);
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState("recent"); // "recent", "name", "stars"
  const [filterType, setFilterType] = useState("all"); // "all", "public", "private"
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityTimeline, setActivityTimeline] = useState([]);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = currentUser?._id;
    if (!userId) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch current user repositories
        const reposRes = await axios.get(`/repo/user/${userId}`);
        const userRepos = reposRes.data.repositories || [];
        setRepositories(userRepos);
        setSearchResults(userRepos);

        // 2. Fetch suggested repositories (all public repositories from other users)
        const suggestedRes = await axios.get("/repo/all");
        const allRepos = suggestedRes.data || [];
        // Filter out user's own repositories for suggestion
        const filteredSuggested = allRepos.filter(r => r.owner?._id !== userId);
        setSuggestedRepositories(filteredSuggested);

        // 3. Fetch user profile for stats
        const profileRes = await axios.get(`/userProfile/${userId}`);
        setUserDetails(profileRes.data);

        // 4. Generate mock activity feed based on user repositories
        generateActivityTimeline(userRepos, profileRes.data.username);

      } catch (err) {
        console.error("Error while fetching dashboard data: ", err);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const generateActivityTimeline = (repos, username) => {
    const timeline = [];
    
    // Add some realistic updates
    if (repos.length > 0) {
      repos.slice(0, 3).forEach((repo, idx) => {
        const dates = [
          "2 hours ago",
          "Yesterday",
          "3 days ago"
        ];
        timeline.push({
          id: `push-${idx}`,
          type: "push",
          repoName: repo.name,
          repoId: repo._id,
          message: `pushed 1 commit to main`,
          time: dates[idx] || "Recently",
          icon: GitCommit,
          color: "text-blue-400"
        });
      });
    }

    // Add star / fork timeline items
    timeline.push({
      id: "joined",
      type: "join",
      repoName: "",
      message: `created account as @${username}`,
      time: "A week ago",
      icon: Activity,
      color: "text-emerald-400"
    });

    setActivityTimeline(timeline);
  };

  // Handle Search, Filter, Sort
  useEffect(() => {
    let results = [...repositories];

    // Search query
    if (searchQuery.trim() !== "") {
      results = results.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Visibility filter
    if (filterType === "public") {
      results = results.filter((repo) => repo.visibility === true);
    } else if (filterType === "private") {
      results = results.filter((repo) => repo.visibility === false);
    }

    // Language filter
    if (filterLanguage !== "all") {
      results = results.filter((repo) => {
        // Fallback checks or mock lang badges
        const lang = getLanguageForRepo(repo).toLowerCase();
        return lang === filterLanguage.toLowerCase();
      });
    }

    // Sorting
    if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stars") {
      results.sort((a, b) => (b.starCount || 0) - (a.starCount || 0));
    } else if (sortBy === "recent") {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setSearchResults(results);
  }, [searchQuery, repositories, sortBy, filterType, filterLanguage]);

  // Extract unique languages
  const getUniqueLanguages = () => {
    const langs = new Set();
    repositories.forEach(repo => {
      langs.add(getLanguageForRepo(repo));
    });
    return Array.from(langs);
  };

  // Helper to extract language (or display a default mock language)
  const getLanguageForRepo = (repo) => {
    // If files exists and contains package.json / JS files
    const content = repo.content || [];
    let lang = "JavaScript";
    const contentStr = content.join(" ").toLowerCase();
    
    if (contentStr.includes(".py") || contentStr.includes("python")) lang = "Python";
    else if (contentStr.includes(".html")) lang = "HTML";
    else if (contentStr.includes(".css")) lang = "CSS";
    else if (contentStr.includes(".go")) lang = "Go";
    else if (contentStr.includes(".ts") || contentStr.includes("typescript")) lang = "TypeScript";

    return lang;
  };

  const getLanguageColor = (lang) => {
    const colors = {
      JavaScript: "bg-yellow-500",
      TypeScript: "bg-blue-500",
      Python: "bg-emerald-500",
      HTML: "bg-orange-500",
      CSS: "bg-indigo-500",
      Go: "bg-cyan-500"
    };
    return colors[lang] || "bg-slate-500";
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: User Profile & Quick Links (3 cols) */}
        <aside className="lg:col-span-3 space-y-6">
          {loading ? (
            <SidebarSkeleton />
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-6 sticky top-20 shadow-sm">
              {/* Profile Card */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-inner">
                  {userDetails?.username?.slice(0, 2).toUpperCase() || "AI"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate hover:text-blue-400 transition-colors">
                    {userDetails?.username || "Developer"}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {userDetails?.email || "dev@github-ai.com"}
                  </p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-2 py-3.5 border-y border-[#30363d] text-center">
                <div>
                  <span className="block text-base font-bold text-white">
                    {repositories.length}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Repos
                  </span>
                </div>
                <div>
                  <span className="block text-base font-bold text-white">
                    {userDetails?.starRepos?.length || 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Starred
                  </span>
                </div>
                <div>
                  <span className="block text-base font-bold text-white">
                    {userDetails?.followedUsers?.length || 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Following
                  </span>
                </div>
              </div>

              {/* Quick Navigation / Actions */}
              <div className="space-y-2">
                <Link
                  to="/create"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Create New Repo
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-slate-200 hover:text-white font-semibold text-xs transition-all"
                >
                  Edit Profile Settings
                </Link>
              </div>

              {/* Language filtering panel */}
              {repositories.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Filter by Language
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => setFilterLanguage("all")}
                      className={`text-xs px-2.5 py-1 rounded-full transition-all border ${
                        filterLanguage === "all"
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                          : "bg-transparent border-[#30363d] text-slate-400 hover:border-slate-400"
                      }`}
                    >
                      All
                    </button>
                    {getUniqueLanguages().map(lang => (
                      <button
                        key={lang}
                        onClick={() => setFilterLanguage(lang)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-all border flex items-center gap-1.5 ${
                          filterLanguage === lang
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                            : "bg-transparent border-[#30363d] text-slate-400 hover:border-slate-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(lang)}`}></span>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* CENTER COLUMN: Repositories List & Search (6 cols) */}
        <main className="lg:col-span-6 space-y-6">
          
          {/* Header search controls */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Your Repositories
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Find a repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                {/* Sort selector */}
                <div className="relative flex items-center bg-[#21262d] border border-[#30363d] rounded-lg px-2 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-300 font-medium py-2 pr-4 focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Recent</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="stars">Stars</option>
                  </select>
                </div>

                {/* Filter visibility */}
                <div className="relative flex items-center bg-[#21262d] border border-[#30363d] rounded-lg px-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent text-slate-300 font-medium py-2 pr-4 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Repository Cards Grid */}
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => <RepoCardSkeleton key={i} />)
            ) : searchResults.length === 0 ? (
              <div className="bg-[#161b22] border border-dashed border-[#30363d] rounded-xl p-8 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No repositories found</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  {searchQuery ? "No repositories match your active search and filter criteria." : "Create your first repository to unlock AI Code Explainer and Copilot assistant features."}
                </p>
                {!searchQuery && (
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Repository
                  </Link>
                )}
              </div>
            ) : (
              searchResults.map((repo) => {
                const lang = getLanguageForRepo(repo);
                return (
                  <div 
                    key={repo._id} 
                    className="bg-[#161b22] border border-[#30363d] hover:border-blue-500/40 rounded-xl p-5 hover:bg-[#1a202c]/50 transition-all flex flex-col justify-between group relative shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <Link 
                          to={`/repo/${repo._id}`} 
                          className="font-bold text-white text-base hover:text-blue-400 hover:underline transition-all truncate flex items-center gap-1.5"
                        >
                          <BookOpen className="w-4.5 h-4.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                          {repo.name}
                        </Link>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#21262d] border border-[#30363d] text-slate-300">
                          {repo.visibility ? (
                            <>
                              <Globe className="w-3 h-3 text-blue-400" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-amber-400" />
                              Private
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                        {repo.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-5 border-t border-[#30363d]/50 mt-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(lang)}`}></span>
                          {lang}
                        </span>
                        
                        <span className="flex items-center gap-1 hover:text-yellow-400 cursor-pointer">
                          <Star className="w-3.5 h-3.5 fill-yellow-400/0 hover:fill-yellow-400 transition-all" />
                          {repo.starCount || 0}
                        </span>

                        <span className="flex items-center gap-1">
                          <GitFork className="w-3.5 h-3.5" />
                          {repo.forkCount || 0}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 font-medium">
                        Updated {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SUGGESTED / TRENDING REPOSITORIES SECTION */}
          {suggestedRepositories.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Trending Public Repositories
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedRepositories.slice(0, 4).map((repo) => (
                  <div 
                    key={repo._id} 
                    className="border border-[#30363d] rounded-lg p-3.5 bg-[#0d1117] hover:border-slate-500 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <Link 
                        to={`/repo/${repo._id}`} 
                        className="font-semibold text-white hover:text-blue-400 hover:underline block text-sm truncate"
                      >
                        {repo.owner?.username ? `${repo.owner.username}/${repo.name}` : repo.name}
                      </Link>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">
                        {repo.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#30363d]/50 text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {repo.starCount || 0}
                      </span>
                      <span>By @{repo.owner?.username || "user"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Activity Timeline & Heatmap (3 cols) */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* Contribution Heatmap Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-400" />
              Contributions
            </h3>
            
            {/* Embed contribution heatmap profile graph */}
            <div className="overflow-x-auto select-none pt-1">
              <HeatMapProfile />
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-400" />
              Recent Activity
            </h3>

            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse"></div>
              </div>
            ) : activityTimeline.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No recent activity found.</p>
            ) : (
              <div className="relative border-l border-[#30363d] ml-3.5 pl-5 space-y-6">
                {activityTimeline.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[27px] top-0 bg-[#0d1117] border border-[#30363d] rounded-full p-1 group-hover:border-blue-500 transition-colors">
                        <IconComp className={`w-3 h-3 ${item.color}`} />
                      </span>

                      <div className="text-xs space-y-1">
                        <p className="text-slate-300 font-semibold leading-relaxed">
                          {item.repoId ? (
                            <Link to={`/repo/${item.repoId}`} className="text-blue-400 hover:underline">
                              {item.repoName}
                            </Link>
                          ) : ""}
                          {item.repoName ? " " : ""}{item.message}
                        </p>
                        <span className="block text-[10px] text-slate-500 font-medium">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Dashboard;
