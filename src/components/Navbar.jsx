import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import MessageBadge from "./MessageBadge";
import SearchBar from "./SearchBar";
import { MenuIcon, CloseIcon } from "./icons";
import { avatarImage } from "../lib/images";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef(null);

  // Close the mobile menu whenever navigation happens, so tapping a link
  // doesn't leave the panel covering the page it just opened.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the panel, matching how every other dismissible overlay
  // on the web behaves.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const browseLinks = [
    { to: "/explore", label: "Explore" },
    { to: "/popular-meals", label: "Popular" },
    { to: "/random-meal", label: "Random" },
  ];

  const accountLinks = user
    ? [
        { to: "/feed", label: "Feed" },
        { to: "/your-recipes", label: "Your Recipes" },
        { to: "/create", label: "Create" },
        { to: "/saved-recipes", label: "Saved" },
      ]
    : [];

  const avatar = user && (
    user.avatarUrl ? (
      <img src={avatarImage(user.avatarUrl, 56)} alt="" className="avatar avatar-xs" />
    ) : (
      <span className="avatar avatar-xs" aria-hidden="true">
        {(user.username || user.email || "?")[0].toUpperCase()}
      </span>
    )
  );

  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar__bar">
        <Link to="/" className="navbar__brand" aria-label="RecipeHub home">
          RecipeHub
        </Link>

        {/* Desktop navigation */}
        <div className="navbar__desktop">
          {browseLinks.map((l) => (
            <Link key={l.to} to={l.to} className="navbar-link">{l.label}</Link>
          ))}
          <SearchBar />
        </div>

        <div className="navbar__desktop navbar__desktop--end">
          {user ? (
            <>
              {accountLinks.map((l) => (
                <Link key={l.to} to={l.to} className="navbar-link">{l.label}</Link>
              ))}
              <NotificationBell />
              <MessageBadge />
              <Link to="/profile" className="navbar__account">
                {avatar}
                <span className="navbar__username">{user.username || user.email}</span>
              </Link>
              <button onClick={handleLogout} className="btn-danger">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>

        {/* Mobile: badges stay visible, everything else moves into the panel */}
        <div className="navbar__mobile-actions">
          {user && <NotificationBell />}
          {user && <MessageBadge />}
          <button
            type="button"
            className="navbar__toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <CloseIcon size="1.4rem" /> : <MenuIcon size="1.4rem" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        className={`navbar__panel${menuOpen ? " is-open" : ""}`}
        hidden={!menuOpen}
      >
        <div className="navbar__panel-search">
          <SearchBar />
        </div>

        <p className="navbar__panel-heading">Browse</p>
        {browseLinks.map((l) => (
          <Link key={l.to} to={l.to} className="navbar__panel-link">{l.label}</Link>
        ))}

        {user ? (
          <>
            <p className="navbar__panel-heading">Your account</p>
            {accountLinks.map((l) => (
              <Link key={l.to} to={l.to} className="navbar__panel-link">{l.label}</Link>
            ))}
            <Link to="/messages" className="navbar__panel-link">Messages</Link>
            <Link to="/notifications" className="navbar__panel-link">Notifications</Link>
            <Link to="/profile" className="navbar__panel-link navbar__panel-link--account">
              {avatar}
              <span>{user.username || user.email}</span>
            </Link>
            <button onClick={handleLogout} className="btn-danger w-full mt-2">Logout</button>
          </>
        ) : (
          <div className="navbar__panel-auth">
            <Link to="/login" className="btn-secondary flex-1">Login</Link>
            <Link to="/register" className="btn-primary flex-1">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
