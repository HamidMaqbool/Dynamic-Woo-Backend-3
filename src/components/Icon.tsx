
import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <use xlinkHref={`/icons.svg#icon-${name}`} />
    </svg>
  );
};

export const IconSprite: React.FC = () => {
  return null;
};
