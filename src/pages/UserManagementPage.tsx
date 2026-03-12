import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockUsers } from '@/lib/mock-data';
import { applicationIds } from '@/lib/team-data';
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

interface ManagedUser extends User {
  applicationId: string;
}

// Assign mock application IDs to users
const initialManagedUsers: ManagedUser[] = mockUsers.map((u, i) => ({
  ...u,
  applicationId: applicationIds[i % applicationIds.length],
}));

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="text-4xl">🔒</div>
      <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm">
        Only administrators can access user management. Please contact an admin if you need to manage users.
      </p>
    </div>
  );
}

function UserManagementContent() {
  const [users, setUsers] = useState<ManagedUser[]>([...initialManagedUsers]);
  const [appFilter, setAppFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('viewer');
  const [formAppId, setFormAppId] = useState(applicationIds[0]);
  const [formEnabled, setFormEnabled] = useState(true);

  const filteredUsers = useMemo(() => {
    if (appFilter === 'all') return users;
    return users.filter(u => u.applicationId === appFilter);
  }, [users, appFilter]);

  const openCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('viewer');
    setFormAppId(applicationIds[0]);
    setFormEnabled(true);
    setDialogOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormAppId(user.applicationId);
    setFormEnabled(user.enabled);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) return;
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id
        ? { ...u, name: formName.trim(), email: formEmail.trim(), role: formRole, applicationId: formAppId, enabled: formEnabled }
        : u
      ));
    } else {
      const newUser: ManagedUser = {
        id: `u${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        enabled: formEnabled,
        createdAt: new Date().toISOString().split('T')[0],
        applicationId: formAppId,
      };
      setUsers(prev => [...prev, newUser]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setUsers(prev => prev.filter(u => u.id !== deleteId));
      setDeleteId(null);
    }
  };

  const toggleEnabled = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, enabled: !u.enabled } : u));
  };

  const roleBadgeClass: Record<UserRole, string> = {
    admin: 'bg-primary/10 text-primary',
    ops: 'bg-accent text-accent-foreground',
    viewer: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users and access control</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create User
        </Button>
      </div>

      {/* Application ID filter */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Application ID</Label>
          <Select value={appFilter} onValueChange={setAppFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {applicationIds.map(id => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge className={`${roleBadgeClass[u.role]} capitalize text-xs`}>{u.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.enabled ? 'default' : 'secondary'} className="text-xs">
                    {u.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch checked={u.enabled} onCheckedChange={() => toggleEnabled(u.id)} />
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users found for the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user details.' : 'Add a new user to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={v => setFormRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ops">Ops</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Application ID</Label>
              <Select value={formAppId} onValueChange={setFormAppId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {applicationIds.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
              <Label>{formEnabled ? 'Active' : 'Inactive'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || !formEmail.trim()}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The user will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UserManagementPage() {
  const { can } = useAuth();
  const isAdmin = can('manage_users');

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return <UserManagementContent />;
}