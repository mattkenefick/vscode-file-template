import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ${filename:pascalcase} } from '../index';
import { ${filename:pascalcase}Type } from '../types';

// Sample data for stories
const sampleData: ${filename:pascalcase}Type[] = [
  {
    id: '${counter:start=1}',
    title: 'First ${filename:pascalcase}',
    description: 'This is the first ${filename:lowercase} item',
    createdAt: '${date:YYYY-MM-DD}T10:00:00Z',
  },
  {
    id: '${counter}',
    title: 'Second ${filename:pascalcase}',
    description: 'This is the second ${filename:lowercase} item with more details',
    metadata: {
      category: 'important',
      tags: ['critical', 'core']
    },
    createdAt: '${date:YYYY-MM-DD}T11:30:00Z',
  },
  {
    id: '${counter}',
    title: 'Third ${filename:pascalcase}',
    description: 'This is the third ${filename:lowercase} item with extensive description that might wrap to multiple lines in the UI',
    createdAt: '${date:YYYY-MM-DD}T14:15:00Z',
    updatedAt: '${date:YYYY-MM-DD}T15:00:00Z',
  },
  {
    id: '${counter}',
    title: 'Fourth ${filename:pascalcase}',
    metadata: {
      status: 'pending'
    },
    createdAt: '${date:YYYY-MM-DD}T16:45:00Z',
  },
];

const meta: Meta<typeof ${filename:pascalcase}> = {
  title: 'Compound/${filename:pascalcase}',
  component: ${filename:pascalcase},
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A compound component for ${filename:lowercase} management with header, content, and footer sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title of the component',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    data: {
      control: 'object',
      description: 'The data to display in the component',
    },
    onSelect: {
      action: 'selected',
      description: 'Called when an item is selected',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ${filename:pascalcase}>;

/**
 * Default story with sample data
 */
export const Default: Story = {
  args: {
    title: 'My ${filename:pascalcase} Collection',
    data: sampleData,
  },
};

/**
 * Empty state with no data
 */
export const Empty: Story = {
  args: {
    title: 'Empty ${filename:pascalcase} List',
    data: [],
  },
};

/**
 * With many items to demonstrate scrolling behavior
 */
export const ManyItems: Story = {
  args: {
    title: 'Large ${filename:pascalcase} Collection',
    data: Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i + 101}`,
      title: `${filename:pascalcase} Item ${i + 1}`,
      description: i % 2 === 0 ? `Description for item ${i + 1}` : undefined,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    })),
  },
};