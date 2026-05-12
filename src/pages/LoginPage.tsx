import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await login(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel – branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-sidebar p-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src="/fynd-logo.svg" alt="Fynd" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-sidebar-foreground font-bold text-lg">Campaign Management</span>
        </div>

        <div className="space-y-3">
          {[
            { icon: '📊', label: 'Real-time analytics across all campaigns and coupon activity.' },
            { icon: '🎟️', label: 'Track coupon issuance, claims, and redemption at a glance.' },
            { icon: '🔐', label: 'Role-based access for admins, operations, and viewers.' },
          ].map(item => (
            <div key={item.icon} className="bg-sidebar-accent/50 rounded-xl px-5 py-4 flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
              <p className="text-sm text-sidebar-foreground/80 leading-relaxed">{item.label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()} Shopsense Retail Technologies
        </p>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
              <img src="/fynd-logo.svg" alt="Fynd" className="h-6 w-6 object-contain" />
            </div>
            <span className="font-bold text-lg text-foreground">Campaign Management</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your analytics dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2.5 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className={cn('w-full h-10 font-semibold', loading && 'opacity-80')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
