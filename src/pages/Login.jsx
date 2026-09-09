import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Seo from "../components/Seo";
import Field from "../components/Field";
import { isNetworkError } from "../services/api";

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
    setError("");
    setSubmitting(true);
    try {
      await contextLogin(formData.username, formData.password);
      await fetchUserData(); // <-- Add this line!
      navigate("/profile");
    } catch (err) {
      // "Invalid credentials" for an unreachable server sent people looking
      // for a password problem when the actual fault was the API URL or the
      // CORS allowlist. Only say that when the server actually said no.
      setError(
        isNetworkError(err)
          ? err.message
          : err.message || "Invalid username or password."
      );
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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nothing is validated here beyond being filled in: the rules
              only apply to a new account, and telling someone their
              existing password is the wrong shape would be both wrong and
              a hint about what is stored. */}
          <Field
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Logging in..." : "Log in"}
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
