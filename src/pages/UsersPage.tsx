import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useApi';
import { User, UserRole } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary',
  ops: 'bg-accent text-accent-foreground',
  viewer: 'bg-secondary text-secondary-foreground',
};

export default function UsersPage() {
  const { can } = useAuth();
  const { data: fetchedUsers, loading } = useFetch<User[]>('/api/users');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (fetchedUsers) setUsers(fetchedUsers);
  }, [fetchedUsers]);

  const toggleEnabled = async (id: string) => {
    const user = users.find(u => (u as any)._id === id || u.id === id);
    if (!user) return;
    const updates = { _id: (user as any)._id, enabled: !user.enabled };
    const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) {
      setUsers(prev => prev.map(u => ((u as any)._id === id || u.id === id) ? { ...u, enabled: !u.enabled } : u));
    }
  };

  const changeRole = async (id: string, role: UserRole) => {
    const user = users.find(u => (u as any)._id === id || u.id === id);
    if (!user) return;
    const updates = { _id: (user as any)._id, role };
    const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) {
      setUsers(prev => prev.map(u => ((u as any)._id === id || u.id === id) ? { ...u, role } : u));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Users & Access</h1>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Users & Access</h1>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {can('manage_roles') && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={(u as any)._id || u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {can('manage_roles') ? (
                    <Select value={u.role} onValueChange={(v) => changeRole((u as any)._id || u.id, v as UserRole)}>
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ops">Ops</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${roleBadge[u.role]} capitalize text-xs`}>{u.role}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={u.enabled ? 'default' : 'secondary'} className="text-xs">
                    {u.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                {can('manage_roles') && (
                  <TableCell>
                    <Switch checked={u.enabled} onCheckedChange={() => toggleEnabled((u as any)._id || u.id)} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
