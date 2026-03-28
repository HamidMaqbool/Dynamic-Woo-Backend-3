
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  // Convert kebab-case to PascalCase for Lucide icons
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const LucideIcon = (LucideIcons as any)[pascalName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;

  return (
    <LucideIcon 
      className={className} 
      size={size} 
    />
  );
};

export const IconSprite: React.FC = () => {
  return null;
};
