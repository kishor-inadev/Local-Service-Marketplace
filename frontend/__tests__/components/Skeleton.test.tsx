import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

describe('Skeleton Component', () => {
  it('renders single skeleton', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders multiple skeletons based on count', () => {
    const { container } = render(<Skeleton count={3} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('applies different variants', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('renders SkeletonCard component', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.border')).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={200} height={100} />);
    const skeleton = container.querySelector('.animate-pulse') as HTMLElement;
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('100px');
  });
});
