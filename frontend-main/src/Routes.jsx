import { useEffect } from "react";
import { useNavigate, useRoutes, useLocation } from "react-router-dom";

// Pages List
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import CreateRepository from "./components/repo/CreateRepository";
import RepositoryDetail from "./components/repo/RepositoryDetail";

// Auth Context
import { useAuth } from "./authContext";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 className="text-6xl font-bold text-white">404</h1>
    <p className="text-slate-400 text-lg">Page not found</p>
    <a href="/" className="text-blue-400 hover:text-blue-300 underline">
      Go back to Dashboard
    </a>
  </div>
);

const ProjectRoutes = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthRoute = ["/auth", "/signup"].includes(location.pathname);

    if (!currentUser && !isAuthRoute) {
      navigate("/auth");
    }

    if (currentUser && isAuthRoute) {
      navigate("/");
    }
  }, [currentUser, navigate, location.pathname]);

  let element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
    },
    {
      path: "/auth",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/create",
      element: <CreateRepository />,
    },
    {
      path: "/repo/:id",
      element: <RepositoryDetail />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return element;
};

export default ProjectRoutes;