/* eslint-disable react-refresh/only-export-components -- this module intentionally exports AuthContext, useAuth alongside its provider, the conventional React context pattern. The rule only affects Fast Refresh granularity during development. */
import { createContext, useState, useContext } from "react";
import API from "../services/api";
import { getStored, setStored, removeStored } from "../lib/storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = getStored("user");
    if (!storedUser || storedUser === "undefined") return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    try {
      const response = await API.post("/auth/login", { username, password });
      // Backend returns a flat { _id, username, email, token } object.
      const { token, ...userData } = response.data;
      setStored("user", JSON.stringify(userData));
      setStored("token", token);
      setUser(userData);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await API.post("/auth/register", { username, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  };

  // Merges a partial update (e.g. a new avatarUrl) into the current user
  // without a full re-fetch, keeping localStorage in sync so it survives
  // a refresh.
  const updateUser = (partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      setStored("user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    removeStored("user");
    removeStored("token");
    setUser(null);
  };

  const fetchUserData = async () => {
    const token = getStored("token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await API.get("/users/me");
      setUser(response.data);
    } catch (error) {
      console.error(error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, fetchUserData, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
