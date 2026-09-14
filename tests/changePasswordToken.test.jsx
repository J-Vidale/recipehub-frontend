// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChangePassword from "../src/components/ChangePassword";

// The replacement token has to reach the tree, not just storage. The
// server closes this tab's socket as part of the change, and the socket
// provider is what builds a new one - it can only do that if it sees the
// token change.

const patch = vi.fn();
const replaceToken = vi.fn();
const success = vi.fn();
const error = vi.fn();
const setStored = vi.fn();

vi.mock("../src/services/api", () => ({ default: { patch: (...a) => patch(...a) } }));
vi.mock("../src/context/ToastContext", () => ({ useToast: () => ({ success, error }) }));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => ({ replaceToken }) }));
vi.mock("../src/lib/storage", async () => {
  const actual = await vi.importActual("../src/lib/storage");
  return { ...actual, setStored: (...a) => setStored(...a) };
});

beforeEach(() => {
  patch.mockReset().mockResolvedValue({ data: { message: "Password changed.", token: "fresh.token" } });
  replaceToken.mockReset();
  setStored.mockReset();
  success.mockReset();
  error.mockReset();
});

afterEach(() => vi.restoreAllMocks());

const fill = () => {
  // The form sits behind a toggle, and the button that opens it carries
  // the same words as the one that submits it.
  fireEvent.click(screen.getByRole("button", { name: /change password/i }));
  fireEvent.change(screen.getByLabelText(/current password/i), {
    target: { value: "old-password-1" },
  });
  fireEvent.change(screen.getByLabelText(/new password/i), {
    target: { value: "Str0ng-new-password" },
  });
  fireEvent.click(
    screen.getAllByRole("button", { name: /change password/i }).find((b) => b.type === "submit")
  );
};

describe("the token a password change hands back", () => {
  it("goes through the context, so the socket can be rebuilt with it", async () => {
    render(<ChangePassword />);
    fill();

    await waitFor(() => expect(replaceToken).toHaveBeenCalledWith("fresh.token"));
    expect(
      setStored,
      "written straight to storage, where nothing is watching for it"
    ).not.toHaveBeenCalledWith("token", expect.anything());
  });

  it("is not demanded when the server does not send one", async () => {
    patch.mockResolvedValue({ data: { message: "Password changed." } });
    render(<ChangePassword />);
    fill();

    await waitFor(() => expect(success).toHaveBeenCalled());
    expect(replaceToken).not.toHaveBeenCalled();
  });
});
