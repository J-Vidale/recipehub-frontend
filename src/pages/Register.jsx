import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Seo from "../components/Seo";
import Field from "../components/Field";
import { isNetworkError } from "../services/api";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  USERNAME_HINT,
  MIN_PASSWORD_LENGTH,
} from "../lib/credentials";

function Register() {
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field's error as soon as it is being addressed, rather
    // than leaving it under a field that has since changed.
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Checked here first purely to save the round trip: on free hosting
    // the API may be asleep, and hearing "usernames need three characters"
    // after thirty seconds of waiting is a poor way to find out. The
    // server checks all of this again and has the final say.
    const errors = {
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    if (errors.username || errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(formData.username.trim(), formData.email.trim(), formData.password);
      await login(formData.username.trim(), formData.password);
      navigate("/profile");
    } catch (err) {
      setError(isNetworkError(err) ? err.message : err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container hero flex items-center justify-center">
      <Seo
        title="Create an Account"
        description="Join RecipeHub to publish your own recipes with photos, follow other home cooks, and save the dishes you want to make next."
      />
      <div className="card w-full max-w-md">
        <h1 className="card-title mb-6 text-center">Create your account</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={fieldErrors.username}
            hint={USERNAME_HINT}
            autoComplete="username"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            autoComplete="new-password"
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating your account..." : "Create account"}
          </button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-green-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
