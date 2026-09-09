// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../src/context/AuthContext";
import Register from "../src/pages/Register";
import Login from "../src/pages/Login";

// The forms used to be three bare inputs with placeholders standing in for
// labels, and no checks at all - so every mistake cost a round trip to an
// API that, on free hosting, may have been asleep for the last quarter of
// an hour.

const renderWith = (ui, auth = {}) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{ login: vi.fn(), register: vi.fn(), fetchUserData: vi.fn(), ...auth }}
      >
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );

describe("the register form", () => {
  it("labels every field, so the name survives being filled in", () => {
    renderWith(<Register />);
    for (const label of [/username/i, /email/i, /password/i]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("tells the browser's password manager what each field is", () => {
    renderWith(<Register />);
    expect(screen.getByLabelText(/username/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("autocomplete", "new-password");
  });

  it("says what is wrong without asking the server", async () => {
    const register = vi.fn();
    const user = userEvent.setup();
    renderWith(<Register />, { register });

    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(register).not.toHaveBeenCalled();
    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/does not look like an email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
  });

  it("ties each message to its field for anyone not looking at it", async () => {
    const user = userEvent.setup();
    renderWith(<Register />);

    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const username = screen.getByLabelText(/username/i);
    expect(username).toHaveAttribute("aria-invalid", "true");
    const describedBy = username.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy.split(" ")[0])).toHaveTextContent(
      /at least 3 characters/i
    );
  });

  it("clears a message as soon as the field is being fixed", async () => {
    const user = userEvent.setup();
    renderWith(<Register />);

    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/username/i), "c");
    expect(screen.queryByText(/at least 3 characters/i)).not.toBeInTheDocument();
  });

  it("submits a valid form, trimmed", async () => {
    const register = vi.fn().mockResolvedValue({});
    const login = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    renderWith(<Register />, { register, login });

    await user.type(screen.getByLabelText(/username/i), "  marta_cooks  ");
    await user.type(screen.getByLabelText(/email/i), "marta@example.com");
    await user.type(screen.getByLabelText(/password/i), "long-enough");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(register).toHaveBeenCalledWith("marta_cooks", "marta@example.com", "long-enough");
  });

  it("shows a server refusal as an alert", async () => {
    const register = vi.fn().mockRejectedValue(new Error("Username already in use"));
    const user = userEvent.setup();
    renderWith(<Register />, { register });

    await user.type(screen.getByLabelText(/username/i), "marta");
    await user.type(screen.getByLabelText(/email/i), "marta@example.com");
    await user.type(screen.getByLabelText(/password/i), "long-enough");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already in use/i);
  });
});

describe("the login form", () => {
  it("is labelled and tells the password manager it is a sign-in", () => {
    renderWith(<Login />);
    expect(screen.getByLabelText(/username/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
  });

  // Applying the new-account rules to an existing password would be both
  // wrong for anyone who registered before them and a hint about what is
  // stored.
  it("does not judge the shape of an existing password", async () => {
    const login = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    renderWith(<Login />, { login });

    await user.type(screen.getByLabelText(/username/i), "marta");
    await user.type(screen.getByLabelText(/password/i), "old");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(login).toHaveBeenCalledWith("marta", "old");
  });
});
