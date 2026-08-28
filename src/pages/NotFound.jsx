import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="page-container flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-green-700 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Page Not Found</p>
      <Link to="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
