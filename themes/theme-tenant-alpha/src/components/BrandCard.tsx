import React from 'react';

export function BrandCard({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {children: React.ReactNode}) {
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
        ...style,
      }}
    >
      {children}
    </div>
  );
}
