import { mockUsers } from './mock-data';
import { User } from './types';

export interface Team {
  id: string;
  name: string;
  applicationId: string;
  memberIds: string[];
  createdAt: string;
}

export const applicationIds = ['APP-001', 'APP-002', 'APP-003', 'APP-004'];

export const initialTeams: Team[] = [
  { id: 't1', name: 'Delhi Ops', applicationId: 'APP-001', memberIds: ['1', '2'], createdAt: '2024-05-01' },
  { id: 't2', name: 'Mumbai Sales', applicationId: 'APP-002', memberIds: ['3'], createdAt: '2024-06-15' },
  { id: 't3', name: 'Bangalore Support', applicationId: 'APP-001', memberIds: ['4', '5'], createdAt: '2024-07-20' },
];

export function getUsersForApp(applicationId: string, allUsers: User[]): User[] {
  // In a real app this would filter by application; here we return all enabled users
  return allUsers.filter(u => u.enabled);
}

export function getTeamMembers(team: Team, allUsers: User[]): User[] {
  return allUsers.filter(u => team.memberIds.includes(u.id));
}
