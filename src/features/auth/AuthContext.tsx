import { createContext, useContext, useState } from "react";

interface AuthContextType {
  apiKey: string | null;
  setApiKey: (key: string | null, remember: boolean) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    return localStorage.getItem("jules_api_key");
  });

  const setApiKey = (key: string | null, remember: boolean) => {
    setApiKeyState(key);
    if (key && remember) {
      localStorage.setItem("jules_api_key", key);
    } else {
      localStorage.removeItem("jules_api_key");
    }
  };

  return (
    <AuthContext.Provider value={{ apiKey, setApiKey, isAuthenticated: !!apiKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
