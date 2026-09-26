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
        background: 'var(--card-background)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        padding: '20px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
