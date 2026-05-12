import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Overview',
  '/campaigns': 'Campaigns',
  '/coupons':   'Coupons',
  '/activity':  'Activity Logs',
  '/users':     'User Management',
};

function getTitle(pathname: string) {
  if (pathname.startsWith('/campaigns/')) return 'Campaign Details';
  return PAGE_TITLES[pathname] ?? 'Dashboard';
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const title = getTitle(location.pathname);
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center border-b bg-card/80 backdrop-blur-sm px-4 gap-3 shrink-0 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-5" />
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
