import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ${filename:pascalcase} } from './{filename}';

/**
 * ${filename:pascalcase} component Storybook configuration
 * Created: ${date:YYYY-MM-DD}
 * ID: ${uuid:short}
 */
const meta: Meta<typeof ${filename:pascalcase}> = {
  title: 'Components/${filename:pascalcase}',
  component: ${filename:pascalcase},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component for displaying and interacting with ${filename:lowercase} data.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialData: {
      control: 'object',
      description: 'Initial data to display in the component',
    },
    onChange: {
      action: 'changed',
      description: 'Called when data is updated',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    id: {
      control: 'text',
      description: 'HTML ID attribute',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ${filename:pascalcase}>;

/**
 * Default state with empty data
 */
export const Default: Story = {
  args: {},
};

/**
 * With pre-populated data
 */
export const WithData: Story = {
  args: {
    initialData: {
      id: '${counter:start=1000:padding=4}',
      name: 'Sample ${filename:pascalcase}',
      description: 'This is a sample ${filename:lowercase} component with data',
      createdAt: '${date:YYYY-MM-DDTHH:mm:ss}Z',
      status: 'active',
      tags: ['react', 'component', 'template'],
    },
  },
};

/**
 * Loading state demonstration
 */
export const Loading: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '*/api/${filename:lowercase}*',
        method: 'GET',
        status: 200,
        response: {},
        delay: 3000,
      },
    ],
  },
};

/**
 * Error state demonstration
 */
export const Error: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: '*/api/${filename:lowercase}*',
        method: 'GET',
        status: 500,
        response: { error: 'Failed to load data' },
      },
    ],
  },
};