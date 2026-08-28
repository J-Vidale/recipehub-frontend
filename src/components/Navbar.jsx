import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow flex items-center justify-between px-8 py-4 mb-6">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-2xl font-bold text-green-700">
          RecipeHub
        </Link>
        <Link to="/explore">Explore</Link>
        <Link to="/popular-meals">Popular</Link>
        <Link to="/random-meal">Random</Link>
        <SearchBar />
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/feed">Feed</Link>
            <NotificationBell />
            <Link to="/profile">Profile</Link>
            <Link to="/your-recipes">Your Recipes</Link>
            <Link to="/create">Create</Link>
            <Link to="/saved-recipes">Saved</Link>
            <span className="text-gray-600 text-sm">
              Signed in as <strong>{user.username || user.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
