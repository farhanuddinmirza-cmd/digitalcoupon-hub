import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Team, initialTeams, applicationIds, getUsersForApp, getTeamMembers } from '@/lib/team-data';
import { mockUsers } from '@/lib/mock-data';
import { User } from '@/lib/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

export default function TeamManagementPage() {
  const { can } = useAuth();
  const [teams, setTeams] = useState<Team[]>([...initialTeams]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAppId, setFormAppId] = useState(applicationIds[0]);
  const [formMembers, setFormMembers] = useState<string[]>([]);
  const [memberFilter, setMemberFilter] = useState('');

  const availableUsers = useMemo(() => getUsersForApp(formAppId, mockUsers), [formAppId]);
  const filteredUsers = useMemo(() => {
    if (!memberFilter) return availableUsers;
    const q = memberFilter.toLowerCase();
    return availableUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [availableUsers, memberFilter]);

  if (!can('manage_users')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditingTeam(null);
    setFormName('');
    setFormAppId(applicationIds[0]);
    setFormMembers([]);
    setMemberFilter('');
    setDialogOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setFormName(team.name);
    setFormAppId(team.applicationId);
    setFormMembers([...team.memberIds]);
    setMemberFilter('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editingTeam) {
      setTeams(prev => prev.map(t => t.id === editingTeam.id
        ? { ...t, name: formName.trim(), applicationId: formAppId, memberIds: formMembers }
        : t
      ));
    } else {
      const newTeam: Team = {
        id: `t${Date.now()}`,
        name: formName.trim(),
        applicationId: formAppId,
        memberIds: formMembers,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTeams(prev => [...prev, newTeam]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      setTeams(prev => prev.filter(t => t.id !== deleteId));
      setDeleteId(null);
    }
  };

  const toggleMember = (userId: string) => {
    setFormMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage teams by application</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Team
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Application ID</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map(team => {
              const members = getTeamMembers(team, mockUsers);
              return (
                <TableRow key={team.id}>
                  <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{team.applicationId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{members.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {teams.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No teams yet. Create your first team.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
            <DialogDescription>
              {editingTeam ? 'Update team details and members.' : 'Set up a new team and assign members.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input id="team-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Enter team name" />
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
            <div className="space-y-2">
              <Label>Assign Members</Label>
              <Input placeholder="Filter users..." value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="mb-2" />
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                {filteredUsers.map(user => (
                  <label key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                    <Checkbox checked={formMembers.includes(user.id)} onCheckedChange={() => toggleMember(user.id)} />
                    <span className="text-foreground">{user.name}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{user.role}</span>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-muted-foreground text-xs text-center py-2">No users found</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>{editingTeam ? 'Save Changes' : 'Create Team'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The team will be permanently removed.</AlertDialogDescription>
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
