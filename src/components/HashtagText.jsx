import React from "react";
import { Link } from "react-router-dom";

const HASHTAG_PATTERN = /#([a-z0-9_]{1,50})/gi;

// Renders text with #hashtags turned into links to /tag/:tag, same idea as
// how a real platform makes hashtags in a caption clickable.
const HashtagText = ({ text, className }) => {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;
  const pattern = new RegExp(HASHTAG_PATTERN);

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const tag = match[1].toLowerCase();
    parts.push(
      <Link key={match.index} to={`/tag/${tag}`} className="text-green-700 hover:underline">
        #{match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <p className={className}>{parts}</p>;
};

export default HashtagText;
