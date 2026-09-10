import React, { useId } from "react";

// A labelled form field.
//
// The auth forms used a bare input with a placeholder standing in for a
// label. Two problems with that: the label vanishes the moment anyone
// types, so a half-filled form stops saying what its fields are, and a
// placeholder is not reliably announced as the field's name - some screen
// readers read it, some read nothing at all.
//
// The error is tied to the input with aria-describedby rather than left
// floating next to it, so it is read out when the field takes focus
// instead of only being visible.

const Field = ({
  label,
  name,
  type = "text",
  as = "input",
  value,
  onChange,
  error,
  hint,
  autoComplete,
  required = true,
  ...rest
}) => {
  const id = useId();
  const Control = as;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <Control
        id={id}
        name={name}
        {...(as === "input" ? { type } : {})}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        className={`input${error ? " input--invalid" : ""}`}
        {...rest}
      />
      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
