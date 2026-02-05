import { createContext, useContext, useState, useEffect } from "react";
import { 
  getSecureApiKey, 
  setSecureApiKey, 
  removeSecureApiKey,
  isSecureStorageAvailable 
} from "../../lib/secureStorage";

interface AuthContextType {
  apiKey: string | null;
  setApiKey: (key: string | null, remember: boolean) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load encrypted API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        if (isSecureStorageAvailable()) {
          const key = await getSecureApiKey();
          setApiKeyState(key);
        } else {
          // Fallback to plaintext if Web Crypto unavailable (shouldn't happen in modern browsers)
          console.warn("Web Crypto API not available, falling back to plaintext storage");
          const key = localStorage.getItem("jules_api_key");
          setApiKeyState(key);
        }
      } catch (error) {
        console.error("Failed to load API key:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, []);

  const setApiKey = async (key: string | null, remember: boolean) => {
    setApiKeyState(key);
    
    if (key && remember) {
      if (isSecureStorageAvailable()) {
        await setSecureApiKey(key);
      } else {
        // Fallback to plaintext
        localStorage.setItem("jules_api_key", key);
      }
    } else {
      // Remove from storage
      if (isSecureStorageAvailable()) {
        removeSecureApiKey();
      } else {
        localStorage.removeItem("jules_api_key");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ apiKey, setApiKey, isAuthenticated: !!apiKey, isLoading }}>
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
