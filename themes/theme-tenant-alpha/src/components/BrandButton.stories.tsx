import type {Meta, StoryObj} from '@storybook/react';
import {BrandButton} from './BrandButton';

const meta: Meta<typeof BrandButton> = {
  title: 'Brand/BrandButton',
  component: BrandButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof BrandButton>;

export const Primary: Story = {
  args: {children: 'Sign in'},
};

export const Disabled: Story = {
  args: {children: 'Unavailable', disabled: true},
};

export const Loading: Story = {
  args: {children: 'Creating invoice…', disabled: true},
};

export const WithIcon: Story = {
  args: {children: '→ Continue'},
};

export const FullWidth: Story = {
  args: {children: 'Create invoice', style: {width: '280px'}},
};
