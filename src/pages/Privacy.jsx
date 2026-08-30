import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { SITE_NAME, CONTACT_EMAIL } from "../lib/site";

const LAST_UPDATED = "30 August 2026";

const Privacy = () => (
  <div className="page-container max-w-3xl legal">
    <Seo
      title="Privacy Policy"
      description={`What data ${SITE_NAME} collects, why it is collected, who it is shared with, and the choices you have over it.`}
    />
    <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy Policy" }]} />

    <h1>Privacy Policy</h1>
    <p className="legal__meta">Last updated: {LAST_UPDATED}</p>

    <p>
      This policy explains what {SITE_NAME} collects, why, and what you can do
      about it. It covers the website only.
    </p>

    <h2>What we collect</h2>
    <ul>
      <li>
        <strong>Account details.</strong> Your username, email address, and a
        cryptographic hash of your password. We never store your password itself
        and cannot recover it.
      </li>
      <li>
        <strong>Content you create.</strong> Recipes, ingredients, instructions,
        hashtags, photos, comments, likes, saves, follows, and direct messages.
      </li>
      <li>
        <strong>Profile picture.</strong> Optional, and only if you upload one.
      </li>
      <li>
        <strong>Technical data.</strong> Your IP address and request metadata are
        processed transiently by our hosting provider to serve requests and to
        rate-limit sign-in attempts. We do not keep our own analytics logs.
      </li>
    </ul>

    <h2>What we do not collect</h2>
    <p>
      {SITE_NAME} does not run advertising, advertising trackers, or third-party
      analytics. We do not sell or rent your personal data, and we do not build
      advertising profiles.
    </p>

    <h2>Cookies and local storage</h2>
    <p>
      We do not use advertising or tracking cookies. Your browser's local storage
      holds your sign-in token and a cached copy of your own profile so you stay
      signed in between visits. Clearing your browser's site data signs you out
      and removes it.
    </p>

    <h2>Why we process this data</h2>
    <p>
      To operate your account, publish the content you choose to publish, deliver
      notifications and messages, keep the service secure, and prevent abuse.
      Our legal basis is performance of our agreement with you and our legitimate
      interest in running a safe service.
    </p>

    <h2>Who your data is shared with</h2>
    <p>We use a small number of processors, and only for the purposes below:</p>
    <ul>
      <li><strong>MongoDB Atlas</strong> - database hosting.</li>
      <li><strong>Render</strong> - application and website hosting.</li>
      <li><strong>Cloudinary</strong> - storage and delivery of uploaded images.</li>
      <li>
        <strong>YouTube (Google)</strong> - embedded cooking videos on reference
        meal pages. Loading one of those pages contacts Google, which may set
        its own cookies under Google's privacy policy. Videos are lazy-loaded, so
        this does not happen until an embed is near your viewport.
      </li>
    </ul>
    <p>
      Reference meal and drink data is fetched from TheMealDB and TheCocktailDB.
      These are read-only requests made by your browser; we do not send them any
      information about you beyond what a normal web request includes.
    </p>

    <h2>What other people can see</h2>
    <p>
      Your username, profile picture, published recipes, comments, and follower
      counts are public and may appear in search engines. Your email address is
      never shown publicly. Direct messages are visible only to you and the
      person you are messaging; they are not end-to-end encrypted, and are stored
      on our database so they can be delivered.
    </p>

    <h2>Retention</h2>
    <p>
      Content is kept until you delete it or close your account. Deleting a
      recipe also deletes its photos from our image host, along with its likes
      and comments.
    </p>

    <h2>Your choices</h2>
    <ul>
      <li>Edit or delete any recipe, comment, or photo you have posted.</li>
      <li>Add or remove your profile picture at any time.</li>
      <li>Block another member to stop them following or contacting you.</li>
      <li>
        Request a copy of your data, or deletion of your account and its content.
      </li>
    </ul>
    <p>
      Depending on where you live you may also have rights to correct, restrict,
      or object to processing, and to complain to a data protection authority.
    </p>

    <h2>Children</h2>
    <p>
      {SITE_NAME} is not directed at children under 13, and we do not knowingly
      collect their personal information. If you believe a child has created an
      account, contact us and we will remove it.
    </p>

    <h2>Security</h2>
    <p>
      Traffic is served over HTTPS, passwords are hashed with bcrypt, sign-in
      attempts are rate-limited, and access to your content is checked on every
      request. No online service can promise perfect security, but we take
      reasonable measures to protect your data.
    </p>

    <h2>Changes</h2>
    <p>
      If this policy changes, the "last updated" date above changes with it, and
      material changes will be announced on the site.
    </p>

    <h2>Contact</h2>
    {CONTACT_EMAIL ? (
      <p>
        For privacy questions or to request data access or deletion:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    ) : (
      <p>
        For privacy questions or to request data access or deletion, use the
        report control on any recipe or profile page.
      </p>
    )}

    <p className="legal__related">
      See also our <Link to="/terms">Terms of Service</Link> and{" "}
      <Link to="/accessibility">Accessibility Statement</Link>.
    </p>
  </div>
);

export default Privacy;
