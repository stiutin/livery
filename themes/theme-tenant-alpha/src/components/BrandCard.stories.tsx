import type {Meta, StoryObj} from '@storybook/react';

import {BrandButton} from './BrandButton';
import {BrandCard} from './BrandCard';

const meta: Meta<typeof BrandCard> = {
  title: 'Brand/BrandCard',
  component: BrandCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof BrandCard>;

export const Default: Story = {
  args: {children: 'Card content goes here.', style: {width: 320}},
};

export const WithTitle: Story = {
  render: () => (
    <BrandCard style={{width: 320}}>
      <h3 style={{margin: '0 0 8px', fontSize: '1rem'}}>Tenant Alpha</h3>
      <p style={{margin: 0, color: '#6b7280', fontSize: '0.875rem'}}>
        Branded card using CSS variable tokens - no hardcoded colours.
      </p>
    </BrandCard>
  ),
};

export const WithAction: Story = {
  render: () => (
    <BrandCard style={{width: 320}}>
      <h3 style={{margin: '0 0 6px', fontSize: '1rem'}}>Invoice created</h3>
      <p style={{margin: '0 0 16px', color: '#6b7280', fontSize: '0.875rem'}}>
        Invoice <strong>inv_001</strong> for <strong>$49.99 USD</strong>
      </p>
      <BrandButton style={{width: '100%'}}>Download PDF</BrandButton>
    </BrandCard>
  ),
};

export const NestedCards: Story = {
  render: () => (
    <BrandCard style={{width: 360, display: 'flex', flexDirection: 'column', gap: 12}}>
      <h3 style={{margin: '0 0 4px', fontSize: '1rem'}}>Billing summary</h3>
      {['Invoice #001 - $49.99', 'Invoice #002 - $120.00'].map((label) => (
        <BrandCard key={label} style={{padding: '10px 14px'}}>
          <span style={{fontSize: '0.875rem'}}>{label}</span>
        </BrandCard>
      ))}
    </BrandCard>
  ),
};
