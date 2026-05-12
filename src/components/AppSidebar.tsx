import { LayoutDashboard, Megaphone, Activity, Users, LogOut, Sun, Moon, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const mainNav = [
  { title: 'Overview',   url: '/',          icon: LayoutDashboard, end: true },
  { title: 'Campaigns',  url: '/campaigns', icon: Megaphone,       end: false },
  { title: 'Activity',   url: '/activity',  icon: Activity,        end: false },
];

const adminNav = [
  { title: 'User Management', url: '/users', icon: Users },
];

function NavItem({ url, icon: Icon, title, end, collapsed }: {
  url: string; icon: React.ElementType; title: string; end?: boolean; collapsed: boolean;
}) {
  const location = useLocation();
  const active = end ? location.pathname === url : location.pathname.startsWith(url);

  const inner = (
    <NavLink
      to={url}
      end={end}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{title}</span>
          {active && <ChevronRight className="h-3 w-3 opacity-60" />}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    );
  }
  return inner;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, logout, can } = useAuth();
  const { theme, setTheme } = useTheme();

  const showAdmin = can('manage_users');

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 border-b border-sidebar-border shrink-0',
        collapsed ? 'h-14 justify-center' : 'h-14'
      )}>
        <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/fynd-logo.svg" alt="Fynd" className="h-5 w-5 object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground leading-none">Campaign Management</p>
            <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Analytics Dashboard</p>
          </div>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        {/* Main navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 pb-1.5">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="p-0 h-auto">
                    <NavItem {...item} collapsed={collapsed} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section */}
        {showAdmin && (
          <>
            <Separator className="my-2 bg-sidebar-border" />
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 pb-1.5">
                  Admin
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {adminNav.map(item => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild className="p-0 h-auto">
                        <NavItem {...item} collapsed={collapsed} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border space-y-2">
        {/* Theme toggle */}
        <div className={cn('flex', collapsed ? 'justify-center' : 'justify-end')}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* User profile + logout */}
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-sidebar-primary">{initials}</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 capitalize">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={logout}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
