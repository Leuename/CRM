import React from "react";

const TONE = {
  default: "var(--outline-resting)",
  active: "var(--primary)",
  error: "var(--secondary-red)",
  success: "var(--secondary-blue)",
};

// Boxed text field: white fill, 1px border, 10px radius, 40px tall, dark label
// above, 12px hint below (visual reference). The kit ships no
// stylesheet, so the values live inline here and are mirrored by the
// `.crm-field` block in apps/web/app/globals.css — change both together.
// Focus is tracked in state because an inline style cannot express `:focus`.
export function Input({
  label = "Field title",
  value,
  placeholder = "Start typing…",
  state = "default",
  icon,
  disabled,
  hint,
  onChange,
  style,
  className,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const tone = disabled ? "var(--outline)" : TONE[state] || TONE.default;
  const isError = state === "error";
  // Focus paints the ring primary unless the field is already saying something
  // louder (error/success), which must stay readable while typing in it.
  const line =
    focused && !disabled && (state === "default" || state === "active")
      ? "var(--primary)"
      : tone;
  const autoId = React.useId();
  const inputId = rest.id ?? autoId; // honor a caller-supplied id, else generate one
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: 360,
        paddingTop: 10,
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      <label
        htmlFor={inputId}
        style={{
          display: "block",
          marginBottom: 6,
          font: "500 14px/21px var(--font-ui)",
          color: "var(--text-primary)",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          height: 40,
          boxSizing: "border-box",
          border: `1px solid ${line}`,
          borderRadius: "var(--radius-input)",
          boxShadow: focused && !disabled ? `inset 0 0 0 1px ${line}` : "none",
          background: "var(--bg-surface)",
          padding: "0 12px",
          transition:
            "border-color var(--dur-fast, 120ms) linear, box-shadow var(--dur-fast, 120ms) linear",
        }}
      >
        <input
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-primary)",
            padding: 0,
          }}
          {...rest}
          id={inputId}
          aria-invalid={isError || undefined}
          aria-describedby={hintId}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {icon && (
          <i
            className={icon}
            style={{
              fontSize: 18,
              color: state === "default" ? "var(--text-secondary)" : tone,
            }}
            aria-hidden="true"
          />
        )}
      </div>
      {hint && (
        <div
          id={hintId}
          aria-live={isError ? "polite" : undefined}
          aria-atomic={isError ? "true" : undefined}
          style={{
            marginTop: 6,
            font: "400 12px/18px var(--font-ui)",
            color: isError ? "var(--secondary-red)" : "var(--text-secondary)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
export default Input;
