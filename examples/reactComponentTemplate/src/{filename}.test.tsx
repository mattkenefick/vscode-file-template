import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ${filename:pascalcase} } from './{filename}';

describe('${filename:pascalcase} Component', () => {
  const mockOnChange = jest.fn();
  const mockInitialData = { test: 'data', id: ${counter:start=100} };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders the component with initial data', async () => {
    render(
      <${filename:pascalcase} 
        initialData={mockInitialData} 
        onChange={mockOnChange} 
      />
    );

    // Check if component title is rendered
    expect(screen.getByText('${filename:pascalcase} Component')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check if data is displayed
    expect(screen.getByText(/"test": "data"/)).toBeInTheDocument();
    expect(screen.getByText(/"id": ${counter:start=100}/)).toBeInTheDocument();
  });

  it('handles data updates correctly', async () => {
    render(
      <${filename:pascalcase} 
        initialData={mockInitialData} 
        onChange={mockOnChange} 
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click the update button
    fireEvent.click(screen.getByText('Update Data'));

    // Check if onChange was called with updated data
    expect(mockOnChange).toHaveBeenCalled();
    
    // Verify that the updated data contains lastUpdated field
    const updatedData = mockOnChange.mock.calls[0][0];
    expect(updatedData).toHaveProperty('test', 'data');
    expect(updatedData).toHaveProperty('id', ${counter});
    expect(updatedData).toHaveProperty('lastUpdated');
  });

  it('handles errors correctly', async () => {
    // Mock console.error to prevent expected error messages during test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock failed fetch
    jest.spyOn(global, 'Promise').mockImplementationOnce(() => {
      return {
        then: () => {
          throw new Error('Failed to load data');
        }
      } as any;
    });

    render(<${filename:pascalcase} />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    // Restore console.error
    console.error = originalConsoleError;
  });

  // Add more tests as needed for your specific component functionality
});