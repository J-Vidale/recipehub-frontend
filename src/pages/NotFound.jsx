import React from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import { UtensilsIcon } from "../components/icons";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="page-container hero flex flex-col items-center justify-center text-center">
      <Seo
        title="Page Not Found"
        description="This RecipeHub page doesn't exist. Head back to the kitchen and find something else to cook."
        noindex
      />

      <UtensilsIcon size="3.5rem" className="text-green-700 mb-4" />
      <h1 className="text-4xl font-bold text-green-700 mb-3">
        This page isn't on the menu
      </h1>
      <p className="text-gray-600 mb-8 max-w-md">
        We couldn't find anything at <code className="text-gray-800">{pathname}</code>. It may
        have been removed, or the link might be wrong.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link to="/" className="btn-primary">
          Go home
        </Link>
        <Link to="/explore" className="btn-secondary">
          Explore recipes
        </Link>
        <Link to="/random-meal" className="btn-secondary">
          Show me something random
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
