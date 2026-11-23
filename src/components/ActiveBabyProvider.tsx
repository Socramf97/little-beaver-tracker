import { createContext, useState } from "react";

// Describes what data and functions will be shared with the rest
// of the app. Any screen can read the selected baby or update it.
interface ActiveBabyContextType {
  activeBaby: any;
  setActiveBaby: (baby: any) => void;
}

// Starts as undefined until the provider wraps the app.
// The hook will check for this and show a helpful error
// if someone tries to use it incorrectly.
export const ActiveBabyContext =
  createContext<ActiveBabyContextType | undefined>(
    undefined
  );

// Keeps track of the currently selected baby and makes it
// available to every screen inside the provider.
export function ActiveBabyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeBaby, setActiveBaby] = useState<any>(null);

  return (
    <ActiveBabyContext.Provider
      value={{
        activeBaby,
        setActiveBaby,
      }}
    >
      {children}
    </ActiveBabyContext.Provider>
  );
}
