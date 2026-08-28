import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="page-container flex items-center justify-center">
      <div className="card text-center max-w-xl">
        <h1 className="text-4xl font-bold text-green-700 mb-4">Welcome to RecipeHub</h1>
        <p className="text-gray-600 mb-8">
          Discover, share, and save your favorite recipes all in one place.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
