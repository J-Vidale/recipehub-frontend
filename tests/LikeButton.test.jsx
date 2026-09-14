// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LikeButton from "../src/components/LikeButton";
import { ApiError } from "../src/services/api";

// The button flips first and reverts if the request fails. Blocking now
// refuses a like with a 403 and a sentence written to be read, so a revert
// with nothing said leaves the person watching the heart fill and empty
// for no visible reason.

const post = vi.fn();
const del = vi.fn();
const error = vi.fn();

vi.mock("../src/services/api", async () => {
  const actual = await vi.importActual("../src/services/api");
  return {
    ...actual,
    default: { post: (...a) => post(...a), delete: (...a) => del(...a) },
  };
});
vi.mock("../src/context/ToastContext", () => ({ useToast: () => ({ error, success: vi.fn() }) }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => ({ user: { _id: "me" } }) }));

beforeEach(() => {
  post.mockReset();
  del.mockReset();
  error.mockReset();
});

afterEach(() => vi.restoreAllMocks());

const mount = () =>
  render(
    <MemoryRouter>
      <LikeButton recipeId="r1" initialLikeCount={4} initialLikedByMe={false} />
    </MemoryRouter>
  );

describe("a like the server refuses", () => {
  it("says why, and puts the count back", async () => {
    post.mockRejectedValue(new ApiError("x", 403, { message: "You cannot like this recipe" }));
    mount();

    fireEvent.click(screen.getByRole("button"));
    // Optimistic first.
    expect(screen.getByRole("button").textContent).toContain("5");

    await waitFor(() => expect(error).toHaveBeenCalledWith("You cannot like this recipe"));
    await waitFor(() => expect(screen.getByRole("button").textContent).toContain("4"));
  });

  it("stays silent when the request never reached a server", async () => {
    post.mockRejectedValue(new ApiError("offline", 0, null, "network"));
    mount();

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("button").textContent).toContain("4"));
    expect(error, "a toast on every flaky tap is noise").not.toHaveBeenCalled();
  });
});

describe("a like the server accepts", () => {
  it("takes the count the server settled on", async () => {
    post.mockResolvedValue({ data: { likeCount: 9, likedByMe: true } });
    mount();

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("button").textContent).toContain("9"));
    expect(error).not.toHaveBeenCalled();
  });
});
