import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  currentRestaurantId: number | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  setCurrentRestaurant: (restaurantId: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  isFromSameRestaurant: (restaurantId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initialization
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const [currentRestaurantId, setCurrentRestaurantId] = useState<number | null>(() => {
    // Load current restaurant from localStorage
    try {
      const savedRestaurant = localStorage.getItem('currentRestaurantId');
      return savedRestaurant ? parseInt(savedRestaurant) : null;
    } catch (error) {
      console.error('Error loading current restaurant from localStorage:', error);
      return null;
    }
  });

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      // If this is a different restaurant, clear the cart first
      if (currentRestaurantId !== null && currentRestaurantId !== item.restaurantId) {
        return [{ ...item, quantity: 1 }];
      }
      
      const existingItem = prevItems.find(i => i.id === item.id);
      
      if (existingItem) {
        return prevItems.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const setCurrentRestaurant = (restaurantId: number) => {
    // If switching to a different restaurant, clear the cart
    if (currentRestaurantId !== null && currentRestaurantId !== restaurantId) {
      setItems([]);
    }
    setCurrentRestaurantId(restaurantId);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const isFromSameRestaurant = (restaurantId: number) => {
    if (currentRestaurantId === null) return true; // No items in cart yet
    return currentRestaurantId === restaurantId;
  };

  // Save cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  // Save current restaurant to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentRestaurantId !== null) {
        localStorage.setItem('currentRestaurantId', currentRestaurantId.toString());
      } else {
        localStorage.removeItem('currentRestaurantId');
      }
    } catch (error) {
      console.error('Error saving current restaurant to localStorage:', error);
    }
  }, [currentRestaurantId]);

  const value = {
    items,
    currentRestaurantId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCurrentRestaurant,
    getTotalPrice,
    getTotalItems,
    isFromSameRestaurant,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
