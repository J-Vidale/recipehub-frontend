// The like endpoints answer with the true count and whether the caller
// likes the thing. Both buttons flip optimistically first, so the only
// question on success is whether the answer is usable - and if it is not,
// the optimistic value is a better thing to keep than undefined rendered
// as "undefined likes".
//
// This codebase has been bitten by trusting a response shape before: a
// recipe page crashed on m.filter when a list read came back as something
// other than an array, which is why lib/apiShape.js exists. This is the
// same discipline applied to the two optimistic buttons.

/**
 * @param {unknown} data A like endpoint's response body.
 * @returns {{likeCount?: number, likedByMe?: boolean}} Only the fields
 *   that came back usable. Missing ones mean "keep what you have".
 */
export const likeResult = (data) => {
  const out = {};
  if (Number.isFinite(data?.likeCount)) out.likeCount = data.likeCount;
  if (typeof data?.likedByMe === "boolean") out.likedByMe = data.likedByMe;
  return out;
};
