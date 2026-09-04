import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// A single-page app keeps the same document across navigations, so the
// browser does none of the things it does on a real page load: the scroll
// offset stays where it was, and focus stays on whatever was clicked -
// which then unmounts. Both are noticeable. Clicking a link at the bottom
// of /terms used to open /privacy already scrolled two thousand pixels
// down, mid-sentence.
const RouteTransition = ({ mainId }) => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The first render is a real page load: the browser has already put
    // the viewport and focus where they belong, so leave both alone.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // POP is the back/forward button. The browser restores the previous
    // scroll offset itself, and overriding it would lose the reader's
    // place - the one case where keeping the offset is correct.
    if (navigationType !== "POP") {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (target) {
        target.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    }

    // Move focus to the main landmark so a screen reader announces the new
    // page, and so the next Tab continues from the top of the content
    // rather than from wherever the old link happened to be. preventScroll
    // keeps this from undoing the positioning just applied above.
    const main = document.getElementById(mainId);
    if (main) {
      main.focus({ preventScroll: true });
    }
  }, [pathname, hash, key, navigationType, mainId]);

  return null;
};

export default RouteTransition;
