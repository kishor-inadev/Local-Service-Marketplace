import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState Component', () => {
  it('renders with title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <EmptyState
        title="No items"
        description="Try adjusting your filters"
      />
    );
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="No items"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('renders correct icon based on type', () => {
    const { container } = render(<EmptyState title="Test" icon="search" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
