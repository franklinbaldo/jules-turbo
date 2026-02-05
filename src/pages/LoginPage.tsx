import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function LoginPage() {
  const { setApiKey } = useAuth();
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate key by fetching sources (limit 1)
      await api.sources.list(key, 1);
      await setApiKey(key, remember);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid API Key or connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center">Jules Client</h1>
        <p className="text-sm text-center text-gray-500">Enter your Jules API Key to continue</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium">API Key</label>
            <input
              id="apiKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Start with AIza..."
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-900 dark:text-gray-300">
              Remember on this device
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded dark:bg-red-900/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Validating..." : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
