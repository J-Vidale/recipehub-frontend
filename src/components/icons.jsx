import React from "react";

// Inline SVG icon set replacing the emoji and typographic glyphs the UI
// used to render. Emoji render inconsistently across platforms (and some
// are missing entirely on Windows/Linux), don't inherit text colour, and
// are announced by screen readers with their unicode name. These draw in
// currentColor at 1em, so they take the size and colour of surrounding
// text like any other glyph would.
//
// Every icon is decorative: the visible label beside it (or the button's
// own aria-label) carries the meaning, so they are hidden from assistive
// technology by default.

const Svg = ({ children, className = "", size = "1em", filled = false, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`icon ${className}`}
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

export const HeartIcon = ({ filled = false, ...props }) => (
  <Svg filled={filled} {...props}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </Svg>
);

export const ShareIcon = (props) => (
  <Svg {...props}>
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <path d="M16 6l-4-4-4 4" />
    <path d="M12 2v14" />
  </Svg>
);

export const BellIcon = (props) => (
  <Svg {...props}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const MailIcon = (props) => (
  <Svg {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </Svg>
);

export const PinIcon = (props) => (
  <Svg {...props}>
    <path d="M12 17v5" />
    <path d="M9 10.8V4h6v6.8l2 3.2H7l2-3.2z" />
  </Svg>
);

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const ArrowLeftIcon = (props) => (
  <Svg {...props}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Svg>
);

export const CameraIcon = (props) => (
  <Svg {...props}>
    <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </Svg>
);

// Used where a recipe has no photo yet, and on the 404 page.
export const UtensilsIcon = (props) => (
  <Svg {...props}>
    <path d="M7 2v8a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 2 10V2" />
    <path d="M4.5 2v10.5M4.5 12.5V22" />
    <path d="M17.5 2C16 2 15 4 15 7.5s1 4.5 2.5 4.5S20 11 20 7.5 19 2 17.5 2z" />
    <path d="M17.5 12v10" />
  </Svg>
);
