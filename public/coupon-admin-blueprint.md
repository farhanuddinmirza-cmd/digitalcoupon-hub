# Complete Digital Coupon Admin Dashboard — Blueprint for Claude

Share this entire file with Claude to recreate the full application. This is a **Vite + React + TypeScript + shadcn/ui** project.

---

## 1. Project Structure

```text
src/
├── App.tsx                 # Main app with routing
├── main.tsx                # Entry point
├── index.css               # Tailwind + theme tokens
├── lib/
│   ├── types.ts            # All TypeScript interfaces
│   ├── auth-context.tsx    # Authentication & RBAC
│   └── mock-data.ts        # Mock data (replace with API calls)
├── pages/
│   ├── LoginPage.tsx       # Login screen
│   ├── DashboardPage.tsx   # KPI cards + histogram chart
│   ├── CampaignsPage.tsx   # Campaign list + Excel export
│   ├── CampaignDetailPage.tsx
│   ├── LeaderboardPage.tsx
│   ├── UserManagementPage.tsx
│   └── NotFound.tsx
└── components/
    ├── DashboardLayout.tsx
    ├── AppSidebar.tsx
    ├── KpiCard.tsx
    └── ui/                 # shadcn components (install via CLI)
```

---

## 2. package.json dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@tanstack/react-query": "^5.83.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.462.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}
```

---

## 3. Core Types — src/lib/types.ts

```typescript
export type UserRole = 'admin' | 'ops' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  store: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
}

export type CouponStatus = 'uploaded' | 'claimed' | 'voided';

export interface Coupon {
  _id: string;
  couponCode: string;
  campaignId: string;
  campaignName: string;
  status: CouponStatus;
  claimedBy: string | null;
  claimedAt: string | null;
  transactionId: string | null;
  transactionDate: string | null;
  uploadedAt: string;
  store: string;
  brand: string;
}

export interface ActivityLog {
  id: string;
  action: 'uploaded' | 'claimed' | 'pdf_downloaded' | 'user_created' | 'role_changed';
  description: string;
  userId: string;
  userName: string;
  campaignId?: string;
  campaignName?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalUploaded: number;
  totalClaimed: number;
  totalVoided: number;
  pdfDownloads: number;
  claimRate: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['manage_users', 'manage_roles', 'upload_coupons', 'download_files', 'view_metrics', 'download_pdf'],
  ops: ['view_metrics', 'upload_coupons', 'download_files'],
  viewer: ['view_metrics'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
```

---

## 4. Authentication Context — src/lib/auth-context.tsx

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, hasPermission } from './types';
import { mockUsers } from './mock-data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string) => {
    const found = mockUsers.find(u => u.email === email && u.enabled);
    if (found) { setUser(found); return true; }
    return false;
  };

  const logout = () => setUser(null);

  const can = (permission: string) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

---

## 5. Mock Data — src/lib/mock-data.ts

```typescript
import { User, Campaign, Coupon, ActivityLog, DashboardMetrics } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@admin.com', role: 'admin', enabled: true, createdAt: '2024-01-10' },
  { id: '2', name: 'Priya Patel', email: 'priya@ops.com', role: 'ops', enabled: true, createdAt: '2024-02-15' },
  { id: '3', name: 'Amit Kumar', email: 'amit@viewer.com', role: 'viewer', enabled: true, createdAt: '2024-03-01' },
  { id: '4', name: 'Sneha Gupta', email: 'sneha@ops.com', role: 'ops', enabled: false, createdAt: '2024-03-20' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@viewer.com', role: 'viewer', enabled: true, createdAt: '2024-04-05' },
];

export const mockCampaigns: Campaign[] = [
  { id: 'c1', name: 'Summer Sale 2024', brand: 'Brand A', store: 'Store Delhi', startDate: '2024-06-01', endDate: '2024-06-30', status: 'completed' },
  { id: 'c2', name: 'Monsoon Madness', brand: 'Brand B', store: 'Store Mumbai', startDate: '2024-07-15', endDate: '2024-08-15', status: 'active' },
  { id: 'c3', name: 'Festive Bonanza', brand: 'Brand A', store: 'Store Bangalore', startDate: '2024-10-01', endDate: '2024-11-15', status: 'active' },
  { id: 'c4', name: 'Winter Warmth', brand: 'Brand C', store: 'Store Delhi', startDate: '2024-12-01', endDate: '2025-01-31', status: 'draft' },
];

const statuses: Array<'uploaded' | 'claimed' | 'voided'> = ['uploaded', 'claimed', 'voided'];

export const mockCoupons: Coupon[] = Array.from({ length: 85 }, (_, i) => {
  const campaign = mockCampaigns[i % mockCampaigns.length];
  const status = statuses[i % 3];
  return {
    _id: `cpn_${String(i + 1).padStart(4, '0')}`,
    couponCode: `COUP-${String(i + 1).padStart(5, '0')}`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    status,
    claimedBy: status === 'claimed' ? `user${i}@example.com` : null,
    claimedAt: status === 'claimed' ? `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}T10:30:00Z` : null,
    transactionId: status === 'claimed' ? `TXN${String(i + 1000).padStart(8, '0')}` : null,
    transactionDate: status === 'claimed' ? `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}` : null,
    uploadedAt: `2024-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}T09:00:00Z`,
    store: campaign.store,
    brand: campaign.brand,
  };
});

export const mockActivityLogs: ActivityLog[] = [
  { id: 'a1', action: 'uploaded', description: 'Uploaded 500 coupons for Summer Sale 2024', userId: '1', userName: 'Rahul Sharma', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-01T09:00:00Z' },
  { id: 'a2', action: 'claimed', description: 'Coupon COUP-00012 claimed', userId: '3', userName: 'System', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-05T14:30:00Z' },
  { id: 'a3', action: 'pdf_downloaded', description: 'PDF report downloaded for Monsoon Madness', userId: '2', userName: 'Priya Patel', campaignId: 'c2', campaignName: 'Monsoon Madness', timestamp: '2024-07-20T11:00:00Z' },
  { id: 'a4', action: 'uploaded', description: 'Uploaded 300 coupons for Festive Bonanza', userId: '2', userName: 'Priya Patel', campaignId: 'c3', campaignName: 'Festive Bonanza', timestamp: '2024-10-01T08:00:00Z' },
  { id: 'a5', action: 'user_created', description: 'User Sneha Gupta created', userId: '1', userName: 'Rahul Sharma', timestamp: '2024-03-20T10:00:00Z' },
  { id: 'a6', action: 'role_changed', description: 'Role changed for Amit Kumar to viewer', userId: '1', userName: 'Rahul Sharma', timestamp: '2024-03-01T12:00:00Z' },
  { id: 'a7', action: 'claimed', description: 'Coupon COUP-00045 claimed', userId: '3', userName: 'System', campaignId: 'c2', campaignName: 'Monsoon Madness', timestamp: '2024-08-02T16:45:00Z' },
  { id: 'a8', action: 'pdf_downloaded', description: 'PDF report downloaded for Summer Sale 2024', userId: '1', userName: 'Rahul Sharma', campaignId: 'c1', campaignName: 'Summer Sale 2024', timestamp: '2024-06-30T17:00:00Z' },
];

export function getDashboardMetrics(campaignId?: string): DashboardMetrics {
  const filtered = campaignId ? mockCoupons.filter(c => c.campaignId === campaignId) : mockCoupons;
  const totalUploaded = filtered.length;
  const totalClaimed = filtered.filter(c => c.status === 'claimed').length;
  const totalVoided = filtered.filter(c => c.status === 'voided').length;
  const pdfDownloads = mockActivityLogs.filter(a => a.action === 'pdf_downloaded' && (!campaignId || a.campaignId === campaignId)).length;
  return { totalUploaded, totalClaimed, totalVoided, pdfDownloads, claimRate: totalUploaded > 0 ? Math.round((totalClaimed / totalUploaded) * 100) : 0 };
}
```

---

## 6. App Entry — src/App.tsx

```typescript
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CampaignsPage from '@/pages/CampaignsPage';
import CampaignDetailPage from '@/pages/CampaignDetailPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import UserManagementPage from '@/pages/UserManagementPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

---

## 7. Login Page — src/pages/LoginPage.tsx

```typescript
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login(email, password)) setError('Invalid credentials or account disabled.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
            <Ticket className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Coupon Admin</CardTitle>
          <CardDescription>Sign in to manage digital coupons</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="rahul@admin.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 8. Dashboard — src/pages/DashboardPage.tsx

```typescript
import { useState, useMemo } from 'react';
import { Upload, FileText, TrendingUp, Ticket, BarChart3 } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { getDashboardMetrics, mockCampaigns, mockCoupons, mockActivityLogs } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const metrics = useMemo(() => getDashboardMetrics(campaignFilter === 'all' ? undefined : campaignFilter), [campaignFilter]);

  const dailyData = useMemo(() => {
    const dayMap: Record<string, { claimed: number; pdfDownloads: number }> = {};
    const filteredCoupons = campaignFilter === 'all' ? mockCoupons : mockCoupons.filter(c => c.campaignId === campaignFilter);
    filteredCoupons.filter(c => c.status === 'claimed' && c.claimedAt).forEach(c => {
      const day = c.claimedAt!.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { claimed: 0, pdfDownloads: 0 };
      dayMap[day].claimed++;
    });
    const filteredLogs = campaignFilter === 'all' ? mockActivityLogs : mockActivityLogs.filter(a => a.campaignId === campaignFilter);
    filteredLogs.filter(a => a.action === 'pdf_downloaded').forEach(a => {
      const day = a.timestamp.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { claimed: 0, pdfDownloads: 0 };
      dayMap[day].pdfDownloads++;
    });
    return Object.entries(dayMap).map(([date, counts]) => ({ date, ...counts })).sort((a, b) => a.date.localeCompare(b.date));
  }, [campaignFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {mockCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Uploaded" value={metrics.totalUploaded} icon={<Upload className="h-5 w-5" />} trend={{ value: 12, positive: true }} />
        <KpiCard title="Claimed" value={metrics.totalClaimed} icon={<Ticket className="h-5 w-5" />} trend={{ value: 8, positive: true }} />
        <KpiCard title="Claim Rate" value={`${metrics.claimRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="PDF Downloads" value={metrics.pdfDownloads} icon={<FileText className="h-5 w-5" />} />
      </div>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Daily Claims & PDF Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="claimed" fill="hsl(172, 66%, 38%)" radius={[4, 4, 0, 0]} name="Coupons Claimed" />
              <Bar dataKey="pdfDownloads" fill="hsl(215, 70%, 55%)" radius={[4, 4, 0, 0]} name="PDFs Downloaded" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 9. Campaigns — src/pages/CampaignsPage.tsx

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCampaigns, mockCoupons } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const statusColor: Record<string, string> = {
  active: 'bg-accent text-accent-foreground',
  completed: 'bg-muted text-muted-foreground',
  draft: 'bg-secondary text-secondary-foreground',
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportCampaign, setExportCampaign] = useState<string>('');

  const handleDownloadExcel = () => {
    if (!exportCampaign) return;
    const campaignCoupons = mockCoupons.filter(c => c.status === 'claimed' && c.campaignId === exportCampaign);
    const campaign = mockCampaigns.find(c => c.id === exportCampaign);
    const rows = campaignCoupons.map(c => ({
      'Coupon Code': c.couponCode, 'Campaign': c.campaignName, 'Brand': c.brand, 'Store': c.store,
      'Status': c.status, 'Claimed By': c.claimedBy ?? '', 'Claimed At': c.claimedAt ? new Date(c.claimedAt).toLocaleString() : '',
      'Transaction ID': c.transactionId ?? '', 'Transaction Date': c.transactionDate ?? '', 'Uploaded At': new Date(c.uploadedAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Claimed Coupons');
    XLSX.writeFile(wb, `coupons-${(campaign?.name ?? 'campaign').replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExportDropdown(false);
    setExportCampaign('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
      <div className="flex flex-col gap-3">
        {!showExportDropdown ? (
          <Button variant="outline" size="sm" onClick={() => setShowExportDropdown(true)} className="w-fit">
            <Download className="h-3.5 w-3.5 mr-1" /> Download Excel
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-muted/50 rounded-md p-3 w-fit">
            <div className="flex items-center gap-2">
              <Select value={exportCampaign} onValueChange={setExportCampaign}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>{mockCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" onClick={handleDownloadExcel} disabled={!exportCampaign}><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowExportDropdown(false); setExportCampaign(''); }}>Cancel</Button>
            </div>
            {!exportCampaign && <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertCircle className="h-4 w-4" /> Select a campaign</div>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockCampaigns.map(c => {
          const coupons = mockCoupons.filter(cp => cp.campaignId === c.id);
          return (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge className={`${statusColor[c.status]} capitalize text-xs`}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.brand} · {c.store}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Uploaded</span><span className="font-medium">{coupons.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Claimed</span><span className="font-medium">{coupons.filter(cp => cp.status === 'claimed').length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Unclaimed</span><span className="font-medium">{coupons.filter(cp => cp.status === 'uploaded').length}</span></div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.id}`); }}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 10. User Management (Admin-only) — src/pages/UserManagementPage.tsx

```typescript
import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockUsers } from '@/lib/mock-data';
import { User, UserRole } from '@/lib/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="text-4xl">🔒</div>
      <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm">Only administrators can access user management.</p>
    </div>
  );
}

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([...mockUsers]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('viewer');
  const [formEnabled, setFormEnabled] = useState(true);

  const openCreate = () => { setEditingUser(null); setFormName(''); setFormEmail(''); setFormRole('viewer'); setFormEnabled(true); setDialogOpen(true); };
  const openEdit = (user: User) => { setEditingUser(user); setFormName(user.name); setFormEmail(user.email); setFormRole(user.role); setFormEnabled(user.enabled); setDialogOpen(true); };

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) return;
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: formName.trim(), email: formEmail.trim(), role: formRole, enabled: formEnabled } : u));
    } else {
      setUsers(prev => [...prev, { id: `u${Date.now()}`, name: formName.trim(), email: formEmail.trim(), role: formRole, enabled: formEnabled, createdAt: new Date().toISOString().split('T')[0] }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => { if (deleteId) { setUsers(prev => prev.filter(u => u.id !== deleteId)); setDeleteId(null); } };
  const toggleEnabled = (id: string) => { setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: !u.enabled } : u)); };

  const roleBadge: Record<UserRole, string> = { admin: 'bg-primary/10 text-primary', ops: 'bg-accent text-accent-foreground', viewer: 'bg-secondary text-secondary-foreground' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-foreground">User Management</h1><p className="text-sm text-muted-foreground mt-1">Manage users and access control</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Create User</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge className={`${roleBadge[u.role]} capitalize text-xs`}>{u.role}</Badge></TableCell>
                <TableCell><Badge variant={u.enabled ? 'default' : 'secondary'} className="text-xs">{u.enabled ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Switch checked={u.enabled} onCheckedChange={() => toggleEnabled(u.id)} />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle><DialogDescription>{editingUser ? 'Update user details.' : 'Add a new user.'}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="user@example.com" /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={formRole} onValueChange={v => setFormRole(v as UserRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="ops">Ops</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent></Select></div>
            <div className="flex items-center gap-2"><Switch checked={formEnabled} onCheckedChange={setFormEnabled} /><Label>{formEnabled ? 'Active' : 'Inactive'}</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={!formName.trim() || !formEmail.trim()}>{editingUser ? 'Save' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete User</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UserManagementPage() {
  const { can } = useAuth();
  if (!can('manage_users')) return <AccessDenied />;
  return <UserManagementContent />;
}
```

---

## 11. Setup Instructions for Claude

```text
1. Create a new Vite + React + TypeScript project:
   npm create vite@latest coupon-admin -- --template react-ts
   cd coupon-admin

2. Install shadcn/ui:
   npx shadcn@latest init

3. Install shadcn components:
   npx shadcn add button card input label badge select switch dialog alert-dialog table tooltip toaster sonner sidebar

4. Install dependencies:
   npm install recharts xlsx @tanstack/react-query lucide-react date-fns react-router-dom

5. Copy all code files into src/

6. Run: npm run dev

Demo logins (any password):
  - Admin: rahul@admin.com
  - Ops: priya@ops.com
  - Viewer: amit@viewer.com
```

---

## Key Features

| Feature | Status |
|---|---|
| RBAC (admin/ops/viewer) | ✅ |
| Mock auth login | ✅ |
| Dashboard KPIs + bar chart | ✅ |
| Campaign list + Excel export | ✅ |
| Campaign detail page | ✅ |
| Leaderboard | ✅ |
| User management (Admin-only) | ✅ |
