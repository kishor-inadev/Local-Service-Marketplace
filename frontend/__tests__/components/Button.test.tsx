import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary-600');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Test</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Test</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies small size', () => {
    render(<Button size="sm">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-sm');
  });
});
