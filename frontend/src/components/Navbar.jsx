import { Link } from "react-router-dom";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-primary"
        >
          <BookOpen className="text-primary" />
          <span>EduHack</span>
        </Link>

        {/* Links */}
        <div className="flex gap-6 items-center">
          {/* Show 'Dashboard' only if logged in */}
          {user && (
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-primary transition font-medium"
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-2 text-dark font-medium">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-primary">
                  <UserIcon size={18} />
                </div>
                <span className="hidden md:block">
                  {user.name.split(" ")[0]}
                </span>{" "}
                {/* Show First Name */}
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/login"
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-black hover:text-white transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-black hover:text-white transition font-medium shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
