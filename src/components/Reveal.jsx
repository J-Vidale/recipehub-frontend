import { useEffect, useRef, useState } from "react";

// Fades a block in the first time it reaches the viewport, then stops
// watching it. Scroll-linked motion is easy to overdo, so this is
// deliberately small: one short fade with a little upward travel, once,
// never on the way back out. Re-animating on every scroll past is the
// thing that makes a page feel like a demo reel rather than a site.
//
// The element starts hidden only when the browser can actually run the
// observer and the reader has not asked for reduced motion. If either is
// false the content renders in its final state immediately, so nothing
// depends on JavaScript to become visible.
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Reveal = ({ children, className = "", delay = 0, as = "div" }) => {
  // Capitalised local rather than a renamed parameter: JSX usage is not
  // counted by no-unused-vars here (there is no jsx-uses-vars plugin),
  // and the config already ignores unused variables matching ^[A-Z_].
  const Tag = as;
  const ref = useRef(null);
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === "undefined" || prefersReducedMotion()
  );

  useEffect(() => {
    if (shown) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      // A small negative bottom margin means the fade starts just before
      // the block is fully on screen, so it has finished by the time the
      // reader's eye gets there instead of animating under their nose.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "is-revealed" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
