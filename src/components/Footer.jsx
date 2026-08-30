import React from "react";
import { Link } from "react-router-dom";
import { SITE_NAME, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from "../lib/site";
import { MailIcon } from "./icons";

// Credits the third-party data sources the app pulls from. TheMealDB and
// TheCocktailDB both ask for attribution when you use their free API, and
// naming the source also tells readers where a given meal page's content
// actually came from.
const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div>
        <Link to="/" className="site-footer__brand" aria-label={`${SITE_NAME} home`}>
          {SITE_NAME}
        </Link>
        <p className="site-footer__note">Share your cooking, find your next meal.</p>

        {/* Rendered only when configured, so the site never ships a
            placeholder address or an invented phone number. */}
        {(CONTACT_EMAIL || CONTACT_PHONE) && (
          <ul className="site-footer__contact">
            {CONTACT_EMAIL && (
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <MailIcon size="0.9rem" /> {CONTACT_EMAIL}
                </a>
              </li>
            )}
            {CONTACT_PHONE && (
              <li>
                <a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE}</a>
              </li>
            )}
          </ul>
        )}
      </div>

      <nav aria-label="Browse">
        <p className="site-footer__heading">Browse</p>
        <ul>
          <li><Link to="/explore">Explore recipes</Link></li>
          <li><Link to="/popular-meals">Popular meals</Link></li>
          <li><Link to="/random-meal">Random meal</Link></li>
        </ul>
      </nav>

      <nav aria-label="Legal">
        <p className="site-footer__heading">Legal</p>
        <ul>
          <li><Link to="/terms">Terms of Service</Link></li>
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/accessibility">Accessibility</Link></li>
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

    <div className="site-footer__legal">
      <p>
        &copy; {new Date().getFullYear()} {SITE_NAME}. Recipe content from
        third-party sources remains the property of its respective owners.
      </p>
      <p>
        {SITE_NAME} does not run advertising and accepts no payment for featuring
        or ranking any recipe or product.
      </p>
    </div>
  </footer>
);

export default Footer;
