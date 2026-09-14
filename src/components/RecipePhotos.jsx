import React, { useEffect, useRef, useState } from "react";
import { CloseIcon, CameraIcon } from "./icons";
import { recipeThumbImage } from "../lib/images";
import { ACCEPT_ATTRIBUTE, MAX_PHOTOS, sortPhotos } from "../lib/recipeMedia";

/**
 * Choosing the photos on a recipe.
 *
 * Two shapes, because the two moments are genuinely different. Creating a
 * recipe has nowhere to upload to yet - the recipe has no id - so files are
 * held locally and the form uploads them once it has one. Editing a recipe
 * can upload and delete straight away.
 *
 * @param {object} props
 * @param {{_id?: string, publicId?: string, url: string}[]} props.existing
 *   Photos already on the recipe. Empty while creating.
 * @param {File[]} props.pending Files chosen but not uploaded yet.
 * @param {(files: File[]) => void} props.onPendingChange
 * @param {(mediaId: string) => Promise<void>} [props.onRemoveExisting]
 * @param {boolean} [props.busy]
 */
const RecipePhotos = ({
  existing = [],
  pending = [],
  onPendingChange,
  onRemoveExisting,
  busy = false,
}) => {
  const inputRef = useRef(null);
  const [problems, setProblems] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Object URLs are a leak if they are not revoked, and a stale one shows
  // the wrong picture. Rebuilt whenever the chosen files change.
  useEffect(() => {
    const urls = pending.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [pending]);

  const total = existing.length + pending.length;
  const full = total >= MAX_PHOTOS;

  const handleChoose = (event) => {
    const chosen = [...event.target.files];
    const { accepted, problems: rejected } = sortPhotos(chosen, total);
    setProblems(rejected);
    if (accepted.length) onPendingChange([...pending, ...accepted]);
    // Clearing it means choosing the same file twice in a row still fires
    // a change event, which is otherwise a confusing dead click.
    event.target.value = "";
  };

  const removePending = (index) => {
    onPendingChange(pending.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-strong mt-2 mb-1">Photos</h3>
      <p className="field__hint mb-2" id="recipe-photos-hint">
        Up to {MAX_PHOTOS}. JPEG, PNG or WebP, 8MB each. The first one is used
        as the cover.
      </p>

      {(existing.length > 0 || pending.length > 0) && (
        <ul className="photo-grid">
          {existing.map((item, index) => (
            <li key={item._id || item.publicId || index} className="photo-grid__item">
              <img src={recipeThumbImage(item.url)} alt="" loading="lazy" />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(item._id)}
                  disabled={busy}
                  className="photo-grid__remove"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <CloseIcon />
                </button>
              )}
            </li>
          ))}
          {pending.map((file, index) => (
            <li key={`${file.name}-${index}`} className="photo-grid__item">
              {previews[index] && <img src={previews[index]} alt="" />}
              <button
                type="button"
                onClick={() => removePending(index)}
                disabled={busy}
                className="photo-grid__remove"
                aria-label={`Remove ${file.name}`}
              >
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple
        onChange={handleChoose}
        className="sr-only"
        id="recipe-photos-input"
        aria-describedby="recipe-photos-hint"
      />
      <label htmlFor="recipe-photos-input" className={`btn-secondary${full || busy ? " is-disabled" : ""}`}>
        <CameraIcon size="1rem" />
        {total === 0 ? "Add photos" : "Add more"}
      </label>

      {full && (
        <p className="field__hint mt-1">
          That is the most a recipe can have. Remove one to add another.
        </p>
      )}

      {problems.length > 0 && (
        // Announced rather than only shown: the file picker has closed by
        // now and focus is back on the page, so a silent message would be
        // missed by anyone not looking at this spot.
        <ul className="field__error mt-2" role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecipePhotos;
