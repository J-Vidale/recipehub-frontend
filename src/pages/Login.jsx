import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Seo from "../components/Seo";

function Login() {
  const { login: contextLogin, fetchUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contextLogin(formData.username, formData.password);
      await fetchUserData(); // <-- Add this line!
      navigate("/profile");
    } catch {
      setError("Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container hero flex items-center justify-center">
      <Seo
        title="Log In"
        description="Log in to RecipeHub to publish your recipes, save the dishes you want to cook, and follow other home cooks."
      />
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-6 text-center">Log in to RecipeHub</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            required
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-green-700 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
