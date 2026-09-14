// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// The stored user was a snapshot taken at login and never revisited, so
// anything the server derives per request - whether this account
// moderates, chiefly - never arrived, and anything that changed since
// stayed stale until the next login.
//
// It is refreshed on mount now, and deliberately not destructively: a
// sleeping server must not look like being signed out.

vi.mock("../src/services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const API = (await import("../src/services/api")).default;
const { AuthProvider, useAuth } = await import("../src/context/AuthContext");

const Show = () => {
  const { user } = useAuth();
  return <span data-testid="who">{user ? `${user.username}:${String(user.isAdmin)}` : "nobody"}</span>;
};

const storedUser = { _id: "u1", username: "marta_cooks" };

beforeEach(() => {
  window.localStorage.clear();
  API.get.mockReset();
});
afterEach(() => vi.restoreAllMocks());

const signedIn = () => {
  window.localStorage.setItem("token", "fake.jwt");
  window.localStorage.setItem("user", JSON.stringify(storedUser));
};

describe("the session on page load", () => {
  it("takes what the server says, including what only it knows", async () => {
    signedIn();
    API.get.mockResolvedValue({ data: { ...storedUser, isAdmin: true } });
    render(<AuthProvider><Show /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("marta_cooks:true"));
  });

  it("writes the fresh copy back, so the next load starts from it", async () => {
    signedIn();
    API.get.mockResolvedValue({ data: { ...storedUser, isAdmin: true } });
    render(<AuthProvider><Show /></AuthProvider>);
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem("user")).isAdmin).toBe(true)
    );
  });

  it("replaces a value the reader forged in storage", async () => {
    // Claiming to moderate in localStorage must not survive contact with
    // the server's answer.
    window.localStorage.setItem("token", "fake.jwt");
    window.localStorage.setItem("user", JSON.stringify({ ...storedUser, isAdmin: true }));
    API.get.mockResolvedValue({ data: { ...storedUser, isAdmin: false } });
    render(<AuthProvider><Show /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("marta_cooks:false"));
  });

  it("keeps you signed in when the server cannot be reached", async () => {
    // Free hosting sleeps. A failed refresh must not read as a logout.
    signedIn();
    API.get.mockRejectedValue(new Error("offline"));
    render(<AuthProvider><Show /></AuthProvider>);
    await waitFor(() => expect(API.get).toHaveBeenCalled());
    expect(screen.getByTestId("who")).toHaveTextContent("marta_cooks");
  });

  it("ignores an answer that is not a user", async () => {
    signedIn();
    API.get.mockResolvedValue({ data: { message: "Server error" } });
    render(<AuthProvider><Show /></AuthProvider>);
    await waitFor(() => expect(API.get).toHaveBeenCalled());
    expect(screen.getByTestId("who")).toHaveTextContent("marta_cooks");
  });

  it("does not ask at all when nobody is signed in", async () => {
    render(<AuthProvider><Show /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId("who")).toHaveTextContent("nobody"));
    expect(API.get).not.toHaveBeenCalled();
  });
});
