import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Seo from "../components/Seo";
import Reveal from "../components/Reveal";
import RecipeCard from "../components/RecipeCard";
import FeaturedRecipe from "../components/FeaturedRecipe";
import { asArray } from "../lib/apiShape";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "../lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: SITE_DESCRIPTION,
};

// Four routes in a four-cell grid, two wide and two narrow rather than
// four identical boxes in a row. The wide pair is where most people
// actually want to start.
const STARTING_POINTS = [
  {
    to: "/explore",
    title: "Everything members posted",
    body: "Every recipe on the site, newest first.",
    wide: true,
  },
  {
    to: "/cuisines",
    title: "By cuisine",
    body: "Pick a country, see its dishes.",
  },
  {
    to: "/ingredients",
    title: "By ingredient",
    body: "Start from the cupboard.",
  },
  {
    to: "/random-meal",
    title: "Pick something for me",
    body: "One dish at a time until one looks good.",
    wide: true,
  },
];

// One for the hero, four for the strip below it.
const FETCH_COUNT = 5;

const Home = () => {
  const [latest, setLatest] = useState([]);
  // Whether the answer is in yet, which is not the same question as
  // whether there is anything in it. The hero holds the feature column
  // open while the answer is outstanding, so the copy beside it does not
  // recentre when a recipe lands. A site with genuinely no recipes gives
  // the space back once, which is honest - there is nothing to show.
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    API.get("/recipes", { params: { sort: "newest", limit: FETCH_COUNT } })
      .then((res) => {
        if (!cancelled) setLatest(asArray(res.data?.recipes).slice(0, FETCH_COUNT));
      })
      // Silent. The page is a working introduction to the site without a
      // single recipe on it, and a red banner across the front page
      // because a secondary strip did not load is worse than the strip
      // not being there.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [featured, ...rest] = latest;

  return (
    <>
      <Seo
        title="Share and Discover Recipes"
        description="Post the recipes you cook and save the ones you want to try next. Follow other home cooks, and browse dishes and drinks by category or at random."
        structuredData={structuredData}
      />

      {/* Split rather than centred, and weighted towards the copy. The
          right-hand column is the newest real recipe on the site, not an
          illustration of one: the fastest way to say what this place is
          for is to show something somebody cooked. When there is nothing
          to show yet, the grid collapses to the copy alone. */}
      <section className="hero hero--home">
        <div className="hero__grid">
          <div className="hero__content">
            <p className="hero__eyebrow">Recipes from home cooks</p>
            <h1 className="hero__title">Keep every recipe you actually cook.</h1>
            <p className="hero__lede">
              Post what you make, save what you want to try next, and follow the cooks
              whose food you want to eat.
            </p>
            <div className="hero__actions">
              <Link to="/register" className="btn-primary btn-lg">
                Create account
              </Link>
              <Link to="/explore" className="btn-secondary btn-lg">
                Browse recipes
              </Link>
            </div>
          </div>

          {featured ? (
            <div className="hero__feature">
              <FeaturedRecipe recipe={featured} />
            </div>
          ) : (
            !settled && (
              <div className="hero__feature" aria-hidden="true">
                <div className="featured featured--pending">
                  <div className="featured__media skeleton" />
                  <div className="featured__body">
                    <p className="featured__label skeleton-line skeleton-line--label" />
                    <p className="featured__title skeleton-line skeleton-line--title" />
                    <div className="featured__meta">
                      <span className="skeleton-line skeleton-line--meta" />
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="page-container max-w-6xl">
        <Reveal>
          <h2 className="page-title mb-2">Somewhere to start</h2>
          <p className="page-lede mb-8">You do not need an account to look around.</p>
        </Reveal>

        <ul className="start-grid">
          {STARTING_POINTS.map((point, index) => (
            <Reveal
              as="li"
              key={point.to}
              delay={index * 60}
              className={point.wide ? "start-grid__wide" : undefined}
            >
              <Link
                to={point.to}
                className={`start-card${point.wide ? " start-card--wide" : ""}`}
              >
                <span className="start-card__title">{point.title}</span>
                <span className="start-card__body">{point.body}</span>
                <span className="start-card__cue" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Nothing is reserved for this while it loads and nothing is shown
          if it comes back empty. A new site genuinely has no recipes yet,
          and four skeletons resolving into "no recipes" says less than the
          four routes above already say. */}
      {rest.length > 0 && (
        <section className="page-container max-w-6xl pt-0">
          <Reveal>
            <div className="section-heading">
              <div>
                <h2 className="page-title mb-2">Also new</h2>
                <p className="page-lede">The rest of what members posted recently.</p>
              </div>
              <Link to="/explore" className="section-heading__link">
                All recipes <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            {rest.map((recipe, index) => (
              <Reveal key={recipe._id} delay={index * 60}>
                <RecipeCard recipe={recipe} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
