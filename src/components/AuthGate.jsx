import { useState } from "react";
import { Cloud } from "lucide-react";

export default function AuthGate({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setError("");
    setLoading(true);
    try {
      await onSignIn("demo@spec.hub", "demo123456");
    } catch {
      try {
        await onSignUp("demo@spec.hub", "demo123456");
      } catch (err) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Cloud size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CSA Workbench</h1>
          <p className="text-sm text-gray-500 mt-1">Design, govern and deliver cloud architectures</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@team.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Password</label>
            <input
              type="password"
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {mode === "signin" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="border-t pt-4">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="w-full py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              Try Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
