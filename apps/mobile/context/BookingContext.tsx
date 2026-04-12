import { createContext, useContext, useMemo, useState } from "react";

export type ServiceSelection = {
  id: string;
  name: string;
  basePrice: number | null;
  durationMinutes: number;
};

export type BarberSelection = {
  id: string;
  displayName: string;
};

export type DateSelection = {
  id: string;
  label: string;
  detail: string;
  date: Date;
};

export type SlotSelection = {
  startAt: string;
  endAt: string;
  label: string;
};

type BookingContextValue = {
  selectedService?: ServiceSelection;
  selectedBarber?: BarberSelection;
  selectedDate?: DateSelection;
  selectedSlot?: SlotSelection;
  setService: (service: ServiceSelection) => void;
  setBarber: (barber: BarberSelection) => void;
  setDate: (date: DateSelection) => void;
  setSlot: (slot: SlotSelection) => void;
  resetBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selectedService, setSelectedService] =
    useState<ServiceSelection>();
  const [selectedBarber, setSelectedBarber] = useState<BarberSelection>();
  const [selectedDate, setSelectedDate] = useState<DateSelection>();
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection>();

  const setService = (service: ServiceSelection) => {
    setSelectedService(service);
    setSelectedBarber(undefined);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
  };

  const setBarber = (barber: BarberSelection) => {
    setSelectedBarber(barber);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
  };

  const setDate = (date: DateSelection) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
  };

  const setSlot = (slot: SlotSelection) => {
    setSelectedSlot(slot);
  };

  const resetBooking = () => {
    setSelectedService(undefined);
    setSelectedBarber(undefined);
    setSelectedDate(undefined);
    setSelectedSlot(undefined);
  };

  const value = useMemo(
    () => ({
      selectedService,
      selectedBarber,
      selectedDate,
      selectedSlot,
      setService,
      setBarber,
      setDate,
      setSlot,
      resetBooking,
    }),
    [selectedService, selectedBarber, selectedDate, selectedSlot]
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}
