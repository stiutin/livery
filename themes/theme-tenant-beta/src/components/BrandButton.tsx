import React from "react";

export function BrandButton({
  children,
  className,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  return (
    <button
      {...props}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        background:
          hovered && !disabled ? "var(--brand-accent)" : "var(--brand-primary)",
        color: "white",
        border: "1px solid transparent",
        borderRadius: 9999,
        padding: "12px 22px",
        fontWeight: 700,
        fontSize: "0.95rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        boxShadow: focused ? "0 0 0 3px rgba(45, 212, 191, 0.22)" : "none",
        transition:
          "background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
