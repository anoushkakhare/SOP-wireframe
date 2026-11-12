import React from 'react';

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
}

export const Overlay: React.FC<OverlayProps> = ({ isOpen, onClick, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{ backgroundColor: 'rgba(26, 28, 46, 0.45)' }}
      className={`fixed inset-0 z-40 transition-opacity duration-200 ${className}`}
      onClick={onClick}
      aria-hidden="true"
    />
  );
};
