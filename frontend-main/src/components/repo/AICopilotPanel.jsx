import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  Sparkles, 
  Send, 
  User, 
  BrainCircuit, 
  AlertCircle,
  HelpCircle,
  Code,
  FileText,
  Zap,
  RefreshCw,
  FolderTree
} from "lucide-react";
import toast from "react-hot-toast";

const AICopilotPanel = ({ 
  repoName, 
  description, 
  filesList = [], 
  activeFile = null, 
  onSaveReadme = null 
}) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I am your **GitHub AI Copilot** assistant.

How can I help you today? You can choose one of the quick actions below, or ask me questions about this repository's code, structure, or potential issues.`
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeAITool, setActiveAITool] = useState("chat"); // "chat", "summary", "readme"
  
  // Repo summary tool states
  const [repoSummary, setRepoSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // README generator states
  const [generatedReadme, setGeneratedReadme] = useState("");
  const [loadingReadme, setLoadingReadme] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setSending(true);

    try {
      const activeFileContext = activeFile 
        ? { name: activeFile.name, content: activeFile.content }
        : null;

      const res = await axios.post("/ai/chat", {
        messages: [...messages, userMessage],
        repoName,
        description,
        files: filesList,
        activeFileContext
      });

      setMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch response. Make sure Gemini API Key is configured.");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "**Error**: I could not process your query. Please make sure `GEMINI_API_KEY` is configured in the backend `.env` file." 
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = (action) => {
    let prompt = "";
    if (action === "explain") {
      if (!activeFile) {
        toast.error("Please open a file in the code explorer first to explain it.");
        return;
      }
      prompt = `Explain the open file "${activeFile.name}" and summarize what the code does.`;
    } else if (action === "bugs") {
      if (!activeFile) {
        toast.error("Please open a file in the code explorer first to scan for bugs.");
        return;
      }
      prompt = `Scan the open file "${activeFile.name}" for potential bugs, logical issues, security flaws, or performance improvements.`;
    } else if (action === "docs") {
      if (!activeFile) {
        toast.error("Please open a file in the code explorer first to generate developer documentation.");
        return;
      }
      prompt = `Generate developer JSDoc/inline documentation for the file "${activeFile.name}".`;
    } else if (action === "structure") {
      prompt = "How does this project work? Explain the entry points and architecture.";
    }

    if (prompt) {
      handleSendMessage(prompt);
    }
  };

  // AI Repository Summary
  const handleGenerateSummary = async () => {
    try {
      setLoadingSummary(true);
      setRepoSummary("");
      const res = await axios.post("/ai/summarize-repo", {
        repoName,
        description,
        files: filesList
      });
      setRepoSummary(res.data.summary);
      toast.success("Repository summary generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate summary. Verify API Key settings.");
      setRepoSummary("**Error**: Could not generate summary. Ensure the API key is set.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // AI README Generator
  const handleGenerateReadme = async () => {
    try {
      setLoadingReadme(true);
      setGeneratedReadme("");
      const res = await axios.post("/ai/generate-readme", {
        repoName,
        description,
        languages: filesList.map(f => f.split(".").pop()).filter(Boolean),
        tags: ["copilot", "auto-generated"]
      });
      setGeneratedReadme(res.data.readme);
      toast.success("README.md generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate README.md.");
      setGeneratedReadme("**Error**: Failed to generate README markdown.");
    } finally {
      setLoadingReadme(false);
    }
  };

  const handleApplyReadme = () => {
    if (!generatedReadme) return;
    if (onSaveReadme) {
      onSaveReadme(generatedReadme);
      toast.success("README.md applied to the codebase! Write a commit message to save.");
      setActiveAITool("chat");
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col h-[650px] shadow-lg overflow-hidden">
      {/* Copilot Header Selector */}
      <div className="bg-[#0d1117] border-b border-[#30363d] p-3 flex justify-between items-center gap-1.5 overflow-x-auto shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <span className="font-extrabold text-sm text-white">Copilot Suite</span>
        </div>

        <div className="flex gap-1.5 text-[10px] font-bold">
          <button
            onClick={() => setActiveAITool("chat")}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeAITool === "chat" ? "bg-indigo-600 text-white" : "bg-[#21262d] text-slate-400 hover:text-white"
            }`}
          >
            Chat Assistant
          </button>
          <button
            onClick={() => {
              setActiveAITool("summary");
              if (!repoSummary) handleGenerateSummary();
            }}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeAITool === "summary" ? "bg-indigo-600 text-white" : "bg-[#21262d] text-slate-400 hover:text-white"
            }`}
          >
            Repo Summary
          </button>
          <button
            onClick={() => {
              setActiveAITool("readme");
              if (!generatedReadme) handleGenerateReadme();
            }}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeAITool === "readme" ? "bg-indigo-600 text-white" : "bg-[#21262d] text-slate-400 hover:text-white"
            }`}
          >
            AI README
          </button>
        </div>
      </div>

      {/* CHAT TAB CONTENT */}
      {activeAITool === "chat" && (
        <React.Fragment>
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === "user" 
                    ? "bg-slate-700 font-bold text-white text-xs" 
                    : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
                }`}>
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                  m.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-[#0d1117] border border-[#30363d] text-slate-300 rounded-tl-none prose prose-invert max-w-none"
                }`}>
                  {/* Parse basic markdown styling for bolding and code blocks */}
                  <div className="whitespace-pre-wrap font-sans">
                    {m.content.split("```").map((part, i) => {
                      if (i % 2 === 1) {
                        const codeLines = part.split("\n");
                        const lang = codeLines[0].trim();
                        const code = codeLines.slice(1).join("\n").trim();
                        return (
                          <div key={i} className="my-2.5 rounded-lg overflow-hidden border border-[#30363d] font-mono">
                            {lang && <div className="bg-[#161b22] px-3 py-1 text-[9px] text-slate-500 uppercase font-bold border-b border-[#30363d]">{lang}</div>}
                            <pre className="bg-[#010409] p-3 text-[10px] text-emerald-400 overflow-x-auto"><code>{code}</code></pre>
                          </div>
                        );
                      }
                      
                      // Highlight inline code and bold text
                      return part.split("`").map((subPart, j) => {
                        if (j % 2 === 1) {
                          return <code key={j} className="bg-[#21262d] px-1 py-0.5 rounded text-[10px] text-indigo-300 font-mono">{subPart}</code>;
                        }
                        
                        // Parse bold markdown **text**
                        return subPart.split("**").map((boldPart, k) => {
                          if (k % 2 === 1) {
                            return <strong key={k} className="text-white font-extrabold">{boldPart}</strong>;
                          }
                          return boldPart;
                        });
                      });
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {sending && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  Copilot is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#0d1117]/80 border-t border-[#30363d] px-4 py-2.5 flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => handleQuickAction("explain")}
              className="text-[10px] px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-slate-500 text-slate-300 font-bold transition-all flex items-center gap-1"
            >
              <Code className="w-3 h-3 text-blue-400" />
              Explain File
            </button>
            <button
              onClick={() => handleQuickAction("bugs")}
              className="text-[10px] px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-slate-500 text-slate-300 font-bold transition-all flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Scan Bugs
            </button>
            <button
              onClick={() => handleQuickAction("docs")}
              className="text-[10px] px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-slate-500 text-slate-300 font-bold transition-all flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              Generate Docs
            </button>
            <button
              onClick={() => handleQuickAction("structure")}
              className="text-[10px] px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-slate-500 text-slate-300 font-bold transition-all flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-purple-400" />
              How it works
            </button>
          </div>

          {/* Message input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="p-3 bg-[#161b22] border-t border-[#30363d] flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={activeFile ? `Ask about "${activeFile.name}" or code...` : "Ask Copilot anything..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </React.Fragment>
      )}

      {/* SUMMARY TAB CONTENT */}
      {activeAITool === "summary" && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#30363d]/50">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              Workspace Summary
            </h4>
            <button
              onClick={handleGenerateSummary}
              disabled={loadingSummary}
              className="p-1 rounded bg-[#21262d] border border-[#30363d] text-slate-400 hover:text-white transition-colors"
              title="Regenerate Summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingSummary ? (
            <div className="p-8 text-center text-slate-500 space-y-3">
              <div className="w-8 h-8 border-2 border-slate-500 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs">Analyzing repository files and mapping architecture...</p>
            </div>
          ) : (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-xs text-slate-300 leading-relaxed font-sans prose prose-invert">
              <div className="whitespace-pre-wrap">
                {repoSummary.split("**").map((boldPart, k) => {
                  if (k % 2 === 1) {
                    return <strong key={k} className="text-white font-extrabold">{boldPart}</strong>;
                  }
                  return boldPart;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* README TAB CONTENT */}
      {activeAITool === "readme" && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
          <div className="flex justify-between items-center pb-2 border-b border-[#30363d]/50 shrink-0">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              AI README Generator
            </h4>
            <button
              onClick={handleGenerateReadme}
              disabled={loadingReadme}
              className="p-1 rounded bg-[#21262d] border border-[#30363d] text-slate-400 hover:text-white transition-colors"
              title="Regenerate README"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReadme ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingReadme ? (
            <div className="p-8 text-center text-slate-500 flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-slate-500 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs">Generating professional markdown documentation...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-y-auto max-h-[350px]">
                <pre className="whitespace-pre-wrap">{generatedReadme}</pre>
              </div>

              {generatedReadme && onSaveReadme && (
                <button
                  onClick={handleApplyReadme}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors shrink-0"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Apply & Stage README.md
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AICopilotPanel;
