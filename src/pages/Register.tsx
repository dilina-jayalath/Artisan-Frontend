import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "BUYER" as "BUYER" | "SELLER",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.displayName) return;
    setLoading(true);
    try {
      const res = await authApi.register(form);
      login({ userId: res.userId, role: res.role as "BUYER" | "SELLER", displayName: res.displayName, token: res.token });
      toast.success("Account created!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-muted-foreground">Join the Artisan Marketplace</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <input type="text" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">I want to</label>
            <div className="flex gap-2">
              {(["BUYER", "SELLER"] as const).map((r) => (
                <button key={r} type="button" onClick={() => update("role", r)}
                  className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${form.role === r ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                  {r === "BUYER" ? "Buy" : "Sell"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Country <span className="text-muted-foreground">(optional)</span></label>
            <input type="text" value={form.country} onChange={(e) => update("country", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. USA" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground font-medium underline underline-offset-4 hover:text-accent">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
