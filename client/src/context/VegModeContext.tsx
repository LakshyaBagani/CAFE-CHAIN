import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VegModeContextType {
  vegMode: boolean;
  setVegMode: (vegMode: boolean) => void;
}

const VegModeContext = createContext<VegModeContextType | undefined>(undefined);

export const useVegMode = () => {
  const context = useContext(VegModeContext);
  if (context === undefined) {
    throw new Error('useVegMode must be used within a VegModeProvider');
  }
  return context;
};

interface VegModeProviderProps {
  children: ReactNode;
}

export const VegModeProvider: React.FC<VegModeProviderProps> = ({ children }) => {
  const [vegMode, setVegMode] = useState(false);

  return (
    <VegModeContext.Provider value={{ vegMode, setVegMode }}>
      {children}
    </VegModeContext.Provider>
  );
};
