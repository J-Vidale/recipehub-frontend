// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// The button flips before the server answers, which is what makes it feel
// immediate. What it did not do was take the server's answer for the count:
// it kept its own +1, so two people following the same person at once each
// saw only their own, and the number under the name stayed wrong until a
// reload. The server returns the real figure; the button now passes it on.

vi.mock("../src/services/api", () => ({
  default: { post: vi.fn(), delete: vi.fn() },
}));
vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: { _id: "me", username: "marta" } }),
}));

const API = (await import("../src/services/api")).default;
const FollowButton = (await import("../src/components/FollowButton")).default;

const renderButton = (props = {}) => {
  const changes = [];
  render(
    <MemoryRouter>
      <FollowButton
        userId="u2"
        initialFollowingByMe={false}
        onFollowerCountChange={(change) => changes.push(change)}
        {...props}
      />
    </MemoryRouter>
  );
  return changes;
};

beforeEach(() => {
  API.post.mockReset();
  API.delete.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("following someone", () => {
  it("guesses immediately, then takes the server's count", async () => {
    API.post.mockResolvedValue({ data: { followingByMe: true, followerCount: 42 } });
    const changes = renderButton();
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(changes).toHaveLength(2));
    expect(changes[0]).toEqual({ delta: 1 });
    expect(changes[1]).toEqual({ count: 42 });
  });

  it("puts the guess back when the request fails", async () => {
    API.post.mockRejectedValue(new Error("offline"));
    const changes = renderButton();
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(changes).toHaveLength(2));
    expect(changes[0]).toEqual({ delta: 1 });
    expect(changes[1]).toEqual({ delta: -1 });
  });

  it("keeps the guess when the server does not send a count", async () => {
    // Rather than overwriting a good number with undefined.
    API.post.mockResolvedValue({ data: { followingByMe: true } });
    const changes = renderButton();
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(API.post).toHaveBeenCalled());
    expect(changes).toEqual([{ delta: 1 }]);
  });
});

describe("unfollowing someone", () => {
  it("guesses down, then takes the server's count", async () => {
    API.delete.mockResolvedValue({ data: { followingByMe: false, followerCount: 7 } });
    const changes = renderButton({ initialFollowingByMe: true });
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(changes).toHaveLength(2));
    expect(changes[0]).toEqual({ delta: -1 });
    expect(changes[1]).toEqual({ count: 7 });
  });

  it("puts the guess back when the request fails", async () => {
    API.delete.mockRejectedValue(new Error("offline"));
    const changes = renderButton({ initialFollowingByMe: true });
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(changes).toHaveLength(2));
    expect(changes[1]).toEqual({ delta: 1 });
  });
});
