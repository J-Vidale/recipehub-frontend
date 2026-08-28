import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import MessageBadge from "./MessageBadge";
import SearchBar from "./SearchBar";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLink = "text-sm font-medium text-gray-600 hover:text-green-700 transition";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 flex-wrap">
        <div className="flex items-center gap-5 flex-wrap">
          <Link to="/" className="text-xl font-bold text-green-700">
            RecipeHub
          </Link>
          <Link to="/explore" className={navLink}>Explore</Link>
          <Link to="/popular-meals" className={navLink}>Popular</Link>
          <Link to="/random-meal" className={navLink}>Random</Link>
          <SearchBar />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {user ? (
            <>
              <Link to="/feed" className={navLink}>Feed</Link>
              <NotificationBell />
              <MessageBadge />
              <Link to="/your-recipes" className={navLink}>Your Recipes</Link>
              <Link to="/create" className={navLink}>Create</Link>
              <Link to="/saved-recipes" className={navLink}>Saved</Link>
              <Link to="/profile" className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="avatar avatar-xs" />
                ) : (
                  <span className="avatar avatar-xs">
                    {(user.username || user.email || "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {user.username || user.email}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn-danger">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navLink}>Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
