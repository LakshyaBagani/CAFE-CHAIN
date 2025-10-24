import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: {
      container: 'px-2 py-1 space-x-1',
      button: 'w-5 h-5',
      icon: 'w-3 h-3',
      text: 'text-sm min-w-[16px]'
    },
    medium: {
      container: 'px-3 py-1.5 space-x-2',
      button: 'w-6 h-6',
      icon: 'w-4 h-4',
      text: 'text-sm min-w-[20px]'
    },
    large: {
      container: 'px-4 py-2 space-x-3',
      button: 'w-8 h-8',
      icon: 'w-5 h-5',
      text: 'text-base min-w-[24px]'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 ${classes.container} ${className}`}>
      <button
        onClick={onDecrease}
        className={`${classes.button} bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400`}
        aria-label="Decrease quantity"
      >
        <Minus className={`${classes.icon} text-white`} />
      </button>
      
      <span className={`${classes.text} font-medium text-gray-700 text-center`}>
        {quantity}
      </span>
      
      <button
        onClick={onIncrease}
        className={`${classes.button} bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400`}
        aria-label="Increase quantity"
      >
        <Plus className={`${classes.icon} text-white`} />
      </button>
    </div>
  );
};

export default QuantitySelector;
