declare module 'theme-tenant-alpha' {
  import type React from 'react'

  export type ThemeConfig = {
    name: string
    tokens: Record<string, string>
  }

  export type BrandButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode
  }

  export type BrandCardProps = React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode
  }

  export const BrandButton: React.ComponentType<BrandButtonProps>
  export const BrandCard: React.ComponentType<BrandCardProps>

  const themeConfig: ThemeConfig
  export default themeConfig
}
