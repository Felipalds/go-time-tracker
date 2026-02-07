import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/atoms/Card";

type AuthMode = "login" | "signup";

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Name is required");
          return;
        }
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(236, 72, 153, 0.15), transparent 25%)',
      backgroundAttachment: 'fixed'
    }}>
      <Card className="w-full max-w-md p-8 space-y-6 !bg-white/[0.03] !border-white/[0.08] backdrop-blur-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-50">Legends Time Tracker</h1>
          <p className="text-slate-400">Track time, earn rewards</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-black/30 border border-white/[0.08] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-2 rounded-md transition-colors font-medium ${
              mode === "login"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 py-2 rounded-md transition-colors font-medium ${
              mode === "signup"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={isSignup}
                autoComplete="name"
                className="!bg-black/40 !border-white/10 !text-slate-50 placeholder:!text-slate-500 focus:!border-indigo-400/50 focus:!bg-black/50"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="!bg-black/40 !border-white/10 !text-slate-50 placeholder:!text-slate-500 focus:!border-indigo-400/50 focus:!bg-black/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="!bg-black/40 !border-white/10 !text-slate-50 placeholder:!text-slate-500 focus:!border-indigo-400/50 focus:!bg-black/50"
            />
            {isSignup && (
              <p className="text-xs text-slate-500 mt-1">
                Minimum 6 characters
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Please wait..."
              : isSignup
                ? "Create Account"
                : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-400">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
