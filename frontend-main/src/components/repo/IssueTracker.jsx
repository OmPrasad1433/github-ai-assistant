import { useState, useEffect } from "react";
import axios from "axios";
import { 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Clock, 
  MessageSquare,
  X
} from "lucide-react";
import toast from "react-hot-toast";

const IssueTracker = ({ repoId }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all"); // "all", "open", "closed"

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/issue/all/${repoId}`);
      setIssues(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repoId) {
      fetchIssues();
    }
  }, [repoId]);

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Please provide both a title and description.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`/issue/create/${repoId}`, {
        title,
        description,
      });
      toast.success("Issue created successfully!");
      setTitle("");
      setDescription("");
      setShowCreateModal(false);
      fetchIssues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create issue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (issue) => {
    const newStatus = issue.status === "open" ? "closed" : "open";
    try {
      await axios.put(`/issue/update/${issue._id}`, {
        title: issue.title,
        description: issue.description,
        status: newStatus,
      });
      toast.success(`Issue ${newStatus === "open" ? "reopened" : "closed"} successfully!`);
      fetchIssues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update issue status.");
    }
  };

  const handleDeleteIssue = async (issueId) => {
    const confirm = window.confirm("Are you sure you want to delete this issue?");
    if (!confirm) return;

    try {
      await axios.delete(`/issue/delete/${issueId}`);
      toast.success("Issue deleted successfully!");
      fetchIssues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete issue.");
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (filter === "open") return issue.status === "open";
    if (filter === "closed") return issue.status === "closed";
    return true;
  });

  const openCount = issues.filter(i => i.status === "open").length;
  const closedCount = issues.filter(i => i.status === "closed").length;

  return (
    <div className="space-y-4">
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        
        {/* Toggle Filters */}
        <div className="flex gap-4 text-xs font-semibold text-slate-400">
          <button 
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 py-1 ${filter === "all" ? "text-white" : "hover:text-slate-200"}`}
          >
            All ({issues.length})
          </button>
          <button 
            onClick={() => setFilter("open")}
            className={`flex items-center gap-1.5 py-1 ${filter === "open" ? "text-emerald-400 font-bold" : "hover:text-slate-200"}`}
          >
            <AlertCircle className="w-4 h-4 text-emerald-500" />
            {openCount} Open
          </button>
          <button 
            onClick={() => setFilter("closed")}
            className={`flex items-center gap-1.5 py-1 ${filter === "closed" ? "text-purple-400 font-bold" : "hover:text-slate-200"}`}
          >
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
            {closedCount} Closed
          </button>
        </div>

        {/* Create button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Issue
        </button>
      </div>

      {/* Issues list container */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">Loading issues...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="font-bold text-white text-sm">No issues found</h4>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              There are no issues matching your filter. Click &quot;New Issue&quot; to report a bug or suggest features.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {filteredIssues.map((issue) => (
              <div 
                key={issue._id} 
                className="p-4 hover:bg-[#1a202c]/20 transition-all flex items-start justify-between gap-4"
              >
                <div className="flex gap-3 min-w-0">
                  <div className="pt-0.5">
                    {issue.status === "open" ? (
                      <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                    )}
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm hover:text-blue-400 transition-colors">
                      {issue.title}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {issue.description}
                    </p>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Opened {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30363d]"></span>
                      <span className="capitalize text-slate-400">
                        Status: <span className={issue.status === "open" ? "text-emerald-400" : "text-purple-400"}>{issue.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(issue)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                      issue.status === "open"
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {issue.status === "open" ? "Close" : "Reopen"}
                  </button>
                  <button
                    onClick={() => handleDeleteIssue(issue._id)}
                    className="p-1.5 rounded-md border border-[#30363d] hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Issue Modal overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117]/80 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2 border-b border-[#30363d] pb-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Open a new issue
            </h3>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bug: Search filtering crashes on special characters"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder="Provide steps to reproduce, actual vs expected behavior..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-1.5 px-3.5 rounded-lg bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Opening..." : "Submit new issue"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default IssueTracker;
