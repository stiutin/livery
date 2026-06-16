import React from "react";

export function BrandCard({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) {
  return (
    <div
      {...props}
      className={className}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 18,
        padding: "22px 26px",
        boxShadow: "0 15px 30px rgba(15, 118, 110, 0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
