"use client";

import { createContext, useContext, useState } from "react";

interface TracerContextType {
  tracerOn: boolean;
  setTracerOn: (val: boolean) => void;
}

const TracerContext = createContext<TracerContextType>({
  tracerOn: false,
  setTracerOn: () => {},
});

export function TracerProvider({ children }: { children: React.ReactNode }) {
  const [tracerOn, setTracerOn] = useState(false);
  return (
    <TracerContext.Provider value={{ tracerOn, setTracerOn }}>
      {children}
    </TracerContext.Provider>
  );
}

export function useTracer() {
  return useContext(TracerContext);
}
