import React from 'react';

export default function ActionButton({ children, onClick, type = 'button', variant = 'primary', size = 'md', className = '', ...props }){
  const base = `inline-flex items-center justify-center gap-2 font-medium rounded-lg transition focus:outline-none`;
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  const variants = {
    primary: 'bg-primary text-white shadow-md hover:bg-primary-dark',
    ghost: 'bg-transparent border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    // ensure outline buttons have readable text and border in dark mode
    outline: 'bg-transparent border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-100'
  };

  const cls = [base, sizes[size] || sizes.md, variants[variant] || variants.primary, className].join(' ');
  return (
    <button type={type} onClick={onClick} className={cls} {...props}>
      {children}
    </button>
  );
}
