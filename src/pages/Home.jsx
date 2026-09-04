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
        description="Post the recipes you cook and save the ones you want to try next. Follow other home cooks, and browse dishes and drinks by category or at random."
        structuredData={structuredData}
      />
      <div className="text-center max-w-2xl">
        <span className="inline-block text-xs font-bold tracking-wide uppercase text-green-700 bg-green-100 px-3 py-1 rounded-full mb-5">
          Recipes from home cooks
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Keep every recipe<br />you cook in one place.
        </h1>
        <p className="text-lg text-gray-600 mb-9 max-w-lg mx-auto">
          Post what you make and save what you want to try next. Follow the cooks
          whose food you actually want to eat, and their new recipes show up in
          your feed.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base px-7 py-3">
            Create an account
          </Link>
          <Link to="/login" className="btn-secondary text-base px-7 py-3">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
