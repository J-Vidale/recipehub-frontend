import React from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { SITE_NAME, CONTACT_EMAIL } from "../lib/site";

const LAST_UPDATED = "30 August 2026";

const Terms = () => (
  <div className="page-container max-w-3xl legal">
    <Seo
      title="Terms of Service"
      description={`The terms that govern your use of ${SITE_NAME}, including account rules, content ownership, and acceptable use.`}
    />
    <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Terms of Service" }]} />

    <h1>Terms of Service</h1>
    <p className="legal__meta">Last updated: {LAST_UPDATED}</p>

    <p>
      These terms apply to your use of {SITE_NAME}. By creating an account or
      using the site, you agree to them. If you do not agree, please do not use
      the service.
    </p>

    <h2>1. Your account</h2>
    <p>
      You must provide accurate information when registering and are responsible
      for keeping your password secure and for activity that happens under your
      account. Tell us promptly if you believe someone else has accessed it. You
      must be old enough to form a binding contract where you live.
    </p>

    <h2>2. Content you post</h2>
    <p>
      You keep ownership of the recipes, photos, and comments you publish. By
      posting them you grant {SITE_NAME} a non-exclusive, worldwide, royalty-free
      licence to host, store, display, and distribute that content for the
      purpose of operating the service. You can withdraw this licence for a
      given item by deleting it.
    </p>
    <p>
      You confirm that you have the right to post what you upload, and that it
      does not infringe anyone else's copyright, trademark, or privacy rights.
      Do not upload photographs you did not take or do not have permission to
      use.
    </p>

    <h2>3. Acceptable use</h2>
    <p>You agree not to use {SITE_NAME} to:</p>
    <ul>
      <li>post unlawful, hateful, harassing, or deliberately misleading content;</li>
      <li>impersonate another person or misrepresent your affiliation with anyone;</li>
      <li>upload malware, or attempt to gain unauthorised access to the service or other accounts;</li>
      <li>scrape, or otherwise extract data at scale, without written permission;</li>
      <li>post spam or unsolicited commercial material.</li>
    </ul>
    <p>
      We may remove content or suspend accounts that breach these rules. You can
      report content using the report control on any recipe or profile.
    </p>

    <h2>4. Advertising, sponsorship, and endorsements</h2>
    <p>
      {SITE_NAME} does not currently display advertising, and we do not accept
      payment in exchange for featuring, ranking, or recommending any recipe,
      product, or brand. Rankings and recommendations are generated from
      community activity alone.
    </p>
    <p>
      If that changes, sponsored or paid placements will be clearly and
      conspicuously labelled as such at the point you encounter them, in line
      with the US Federal Trade Commission's Endorsement Guides.
    </p>
    <p>
      If you have a material connection to a brand, product, or business you
      mention in a recipe, comment, or profile - for example you were paid, given
      free product, or have any financial interest - you must disclose that
      clearly in the post itself. Do not post reviews or endorsements that
      misrepresent your honest opinion or experience.
    </p>

    <h2>5. Recipes are not professional advice</h2>
    <p>
      Recipes on {SITE_NAME} are submitted by members and by third-party
      databases. They are not reviewed by nutritionists, dietitians, or food
      safety professionals. Nutritional information, allergen information, and
      cooking times may be incomplete or inaccurate.
    </p>
    <p>
      You are responsible for checking ingredients against your own allergies and
      dietary needs and for following safe food handling and cooking practices.
      Nothing here is medical or dietary advice.
    </p>

    <h2>6. Third-party content</h2>
    <p>
      Meal and drink reference pages draw on data from{" "}
      <a href="https://www.themealdb.com" target="_blank" rel="noreferrer noopener">TheMealDB</a>{" "}
      and{" "}
      <a href="https://www.thecocktaildb.com" target="_blank" rel="noreferrer noopener">TheCocktailDB</a>.
      That content belongs to its respective owners and is shown subject to their
      terms. Embedded videos are served by YouTube and are governed by Google's
      terms and privacy policy.
    </p>

    <h2>7. Availability</h2>
    <p>
      The service is provided "as is" and "as available". We do not guarantee
      uninterrupted access, and we may change or discontinue features. To the
      fullest extent permitted by law, {SITE_NAME} is not liable for indirect or
      consequential loss arising from your use of the service.
    </p>

    <h2>8. Ending your use</h2>
    <p>
      You may stop using {SITE_NAME} at any time and delete your recipes. We may
      suspend or terminate accounts that repeatedly or seriously breach these
      terms.
    </p>

    <h2>9. Changes to these terms</h2>
    <p>
      We may update these terms as the service changes. The "last updated" date
      above will always reflect the current version, and material changes will be
      announced on the site.
    </p>

    <h2>10. Contact</h2>
    {CONTACT_EMAIL ? (
      <p>
        Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    ) : (
      <p>
        Questions about these terms can be raised through the report control on
        any recipe or profile page.
      </p>
    )}

    <p className="legal__related">
      See also our <Link to="/privacy">Privacy Policy</Link> and{" "}
      <Link to="/accessibility">Accessibility Statement</Link>.
    </p>
  </div>
);

export default Terms;
