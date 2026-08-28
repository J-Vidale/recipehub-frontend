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

  return (
    <nav className="navbar">
      <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-3 flex-wrap">
        <div className="flex items-center gap-5 flex-wrap">
          <Link to="/" className="text-xl font-bold text-green-700 tracking-tight">
            RecipeHub
          </Link>
          <Link to="/explore" className="navbar-link">Explore</Link>
          <Link to="/popular-meals" className="navbar-link">Popular</Link>
          <Link to="/random-meal" className="navbar-link">Random</Link>
          <SearchBar />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {user ? (
            <>
              <Link to="/feed" className="navbar-link">Feed</Link>
              <NotificationBell />
              <MessageBadge />
              <Link to="/your-recipes" className="navbar-link">Your Recipes</Link>
              <Link to="/create" className="navbar-link">Create</Link>
              <Link to="/saved-recipes" className="navbar-link">Saved</Link>
              <Link to="/profile" className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="avatar avatar-xs" />
                ) : (
                  <span className="avatar avatar-xs">
                    {(user.username || user.email || "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user.username || user.email}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn-danger">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
