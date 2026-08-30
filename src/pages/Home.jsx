import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "../lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: SITE_DESCRIPTION,
};

const Home = () => {
  return (
    <div className="page-container hero flex items-center justify-center">
      <Seo
        title="Share and Discover Recipes"
        description="Discover, share and save recipes from real home cooks. Browse thousands of dishes and drinks, follow the cooks you like, and build your own recipe collection."
        structuredData={structuredData}
      />
      <div className="text-center max-w-2xl">
        <span className="inline-block text-xs font-bold tracking-wide uppercase text-green-700 bg-green-100 px-3 py-1 rounded-full mb-5">
          Cook. Share. Discover.
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Your recipes deserve<br />an audience.
        </h1>
        <p className="text-lg text-gray-600 mb-9 max-w-lg mx-auto">
          Discover new dishes from real cooks, save the ones you'll actually make,
          and share your own. RecipeHub is where recipes become a feed worth following.
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
