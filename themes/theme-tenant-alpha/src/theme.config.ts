import type { ThemeConfig } from './themeTypes'

export const themeConfig: ThemeConfig = {
  name: 'tenant-alpha',
  tokens: {
    '--brand-primary': '#5B21B6',
    '--brand-primary-variant': '#7C3AED',
    '--brand-accent': '#06B6D4',
    '--brand-accent-2': '#F472B6',
    '--brand-gradient': 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))',
    '--card-bg': '#FFFFFF',
    '--card-bg-soft': 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,246,255,0.98))',
    '--card-border': 'rgba(91, 33, 182, 0.14)',
    '--text': '#0f172a',
    '--muted': '#6b7280',
    '--success': '#10B981',
    '--info': '#06B6D4',
    '--danger': '#EF4444',
    '--shadow-elev-1': '0 6px 18px rgba(16,24,40,0.08)',
  }
}

export default themeConfig


