import React from "react";
import { Link } from "react-router-dom";
import { absoluteUrl } from "../lib/site";

/**
 * Visible breadcrumb trail plus its matching BreadcrumbList structured
 * data, so the path is clear to both readers and search engines.
 *
 * @param {{label: string, to?: string}[]} items Ordered crumbs, root
 *   first. The final crumb is the current page and should omit `to`.
 */
const Breadcrumbs = ({ items }) => {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.to ? { item: absoluteUrl(item.to) } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`}>
                {item.to && !isLast ? (
                  <Link to={item.to}>{item.label}</Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                )}
                {!isLast && (
                  <span className="breadcrumbs__sep" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        // Breadcrumb JSON-LD is page-structural and rendered inline with
        // the trail itself, separate from the single route-level graph
        // that <Seo> manages.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
};

export default Breadcrumbs;
