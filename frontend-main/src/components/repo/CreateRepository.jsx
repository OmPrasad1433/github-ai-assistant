import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import { 
  BookOpen, 
  Globe, 
  Lock, 
  Sparkles, 
  Info,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../authContext";

const CreateRepository = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true); // true = Public, false = Private
  const [initReadme, setInitReadme] = useState(true); // Pre-initialize with README.md
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const userId = currentUser?._id;
    if (!userId) {
      navigate("/auth");
      return;
    }

    // Get user details
    axios.get(`/userProfile/${userId}`)
      .then(res => setUserProfile(res.data))
      .catch(err => console.error(err));
  }, [navigate, currentUser]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error("Repository name is required.");
      return;
    }

    // Standard URL-friendly repository name validation
    const repoNameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!repoNameRegex.test(name)) {
      toast.error("Repository name can only contain letters, numbers, periods, hyphens, and underscores.");
      return;
    }

    setLoading(true);

    try {
      const owner = currentUser?._id;
      
      // Construct files payload. If they check "Initialize with README"
      const contentList = [];
      if (initReadme) {
        contentList.push(
          JSON.stringify({
            name: "README.md",
            content: `# ${name}\n\n${description || "This is a new repository created with GitHub AI."}\n\n## Get Started\nRun these commands to clone this project:\n\`\`\`bash\ngit clone ${axios.defaults.baseURL}/repo/name/${name}\n\`\`\``,
            commitMessage: "Initial commit (Initialize with README)",
            date: new Date().toISOString(),
            author: userProfile?.username || "Developer"
          })
        );
      }

      await axios.post("/repo/create", {
        owner,
        name,
        description,
        visibility,
        content: contentList,
        issues: [],
      });

      toast.success("Repository created successfully!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create repository.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!name) {
      toast.error("Please enter a repository name first to help guide the AI.");
      return;
    }

    try {
      setGeneratingDesc(true);
      const res = await axios.post("/ai/generate-description", {
        repoName: name,
        languages: ["web app"],
        tags: ["modern", "startup"]
      });

      // Parse the bullet points from AI response
      const bulletPoints = res.data.descriptions || "";
      const matches = bulletPoints.match(/-\s*(.*)/g);
      let suggestedText = "";
      
      if (matches && matches.length > 0) {
        // Take the first option and clean up
        suggestedText = matches[0].replace(/^-\s*/, "").trim();
      } else {
        // Fallback
        suggestedText = bulletPoints.split("\n")[0].trim();
      }

      if (suggestedText) {
        setDescription(suggestedText);
        toast.success("AI description generated!");
      } else {
        toast.error("No descriptions generated. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI service error. Ensure your API Key is configured.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col">
      <Navbar />

      <div className="max-w-3xl w-full mx-auto px-4 md:px-8 py-10 flex-1">
        <div className="border-b border-[#30363d] pb-5 mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            Create a new repository
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            A repository contains all project files, including revision history, and is integrated with Copilot tools.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Owner & Repo Name */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Owner
              </label>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-slate-300 font-medium">
                {userProfile?.username || "octocat"}
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <label htmlFor="repo-name" className="block text-sm font-semibold text-slate-300 mb-2">
                Repository name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="repo-name"
                required
                value={name}
                placeholder="my-awesome-project"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Great repository names are short and memorable. Example: <span className="text-blue-400 font-mono">underground-explorer</span>
              </span>
            </div>
          </div>

          {/* Description & AI Generator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="repo-desc" className="block text-sm font-semibold text-slate-300">
                Description <span className="text-xs text-slate-500 font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateAIDescription}
                disabled={generatingDesc || !name}
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {generatingDesc ? (
                  <div className="w-3.5 h-3.5 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI Generate Description
              </button>
            </div>
            <textarea
              id="repo-desc"
              rows="3"
              value={description}
              placeholder="Brief summary of your repository features..."
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <hr className="border-[#30363d]" />

          {/* Visibility Options */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Visibility
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Public Select Card */}
              <div 
                onClick={() => setVisibility(true)}
                className={`border rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${
                  visibility === true 
                    ? "bg-[#1f2937]/20 border-blue-500/70 shadow-md shadow-blue-500/5" 
                    : "bg-[#161b22] border-[#30363d] hover:border-slate-500"
                }`}
              >
                <div className="pt-0.5">
                  <Globe className={`w-5 h-5 ${visibility === true ? "text-blue-400" : "text-slate-400"}`} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Public</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Anyone on the internet can see this repository. You choose who can commit.
                  </p>
                </div>
              </div>

              {/* Private Select Card */}
              <div 
                onClick={() => setVisibility(false)}
                className={`border rounded-xl p-4 cursor-pointer flex gap-3 transition-all ${
                  visibility === false 
                    ? "bg-[#1f2937]/20 border-blue-500/70 shadow-md shadow-blue-500/5" 
                    : "bg-[#161b22] border-[#30363d] hover:border-slate-500"
                }`}
              >
                <div className="pt-0.5">
                  <Lock className={`w-5 h-5 ${visibility === false ? "text-amber-400" : "text-slate-400"}`} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Private</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    You choose who can see and commit to this repository.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[#30363d]" />

          {/* Initialization checkboxes */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300">
              Initialize this repository with:
            </h4>
            
            <label className="flex items-start gap-3 bg-[#161b22] border border-[#30363d] rounded-xl p-4 cursor-pointer hover:bg-[#1a202c]/20 transition-all select-none">
              <input
                type="checkbox"
                checked={initReadme}
                onChange={(e) => setInitReadme(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
              />
              <div className="-mt-0.5">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Add a README file
                </span>
                <span className="block text-xs text-slate-400 mt-1 leading-relaxed">
                  This lets you immediately clone the repository to your computer and configure it with AI Markdown templates.
                </span>
              </div>
            </label>
          </div>

          <hr className="border-[#30363d]" />

          {/* Form Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="py-2 px-4 rounded-lg bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 py-2 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepository;
