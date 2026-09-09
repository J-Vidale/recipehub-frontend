import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Seo from "../components/Seo";
import Reveal from "../components/Reveal";
import RecipeCard from "../components/RecipeCard";
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

const STARTING_POINTS = [
  {
    to: "/cuisines",
    title: "Browse by cuisine",
    body: "Pick a country or region and see the dishes filed under it.",
  },
  {
    to: "/ingredients",
    title: "Browse by ingredient",
    body: "Start from what is already in the cupboard and work backwards.",
  },
  {
    to: "/explore",
    title: "See what people posted",
    body: "Every recipe shared by members, newest first.",
  },
  {
    to: "/random-meal",
    title: "Pick something for me",
    body: "One dish at a time, reshuffled until something looks good.",
  },
];

const LATEST_COUNT = 4;

const Home = () => {
  const [latest, setLatest] = useState([]);

  // The home page used to be a headline and four links to other pages: a
  // site about food with no food on it. These are the same recipes Explore
  // opens with, so the request is one the visitor was likely to make in a
  // moment anyway.
  useEffect(() => {
    let cancelled = false;
    API.get("/recipes", { params: { sort: "newest", limit: LATEST_COUNT } })
      .then((res) => {
        if (!cancelled) setLatest(asArray(res.data?.recipes).slice(0, LATEST_COUNT));
      })
      // Silent on purpose. The rest of the page is a working introduction
      // to the site without this, and a red banner across the front page
      // because a secondary strip did not load is worse than the strip
      // simply not being there.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Seo
        title="Share and Discover Recipes"
        description="Post the recipes you cook and save the ones you want to try next. Follow other home cooks, and browse dishes and drinks by category or at random."
        structuredData={structuredData}
      />

      <section className="hero hero--home">
        {/* Two slow-drifting blurred shapes behind the text. Decorative
            only, so it is hidden from assistive tech, and the drift stops
            under prefers-reduced-motion without the colour going with it. */}
        <div className="hero__backdrop" aria-hidden="true">
          <span className="hero__blob hero__blob--one" />
          <span className="hero__blob hero__blob--two" />
        </div>

        <div className="hero__content">
          <span className="hero__eyebrow">Recipes from home cooks</span>
          <h1 className="hero__title">
            Keep every recipe
            <br />
            you cook in one place.
          </h1>
          <p className="hero__lede">
            Post what you make and save what you want to try next. Follow the cooks
            whose food you actually want to eat, and their new recipes show up in
            your feed.
          </p>
          <div className="hero__actions">
            <Link to="/register" className="btn-primary text-base px-7 py-3">
              Create an account
            </Link>
            <Link to="/login" className="btn-secondary text-base px-7 py-3">
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="page-container max-w-5xl">
        <Reveal>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Somewhere to start</h2>
          <p className="text-gray-600 mb-8">You do not need an account to look around.</p>
        </Reveal>

        <ul className="start-grid">
          {STARTING_POINTS.map((point, index) => (
            <Reveal as="li" key={point.to} delay={index * 70}>
              <Link to={point.to} className="start-card card-hover">
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

      {/* Nothing is reserved for this while it loads, and nothing is shown
          if it comes back empty. A new site genuinely has no recipes yet,
          and four skeleton cards that resolve into "no recipes" says less
          than the four routes above already say. */}
      {latest.length > 0 && (
        <section className="page-container max-w-5xl pt-0">
          <Reveal>
            <div className="section-heading">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Latest from the community
                </h2>
                <p className="text-gray-600">The most recent recipes members have posted.</p>
              </div>
              <Link to="/explore" className="section-heading__link">
                See all recipes <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            {latest.map((recipe, index) => (
              <Reveal key={recipe._id} delay={index * 70}>
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
