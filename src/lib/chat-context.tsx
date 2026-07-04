"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type SelectedCar = {
  id: string;
  brand: string;
  model: string;
  year: number;
  dailyRate: number;
  currency?: string;
};

type ChatContextType = {
  isOpen: boolean;
  selectedCar: SelectedCar | null;
  openWithCar: (car: SelectedCar) => void;
  clearSelectedCar: () => void;
  close: () => void;
  toggle: () => void;
};

const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  selectedCar: null,
  openWithCar: () => {},
  clearSelectedCar: () => {},
  close: () => {},
  toggle: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<SelectedCar | null>(null);

  const openWithCar = useCallback((car: SelectedCar) => {
    setSelectedCar(car);
    setIsOpen(true);
  }, []);

  const clearSelectedCar = useCallback(() => {
    setSelectedCar(null);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedCar(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) setSelectedCar(null);
  }, [isOpen]);

  return (
    <ChatContext.Provider value={{ isOpen, selectedCar, openWithCar, clearSelectedCar, close, toggle }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
