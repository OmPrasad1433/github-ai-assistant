import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { Compass, Plus, User, LogOut, Terminal } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const Navbar = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    setCurrentUser(null);
    toast.success("Successfully logged out");
    navigate("/auth");
  };

  return (
    <nav className="glass-nav sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight tracking-tight text-white group-hover:text-blue-400 transition-colors">
            GitHub <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium -mt-0.5 uppercase tracking-widest">
            Copilot Suite
          </span>
        </div>
      </Link>

      {currentUser && (
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            to="/create"
            aria-label="New Repository"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#21262d] border border-[#30363d] text-slate-200 hover:bg-[#30363d] hover:text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">New Repo</span>
          </Link>

          <Link
            to="/"
            aria-label="Dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-[#21262d] hover:text-white transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <Link
            to="/profile"
            aria-label="Profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-[#21262d] hover:text-white transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          <div className="w-[1px] h-5 bg-[#30363d]"></div>

          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-rose-500/0 hover:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
