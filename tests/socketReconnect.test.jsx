// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Changing a password issues a new token, and the server closes every
// connection made with the old one - this device's included, because the
// handshake is the only place a socket's token is ever read and there is
// no way to tell one of your own sockets from another.
//
// socket.io does not retry a close the server asked for. So the tab that
// made the change kept a perfectly good session and silently lost
// real-time until someone reloaded it. The new token has to be something
// the tree can react to, not a quiet write to storage.

const io = vi.fn();
const sockets = [];

vi.mock("socket.io-client", () => ({
  io: (...args) => {
    io(...args);
    const socket = { on: vi.fn(), disconnect: vi.fn() };
    sockets.push(socket);
    return socket;
  },
}));

let auth;
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => auth }));

const { SocketProvider } = await import("../src/context/SocketContext");

beforeEach(() => {
  io.mockReset();
  sockets.length = 0;
  auth = { user: { _id: "u1" }, token: "first.token" };
});

afterEach(() => vi.restoreAllMocks());

const Harness = () => {
  const [token, setToken] = useState("first.token");
  auth = { user: { _id: "u1" }, token };
  return (
    <>
      <button onClick={() => setToken("second.token")}>change password</button>
      <SocketProvider>
        <span>connected area</span>
      </SocketProvider>
    </>
  );
};

const tokensUsed = () => io.mock.calls.map((call) => call[1]?.auth?.token);

describe("the socket after a password change", () => {
  it("is rebuilt with the new token", async () => {
    render(<Harness />);
    await waitFor(() => expect(tokensUsed()).toEqual(["first.token"]));

    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() =>
      expect(
        tokensUsed(),
        "the tab that changed the password kept a dead connection"
      ).toEqual(["first.token", "second.token"])
    );
  });

  it("closes the old one rather than leaving two open", async () => {
    render(<Harness />);
    await waitFor(() => expect(sockets).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => expect(sockets).toHaveLength(2));
    expect(sockets[0].disconnect).toHaveBeenCalled();
  });

  it("does not connect at all without a token", async () => {
    auth = { user: { _id: "u1" }, token: null };
    render(
      <SocketProvider>
        <span>connected area</span>
      </SocketProvider>
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(io).not.toHaveBeenCalled();
  });
});
