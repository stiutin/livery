import React from 'react';

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
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background:
          hovered && !disabled ? 'var(--button-primary-background-hover)' : 'var(--button-primary-background)',
        color: 'var(--button-primary-text)',
        border: 0,
        borderRadius: 'var(--button-radius)',
        padding: '12px 20px',
        fontWeight: 700,
        fontSize: '0.95rem',
        lineHeight: 1.2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        outline: focused && !disabled ? '2px solid var(--color-focus)' : 'none',
        outlineOffset: 2,
        transition: 'background var(--duration-fast) ease, opacity var(--duration-fast) ease',
        userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
