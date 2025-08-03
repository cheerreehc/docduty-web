import { createContext, useContext, useState } from 'react';

export type ShiftData = {
  [date: string]: {
    [dutyType: string]: string[]; // doctor IDs
  };
};

type ShiftContextType = {
  shifts: ShiftData;
  setShifts: React.Dispatch<React.SetStateAction<ShiftData>>;
  updateShift: (date: string, dutyType: string, doctorList: string[]) => void;
  clearShifts: () => void;
};

const LocalShiftContext = createContext<ShiftContextType | null>(null);

export const LocalShiftProvider = ({ children }: { children: React.ReactNode }) => {
  const [shifts, setShifts] = useState<ShiftData>({});

  const updateShift = (date: string, dutyType: string, doctorList: string[]) => {
    setShifts(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [dutyType]: doctorList,
      },
    }));
  };

  const clearShifts = () => {
    setShifts({});
  };

  return (
    <LocalShiftContext.Provider value={{ shifts, setShifts, updateShift, clearShifts }}>
      {children}
    </LocalShiftContext.Provider>
  );
};

export const useLocalShift = () => {
  const context = useContext(LocalShiftContext);
  if (!context) throw new Error('useLocalShift must be used inside LocalShiftProvider');
  return context;
};
