// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecipeCard from "../src/components/RecipeCard";

const recipe = (overrides = {}) => ({
  _id: "r1",
  title: "Slow-roast tomato and white bean stew",
  category: "Dinner",
  media: [],
  user: { _id: "u1", username: "marta_cooks" },
  ...overrides,
});

const show = (r) =>
  render(
    <MemoryRouter>
      <RecipeCard recipe={r} />
    </MemoryRouter>
  );

describe("the engagement counts", () => {
  it("appear once there are some", () => {
    show(recipe({ likeCount: 42, commentCount: 4 }));
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  // A grid of new recipes each stamped "0" reads as a site nobody uses,
  // which is the wrong thing to say about a site that is simply new.
  it("say nothing rather than zero", () => {
    const { container } = show(recipe({ likeCount: 0, commentCount: 0 }));
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".recipe-card__stat")).toHaveLength(0);
  });

  it("shows only the count that exists", () => {
    const { container } = show(recipe({ likeCount: 7, commentCount: 0 }));
    expect(container.querySelectorAll(".recipe-card__stat")).toHaveLength(1);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("survives a response with no counts at all", () => {
    const { container } = show(recipe());
    expect(container.querySelectorAll(".recipe-card__stat")).toHaveLength(0);
  });

  // The number on its own is meaningless read aloud: the icon beside it is
  // decorative and announced as nothing.
  it("reads as words for a screen reader", () => {
    show(recipe({ likeCount: 1, commentCount: 5 }));
    expect(screen.getByText("1 like")).toBeInTheDocument();
    expect(screen.getByText("5 comments")).toBeInTheDocument();
  });

  it("ignores a count that is not a number", () => {
    const { container } = show(recipe({ likeCount: "many", commentCount: null }));
    expect(container.querySelectorAll(".recipe-card__stat")).toHaveLength(0);
  });
});

describe("the card itself", () => {
  it("links to the recipe", () => {
    show(recipe());
    expect(screen.getByRole("link")).toHaveAttribute("href", "/recipes/r1");
  });

  it("falls back to an initial when there is no photo", () => {
    const { container } = show(recipe({ title: "Focaccia" }));
    expect(container.querySelector(".recipe-card__placeholder")).toHaveTextContent("F");
  });
});
