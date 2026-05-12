import { UserRole } from './types';

const STORE_KEY = 'campaign_managed_users';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  createdBy?: string;
}

function load(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(users: StoredUser[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(users));
}

export function getUsers(): StoredUser[] {
  return load();
}

export function getUsersByCreator(creatorId: string): StoredUser[] {
  return load().filter(u => u.createdBy === creatorId);
}

export function findByCredentials(email: string, password: string): StoredUser | null {
  return load().find(u => u.email === email && u.password === password && u.enabled !== false) ?? null;
}

export function addUser(user: Omit<StoredUser, 'id'>): StoredUser {
  const users = load();
  const newUser: StoredUser = { ...user, id: crypto.randomUUID() };
  save([...users, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<StoredUser, 'id'>>): boolean {
  const users = load();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...updates };
  save(users);
  return true;
}

export function deleteUser(id: string): boolean {
  const users = load();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  save(filtered);
  return true;
}
