/* eslint-disable react-refresh/only-export-components -- this module intentionally exports AuthContext, useAuth alongside its provider, the conventional React context pattern. The rule only affects Fast Refresh granularity during development. */
import { createContext, useEffect, useState, useContext } from "react";
import API from "../services/api";
import { getStored, setStored, removeStored } from "../lib/storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // The token is held in state as well as storage so that replacing it is
  // something the tree can react to. The socket reads it at handshake
  // time and nowhere else, so a token that changes underneath a live
  // connection has to be able to prompt a new one.
  const [token, setToken] = useState(() => getStored("token"));

  const [user, setUser] = useState(() => {
    const storedUser = getStored("user");
    if (!storedUser || storedUser === "undefined") return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });

  // The stored user is a snapshot taken at login and never revisited, so
  // anything the server derives per request - whether this account
  // moderates, chiefly - never arrived, and anything that changed since
  // stayed stale until the next login. Refreshed once on mount.
  //
  // Deliberately not destructive on failure: a sleeping server or a
  // dropped connection must not look like being signed out. Only a 401
  // ends the session, and the API client already handles that.
  useEffect(() => {
    if (!getStored("token")) return;
    let cancelled = false;
    API.get("/users/me")
      .then((response) => {
        if (cancelled || !response?.data?._id) return;
        setUser(response.data);
        setStored("user", JSON.stringify(response.data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.post("/auth/login", { username, password });
      // Backend returns a flat { _id, username, email, token } object.
      const { token, ...userData } = response.data;
      setStored("user", JSON.stringify(userData));
      setStored("token", token);
      setToken(token);
      setUser(userData);
    } catch (error) {
      // Rethrowing a bare Error used to discard the network classification,
      // so an unreachable server was indistinguishable from a rejected
      // password. The flag rides along now.
      const wrapped = new Error(
        error.response?.data?.message || error.message || "Login failed"
      );
      wrapped.kind = error.kind;
      throw wrapped;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await API.post("/auth/register", { username, email, password });
      return response.data;
    } catch (error) {
      const wrapped = new Error(
        error.response?.data?.message || error.message || "Registration failed"
      );
      wrapped.kind = error.kind;
      throw wrapped;
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

  // Swaps the session's token without touching who is signed in - what
  // changing a password does. The server ends every connection that
  // predates the change, this device's included, and socket.io treats a
  // close the server asked for as final: it will not retry on its own. So
  // the new token has to arrive as a change the tree can see, rather than
  // a quiet write to storage that nothing is watching.
  const replaceToken = (next) => {
    if (!next) return;
    setStored("token", next);
    setToken(next);
  };

  const logout = () => {
    removeStored("user");
    removeStored("token");
    setToken(null);
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
    <AuthContext.Provider
      value={{ user, token, login, register, logout, fetchUserData, updateUser, replaceToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
