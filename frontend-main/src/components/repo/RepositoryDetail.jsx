import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import IssueTracker from "./IssueTracker";
import AICopilotPanel from "./AICopilotPanel";
import { useAuth } from "../../authContext";
import { 
  BookOpen, 
  Star, 
  GitFork, 
  Folder, 
  FileCode, 
  Globe, 
  Lock, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  GitCommit,
  Plus,
  Edit2,
  Save,
  X,
  FileText,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

// Helper to resolve the virtual file system from repository content array
export function getLatestFiles(contentArray) {
  const files = {};
  const history = [];

  for (const item of contentArray || []) {
    try {
      const parsed = JSON.parse(item);
      if (parsed && parsed.name) {
        files[parsed.name] = parsed.content;
        history.push({
          file: parsed.name,
          commitMessage: parsed.commitMessage || "Update file",
          date: parsed.date || new Date().toISOString(),
          author: parsed.author || "Developer"
        });
      }
    } catch (e) {
      // Fallback for legacy plain strings
      files["main.js"] = item;
      history.push({
        file: "main.js",
        commitMessage: "Legacy code update",
        date: new Date().toISOString(),
        author: "Developer"
      });
    }
  }

  return { files, history };
}

const RepositoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("code"); // "code", "issues", "ai"
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);

  // File explorer states
  const [files, setFiles] = useState({});
  const [commitHistory, setCommitHistory] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [viewingFileContent, setViewingFileContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  
  // Create file states
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");

  // Commit changes states
  const [commitMessage, setCommitMessage] = useState("");
  const [generatingCommit, setGeneratingCommit] = useState(false);
  const [committing, setCommitting] = useState(false);

  const { currentUser } = useAuth();
  const userId = currentUser?._id;

  const fetchRepository = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/repo/${id}`);
      
      if (res.data && res.data.length > 0) {
        const repository = res.data[0];
        setRepo(repository);
        setStarCount(repository.starCount || 0);

        // Resolve virtual files
        const { files: resolvedFiles, history } = getLatestFiles(repository.content);
        setFiles(resolvedFiles);
        setCommitHistory(history);

        // If a file was selected, update its content, otherwise default to README.md
        if (selectedFileName && resolvedFiles[selectedFileName] !== undefined) {
          setViewingFileContent(resolvedFiles[selectedFileName]);
        } else if (resolvedFiles["README.md"] !== undefined) {
          setSelectedFileName("README.md");
          setViewingFileContent(resolvedFiles["README.md"]);
        } else {
          // select first available file
          const keys = Object.keys(resolvedFiles);
          if (keys.length > 0) {
            setSelectedFileName(keys[0]);
            setViewingFileContent(resolvedFiles[keys[0]]);
          }
        }

        // Check if starred by user
        if (userId) {
          const profileRes = await axios.get(`/userProfile/${userId}`);
          const isStarredRepo = (profileRes.data.starRepos || []).includes(id);
          setIsStarred(isStarredRepo);
        }
      } else {
        toast.error("Repository not found.");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load repository detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRepository();
    }
  }, [id]);

  const handleStarRepository = async () => {
    if (!userId) {
      toast.error("Please login to star repositories.");
      return;
    }

    try {
      const res = await axios.patch(`/repo/star/${id}`, { userId });
      setIsStarred(res.data.starred);
      setStarCount(prev => res.data.starred ? prev + 1 : prev - 1);
      toast.success(res.data.message);
    } catch (err) {
      console.error(err);
      toast.error("Star request failed.");
    }
  };

  const handleForkRepository = async () => {
    if (!userId) {
      toast.error("Please login to fork repositories.");
      return;
    }

    try {
      const res = await axios.post(`/repo/fork/${id}`, { userId });
      toast.success("Repository forked successfully!");
      // Navigate to the newly created repository page
      navigate(`/repo/${res.data.repositoryID}`);
    } catch (err) {
      console.error(err);
      toast.error("Fork request failed.");
    }
  };

  const handleSelectFile = (name) => {
    setSelectedFileName(name);
    setViewingFileContent(files[name]);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditedContent(viewingFileContent);
    setIsEditing(true);
  };

  const handleGenerateCommitMessage = async () => {
    const contentToUse = isEditing ? editedContent : newFileContent;
    const filenameToUse = isEditing ? selectedFileName : newFileName;

    if (!contentToUse) {
      toast.error("File is empty. Add some changes first.");
      return;
    }

    try {
      setGeneratingCommit(true);
      const res = await axios.post("/ai/commit-message", {
        codeChanges: contentToUse.slice(0, 1000), // diff preview limit
        filename: filenameToUse
      });
      setCommitMessage(res.data.commitMessage);
      toast.success("AI suggested commit message!");
    } catch (err) {
      console.error(err);
      toast.error("AI service error. Unable to suggest commit message.");
    } finally {
      setGeneratingCommit(false);
    }
  };

  const handleCommitFileChange = async (e) => {
    e.preventDefault();
    if (!commitMessage) {
      toast.error("A commit message is required.");
      return;
    }

    try {
      setCommitting(true);
      const userProfileRes = await axios.get(`/userProfile/${userId}`);
      const author = userProfileRes.data.username || "Developer";

      const updatedFileObj = {
        name: selectedFileName,
        content: editedContent,
        commitMessage,
        date: new Date().toISOString(),
        author
      };

      // Call put API to append file to content
      await axios.put(`/repo/update/${id}`, {
        content: JSON.stringify(updatedFileObj),
        description: repo.description
      });

      toast.success("Changes committed successfully!");
      setCommitMessage("");
      setIsEditing(false);
      fetchRepository();
    } catch (err) {
      console.error(err);
      toast.error("Commit failed.");
    } finally {
      setCommitting(false);
    }
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName) {
      toast.error("Please specify a filename.");
      return;
    }

    if (!commitMessage) {
      toast.error("A commit message is required to add files.");
      return;
    }

    try {
      setCommitting(true);
      const userProfileRes = await axios.get(`/userProfile/${userId}`);
      const author = userProfileRes.data.username || "Developer";

      const newFileObj = {
        name: newFileName,
        content: newFileContent,
        commitMessage,
        date: new Date().toISOString(),
        author
      };

      await axios.put(`/repo/update/${id}`, {
        content: JSON.stringify(newFileObj),
        description: repo.description
      });

      toast.success("File added successfully!");
      setNewFileName("");
      setNewFileContent("");
      setCommitMessage("");
      setShowCreateFileModal(false);
      fetchRepository();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add file.");
    } finally {
      setCommitting(false);
    }
  };

  // Called when AI README is generated and applied
  const handleSaveReadmeFromAI = (markdownContent) => {
    setSelectedFileName("README.md");
    setViewingFileContent(markdownContent);
    setEditedContent(markdownContent);
    setIsEditing(true);
  };

  if (loading && !repo) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-semibold animate-pulse">Initializing Copilot Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col">
      <Navbar />

      {/* Repository Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] py-6 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Repo Name & Visibility Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-6 h-6 text-slate-400 shrink-0" />
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-semibold text-lg text-blue-400 hover:underline">
                {repo.owner?.username || "developer"}
              </span>
              <span className="text-slate-500 text-lg">/</span>
              <h1 className="font-extrabold text-xl text-white truncate">
                {repo.name}
              </h1>
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
          </div>

          {/* Star & Fork buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStarRepository}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isStarred 
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" 
                  : "bg-[#21262d] border-[#30363d] text-slate-300 hover:bg-[#30363d] hover:text-white"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-yellow-500" : ""}`} />
              <span>{isStarred ? "Starred" : "Star"}</span>
              <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-[10px] text-slate-400 ml-0.5 font-bold">
                {starCount}
              </span>
            </button>

            <button
              onClick={handleForkRepository}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#21262d] border border-[#30363d] text-slate-300 hover:bg-[#30363d] hover:text-white transition-all"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork</span>
              <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-[10px] text-slate-400 ml-0.5 font-bold">
                {repo.forkCount || 0}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace split */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Workspace columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab selectors */}
          <div className="border-b border-[#30363d] flex gap-2">
            <button
              onClick={() => setActiveTab("code")}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "code" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Code Explorer
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "issues" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Issues
              <span className="bg-[#21262d] border border-[#30363d] px-1.5 py-0.5 text-[10px] rounded-full">
                {repo.issues?.length || 0}
              </span>
            </button>
          </div>

          {/* CODE TAB */}
          {activeTab === "code" && (
            <div className="space-y-6">
              
              {/* Repo description */}
              {repo.description && (
                <p className="text-slate-400 text-sm italic leading-relaxed border-l-2 border-blue-500/30 pl-3">
                  {repo.description}
                </p>
              )}

              {/* VIRTUAL DIRECTORY EXPLORER & VIEWER PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-[#30363d] rounded-xl overflow-hidden bg-[#161b22]">
                
                {/* Left panel: File explorer list (4 cols) */}
                <div className="md:col-span-4 border-r border-[#30363d] bg-[#0d1117]/30 flex flex-col min-h-[350px]">
                  <div className="p-3 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]/40 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Files Explorer</span>
                    
                    <button
                      onClick={() => setShowCreateFileModal(true)}
                      className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-blue-400 border border-[#30363d] transition-colors"
                      title="Add new file"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 overflow-y-auto flex-1 space-y-1">
                    {Object.keys(files).length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 italic">No files. Create one!</div>
                    ) : (
                      Object.keys(files).map((name) => (
                        <button
                          key={name}
                          onClick={() => handleSelectFile(name)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all truncate border ${
                            selectedFileName === name
                              ? "bg-blue-600/10 border-blue-500/20 text-blue-400"
                              : "border-transparent text-slate-300 hover:bg-[#21262d] hover:text-white"
                          }`}
                        >
                          {name.endsWith(".md") ? (
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right panel: Active Code Viewer/Editor (8 cols) */}
                <div className="md:col-span-8 flex flex-col bg-[#161b22]">
                  {selectedFileName ? (
                    <div className="flex-1 flex flex-col">
                      
                      {/* Code Viewer Header */}
                      <div className="p-3 border-b border-[#30363d] flex justify-between items-center bg-[#0d1117]/40 shrink-0">
                        <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                          <FileCode className="w-4 h-4 text-indigo-400" />
                          {selectedFileName}
                        </span>

                        {!isEditing && (
                          <button
                            onClick={handleStartEdit}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-white text-[10px] font-bold transition-all"
                          >
                            <Edit2 className="w-3 h-3 text-blue-400" />
                            Edit File
                          </button>
                        )}
                      </div>

                      {/* Code Body Viewer or Editor */}
                      <div className="flex-1 min-h-[300px] flex flex-col relative font-mono text-xs">
                        {isEditing ? (
                          <form onSubmit={handleCommitFileChange} className="flex-1 flex flex-col h-full space-y-4 p-4">
                            <textarea
                              rows="12"
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full flex-1 p-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono resize-none"
                            />

                            {/* Git commit input fields */}
                            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-3 shrink-0">
                              <h4 className="font-bold text-xs text-white flex items-center gap-1.5 border-b border-[#30363d]/50 pb-2">
                                <GitCommit className="w-4 h-4 text-blue-400" />
                                Commit Changes
                              </h4>

                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Commit Message
                                  </label>
                                  <button
                                    type="button"
                                    onClick={handleGenerateCommitMessage}
                                    disabled={generatingCommit}
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold disabled:opacity-50"
                                  >
                                    <Sparkles className="w-3 h-3 text-yellow-400" />
                                    AI Suggest Message
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. fix: patch auth memory leak"
                                  value={commitMessage}
                                  onChange={(e) => setCommitMessage(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:border-slate-500"
                                />
                              </div>

                              <div className="flex gap-2 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setIsEditing(false)}
                                  className="py-1 px-3 rounded bg-[#21262d] border border-[#30363d] text-slate-300 hover:text-white text-[10px] font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={committing || !commitMessage}
                                  className="py-1 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-md transition-opacity"
                                >
                                  {committing ? "Committing..." : "Commit changes"}
                                </button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          /* Read-only Code viewer with line numbers */
                          <div className="flex-1 bg-[#0d1117] p-4 flex gap-4 overflow-auto max-h-[450px]">
                            {/* Line numbers */}
                            <div className="select-none text-slate-600 text-right pr-2 border-r border-[#30363d]/50 font-mono text-[11px] leading-relaxed shrink-0">
                              {(viewingFileContent || "").split("\n").map((_, i) => (
                                <div key={i}>{i + 1}</div>
                              ))}
                            </div>

                            {/* Code lines */}
                            <pre className="text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
                              <code>{viewingFileContent || "// File is empty."}</code>
                            </pre>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="flex-1 p-8 text-center text-slate-500 flex items-center justify-center h-full min-h-[300px]">
                      Select a file from the explorer list to view code.
                    </div>
                  )}
                </div>

              </div>

              {/* RENDER README FILE IN THE PAGE BODY */}
              {files["README.md"] && (
                <div className="border border-[#30363d] rounded-xl p-6 bg-[#161b22] space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#30363d]/50 pb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    README.md
                  </h3>
                  
                  {/* Clean text parser rendering */}
                  <div className="text-slate-300 text-sm leading-relaxed prose prose-invert font-sans max-w-none whitespace-pre-wrap">
                    {files["README.md"]}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ISSUES TAB */}
          {activeTab === "issues" && (
            <IssueTracker repoId={id} />
          )}
        </div>

        {/* RIGHT COLUMN: AI Copilot Assistant integration (4 cols) */}
        <aside className="lg:col-span-4">
          <AICopilotPanel 
            repoName={repo.name} 
            description={repo.description} 
            filesList={Object.keys(files)} 
            activeFile={selectedFileName ? { name: selectedFileName, content: viewingFileContent } : null}
            onSaveReadme={handleSaveReadmeFromAI}
          />
        </aside>

      </div>

      {/* Create File Modal overlay */}
      {showCreateFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117]/80 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCreateFileModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2 border-b border-[#30363d] pb-3">
              <Plus className="w-5 h-5 text-blue-400" />
              Add new file
            </h3>

            <form onSubmit={handleCreateFile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Filename <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. index.js, utils/helpers.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  File Contents
                </label>
                <textarea
                  rows="6"
                  placeholder="// write code here..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono resize-none"
                />
              </div>

              {/* Commit info for new file */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-3 shrink-0">
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5 border-b border-[#30363d]/50 pb-2">
                  <GitCommit className="w-4 h-4 text-blue-400" />
                  Commit Message
                </h4>
                
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Commit message description <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateCommitMessage}
                      disabled={generatingCommit}
                      className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      AI Suggest Message
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. feat: add entry script"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFileModal(false)}
                  className="py-1.5 px-3.5 rounded-lg bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={committing || !commitMessage}
                  className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {committing ? "Adding..." : "Commit new file"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default RepositoryDetail;
