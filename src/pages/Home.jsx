import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="page-container hero flex items-center justify-center">
      <div className="text-center max-w-2xl">
        <span className="inline-block text-xs font-bold tracking-wide uppercase text-green-700 bg-green-100 px-3 py-1 rounded-full mb-5">
          Cook. Share. Discover.
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Your recipes deserve<br />an audience.
        </h1>
        <p className="text-lg text-gray-600 mb-9 max-w-lg mx-auto">
          Discover new dishes from real cooks, save the ones you'll actually make,
          and share your own — RecipeHub is where recipes become a feed worth following.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base px-7 py-3">
            Get Started
          </Link>
          <Link to="/login" className="btn-secondary text-base px-7 py-3">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
