import React from "react";
import { Link } from "react-router-dom";
import { SITE_NAME } from "../lib/site";

// Credits the third-party data sources the app pulls from. TheMealDB and
// TheCocktailDB both ask for attribution when you use their free API, and
// naming the source also tells readers where a given meal page's content
// actually came from.
const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div>
        <p className="site-footer__brand">{SITE_NAME}</p>
        <p className="site-footer__note">
          Share your cooking, find your next meal.
        </p>
      </div>

      <nav aria-label="Footer">
        <p className="site-footer__heading">Browse</p>
        <ul>
          <li><Link to="/explore">Explore recipes</Link></li>
          <li><Link to="/popular-meals">Popular meals</Link></li>
          <li><Link to="/random-meal">Random meal</Link></li>
        </ul>
      </nav>

      <div>
        <p className="site-footer__heading">Recipe sources</p>
        <ul>
          <li>
            Meal data from{" "}
            <a href="https://www.themealdb.com" target="_blank" rel="noreferrer noopener">
              TheMealDB
            </a>
          </li>
          <li>
            Drink data from{" "}
            <a href="https://www.thecocktaildb.com" target="_blank" rel="noreferrer noopener">
              TheCocktailDB
            </a>
          </li>
          <li>Community recipes are written by {SITE_NAME} members.</li>
        </ul>
      </div>
    </div>

    <p className="site-footer__legal">
      &copy; {new Date().getFullYear()} {SITE_NAME}. Recipe content from third-party
      sources remains the property of its respective owners.
    </p>
  </footer>
);

export default Footer;
