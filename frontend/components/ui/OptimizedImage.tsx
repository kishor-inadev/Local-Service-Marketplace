import Image from 'next/image';
import { cn } from '@/utils/helpers';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  sizes?: string;
  onLoadingComplete?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  objectFit = 'cover',
  quality = 75,
  sizes,
  onLoadingComplete,
}: OptimizedImageProps) {
  const imageProps = {
    src,
    quality,
    priority,
    className: cn('transition-opacity duration-300', className),
    onLoadingComplete,
    ...(fill
      ? { fill: true, style: { objectFit } }
      : { width, height }),
    ...(sizes && { sizes }),
  };

  return <Image alt={alt} {...imageProps} />;
}

// Avatar with next/image
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}

export function AvatarImage({ 
  src, 
  alt, 
  size = 40, 
  className 
}: AvatarImageProps) {
  if (!src) return null;

  return (
    <div className={cn('relative overflow-hidden rounded-full', className)} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        quality={90}
      />
    </div>
  );
}
