import React from 'react'
import type { BrandButtonProps, BrandCardProps } from './themeContracts'

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
}: BrandButtonProps) {
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)

  return (
    <button
      {...props}
      disabled={disabled}
      className={className}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e) }}
      onFocus={(e) => { setFocused(true); onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: hovered && !disabled ? 'var(--brand-accent)' : 'var(--brand-primary)',
        color: 'white',
        border: 0,
        borderRadius: 12,
        padding: '12px 20px',
        fontWeight: 700,
        fontSize: '0.95rem',
        lineHeight: 1.2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
        boxShadow: focused && !disabled ? '0 0 0 3px var(--brand-accent, #60a5fa)' : 'none',
        transition: 'background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        userSelect: 'none',
        ...(style ?? {}),
      }}
    >
      {children}
    </button>
  )
}

export function BrandCard({
  children,
  className,
  style,
  ...props
}: BrandCardProps) {
  return (
    <div
      {...props}
      className={className}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        padding: '20px 24px',
        transition: 'box-shadow 0.15s ease',
        ...(style ?? {}),
      }}
    >
      {children}
    </div>
  )
}
