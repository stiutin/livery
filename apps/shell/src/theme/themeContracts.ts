import type React from 'react';

export type BrandButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export type BrandCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export interface ThemeModule {
  BrandButton: React.ComponentType<BrandButtonProps>;
  BrandCard: React.ComponentType<BrandCardProps>;
}
