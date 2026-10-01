import React, { useState } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base: { background: '#2563eb', color: '#ffffff', border: '1px solid transparent' },
    hover: { background: '#1e40af' },
  },
  secondary: {
    base: { background: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' },
    hover: { background: '#f9fafb' },
  },
  ghost: {
    base: { background: 'transparent', color: '#6b7280', border: '1px solid transparent' },
    hover: { color: '#111827' },
  },
  danger: {
    base: { background: '#dc2626', color: '#ffffff', border: '1px solid transparent' },
    hover: { background: '#b91c1c' },
  },
};

export default function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  icon,
  style,
  ...rest
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    outline: 'none',
    ...currentVariant.base,
    ...(isHovered && !disabled ? currentVariant.hover : {}),
    ...style,
  };

  return (
    <button
      type={type}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}
