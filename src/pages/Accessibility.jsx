import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { SITE_NAME, CONTACT_EMAIL } from "../lib/site";

const LAST_UPDATED = "30 August 2026";

const Accessibility = () => (
  <div className="page-container max-w-3xl legal">
    <Seo
      title="Accessibility Statement"
      description={`How ${SITE_NAME} approaches accessibility, what has been implemented, what is still outstanding, and how to report a barrier.`}
    />
    <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Accessibility" }]} />

    <h1>Accessibility Statement</h1>
    <p className="legal__meta">Last updated: {LAST_UPDATED}</p>

    <p>
      {SITE_NAME} should be usable by everyone, including people who browse with
      a keyboard, a screen reader, magnification, or reduced motion enabled. We
      aim to meet the{" "}
      <a
        href="https://www.w3.org/WAI/WCAG22/quickref/"
        target="_blank"
        rel="noreferrer noopener"
      >
        Web Content Accessibility Guidelines (WCAG) 2.2
      </a>{" "}
      at Level AA.
    </p>

    <h2>What is in place</h2>
    <ul>
      <li>Every page has one descriptive heading, in a logical heading order.</li>
      <li>
        All interactive controls are reachable and operable by keyboard, with a
        visible focus outline that only appears for keyboard use.
      </li>
      <li>
        Icon-only controls (notifications, messages, menu, remove, photo upload)
        carry text labels for assistive technology.
      </li>
      <li>
        Images of food carry descriptive alternative text. Decorative images,
        including avatars shown next to a visible username, are correctly hidden
        from screen readers so their names are not announced twice.
      </li>
      <li>
        Action feedback is delivered in a polite live region, so confirmations
        and errors are announced without interrupting.
      </li>
      <li>
        Motion (card hover lifts, toast entrances, the shimmer on loading
        placeholders) is disabled automatically when your system is set to
        reduce motion.
      </li>
      <li>
        Layouts reflow to a single column on small screens with no horizontal
        scrolling, and the menu button meets the minimum 44×44px touch target.
      </li>
      <li>
        Body text and interface colours are chosen for contrast against their
        backgrounds.
      </li>
    </ul>

    <h2>Known gaps</h2>
    <p>
      We would rather name these than imply full conformance:
    </p>
    <ul>
      <li>
        The site has not yet been audited end to end by a third party, or tested
        against the full range of screen readers.
      </li>
      <li>
        Embedded cooking videos are provided by YouTube. Caption availability and
        player accessibility are controlled by YouTube and the video's uploader,
        not by us.
      </li>
      <li>
        Recipe photos are uploaded by members; where a member does not describe
        their photo, its alternative text falls back to the recipe title rather
        than a description of the image.
      </li>
      <li>
        Horizontally scrolling rows of recipe cards can be scrolled with a
        keyboard by tabbing through the cards, but do not yet offer explicit
        previous and next controls.
      </li>
    </ul>

    <h2>Reporting a barrier</h2>
    <p>
      If something on {SITE_NAME} prevents you from doing what you came to do, we
      want to hear about it, and we will treat it as a bug rather than a
      suggestion. Please tell us the page, what you were trying to do, and the
      browser or assistive technology you were using.
    </p>
    {CONTACT_EMAIL ? (
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ) : (
      <p>
        You can reach us through the report control on any recipe or profile
        page.
      </p>
    )}

    <p className="legal__related">
      See also our <Link to="/terms">Terms of Service</Link> and{" "}
      <Link to="/privacy">Privacy Policy</Link>.
    </p>
  </div>
);

export default Accessibility;
