import React from "react";
import { Link } from "react-router-dom";

// A responsive grid of external meal/drink tiles, used by the cuisine and
// ingredient pages. The rail component next to this one is for a single
// scrollable row inside a larger page; this is for a whole page of
// results, where a wrapping grid reads better than a row you have to
// drag sideways.
//
// Cards stagger in rather than appearing all at once. The delay is capped
// so a 40-dish cuisine does not spend two seconds assembling itself: past
// the twelfth card everything shares the last step, which is off-screen
// anyway.
const STAGGER_STEP_MS = 40;
const MAX_STAGGER_STEPS = 12;

const MealGrid = ({ items, linkTo, emptyMessage = "Nothing here yet." }) => {
  if (!items || items.length === 0) {
    return <p className="text-gray-600">{emptyMessage}</p>;
  }

  return (
    <ul className="meal-grid">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="meal-grid__item"
          style={{
            "--stagger-delay": `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_MS}ms`,
          }}
        >
          <Link to={linkTo(item.id)} className="meal-grid__card card-hover">
            <div className="meal-grid__media">
              <img src={item.thumb} alt="" loading="lazy" />
            </div>
            <span className="meal-grid__title">{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default MealGrid;
