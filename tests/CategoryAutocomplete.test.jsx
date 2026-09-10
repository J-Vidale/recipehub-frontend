// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CategoryAutocomplete from "../src/components/CategoryAutocomplete";
import API from "../src/services/api";

// This component sits on Create Recipe, the app's primary action. It
// lower-cases every suggestion's name to compare against what has been
// typed, so a single entry without a usable name threw inside render and
// replaced the whole page with the error boundary. asArray guarantees a
// list; it guarantees nothing about what is in it.

const respond = (data) => vi.spyOn(API, "get").mockResolvedValue({ data });

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const show = () => render(<CategoryAutocomplete value="" onChange={() => {}} />);

// The list only exists once the field has focus, which is also the only
// moment the crash could ever have happened.
const settle = async (container) => {
  await vi.advanceTimersByTimeAsync(400);
  fireEvent.focus(container.querySelector("input"));
  await vi.advanceTimersByTimeAsync(50);
};

describe("suggestion shapes it has to survive", () => {
  it("renders the documented shape", async () => {
    respond({ curated: ["Dinner"], community: [{ name: "Weeknight", count: 4 }] });
    const { container } = show();
    await settle(container);
    await waitFor(() => expect(screen.getByText("Dinner")).toBeInTheDocument());
    expect(screen.getByText("Weeknight")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  // The community half as plain strings, which is what the curated half is.
  it("survives the two halves being swapped", async () => {
    respond({ curated: ["Dinner"], community: ["Weeknight"] });
    const { container } = show();
    await settle(container);
    await waitFor(() => expect(screen.getByText("Weeknight")).toBeInTheDocument());
  });

  it("drops an entry with no usable name rather than throwing", async () => {
    respond({ curated: ["Dinner", null, 42, { nope: 1 }], community: [{ count: 3 }, { name: "Weeknight", count: 2 }] });
    const { container } = show();
    await settle(container);
    await waitFor(() => expect(screen.getByText("Dinner")).toBeInTheDocument());
    expect(screen.getByText("Weeknight")).toBeInTheDocument();
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });

  it("shows no count when the count is missing or not a number", async () => {
    respond({ curated: [], community: [{ name: "Weeknight", count: "lots" }] });
    const { container } = show();
    await settle(container);
    await waitFor(() => expect(screen.getByText("Weeknight")).toBeInTheDocument());
    expect(screen.queryByText("lots")).not.toBeInTheDocument();
  });

  it.each([
    ["an empty body", {}],
    ["nulls", { curated: null, community: null }],
    ["an array where an object was expected", []],
  ])("renders with %s", async (_label, data) => {
    respond(data);
    const { container } = show();
    await settle(container);
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  it("keeps working when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(API, "get").mockRejectedValue(new Error("Server error"));
    const { container } = show();
    await settle(container);
    expect(container.querySelector("input")).toBeInTheDocument();
  });
});
