// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportButton from "../src/components/ReportButton";

// The server refuses a report of your own content, and answers a repeat
// report with "you have already reported this" rather than an error.
// Neither was reflected here: the button appeared on your own recipe, so
// the only way to learn it was refused was to write a reason and be told
// no - and a repeat was announced as a fresh submission.

const post = vi.fn();
const success = vi.fn();
const error = vi.fn();
let currentUser = { _id: "me" };

vi.mock("../src/services/api", () => ({ default: { post: (...args) => post(...args) } }));
vi.mock("../src/context/ToastContext", () => ({ useToast: () => ({ success, error }) }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => ({ user: currentUser }) }));

beforeEach(() => {
  post.mockReset().mockResolvedValue({ data: { message: "Report submitted" } });
  success.mockReset();
  error.mockReset();
  currentUser = { _id: "me" };
});

afterEach(() => vi.restoreAllMocks());

const submit = (reason = "spam") => {
  fireEvent.click(screen.getByRole("button", { name: /^report$/i }));
  fireEvent.change(screen.getByLabelText(/why are you reporting/i), {
    target: { value: reason },
  });
  fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
};

describe("who the report button is offered to", () => {
  it("is hidden on content you own", () => {
    render(<ReportButton targetType="recipe" targetId="r1" ownerId="me" />);
    expect(screen.queryByRole("button", { name: /^report$/i })).toBeNull();
  });

  it("is shown on someone else's content", () => {
    render(<ReportButton targetType="recipe" targetId="r1" ownerId="them" />);
    expect(screen.getByRole("button", { name: /^report$/i })).toBeTruthy();
  });

  it("is shown when the owner is unknown, rather than disappearing", () => {
    // A caller that does not pass ownerId keeps the old behaviour. The
    // server is still the one that decides.
    render(<ReportButton targetType="recipe" targetId="r1" />);
    expect(screen.getByRole("button", { name: /^report$/i })).toBeTruthy();
  });

  it("is hidden from logged-out visitors", () => {
    currentUser = null;
    render(<ReportButton targetType="recipe" targetId="r1" ownerId="them" />);
    expect(screen.queryByRole("button", { name: /^report$/i })).toBeNull();
  });
});

describe("what the reporter is told", () => {
  it("repeats the server's wording for a report that was already filed", async () => {
    post.mockResolvedValue({ data: { message: "You have already reported this" } });
    render(<ReportButton targetType="recipe" targetId="r1" ownerId="them" />);
    submit();

    await waitFor(() =>
      expect(success).toHaveBeenCalledWith(
        expect.stringContaining("You have already reported this")
      )
    );
  });

  it("falls back to its own wording when the server sends no message", async () => {
    post.mockResolvedValue({ data: {} });
    render(<ReportButton targetType="recipe" targetId="r1" ownerId="them" />);
    submit();

    await waitFor(() =>
      expect(success).toHaveBeenCalledWith(expect.stringContaining("Report submitted"))
    );
  });

  it("shows the server's reason when the report is refused", async () => {
    const err = new Error("nope");
    err.response = { status: 404, data: { message: "That no longer exists" } };
    post.mockRejectedValue(err);
    render(<ReportButton targetType="recipe" targetId="r1" ownerId="them" />);
    submit();

    await waitFor(() => expect(error).toHaveBeenCalledWith("That no longer exists"));
  });
});
