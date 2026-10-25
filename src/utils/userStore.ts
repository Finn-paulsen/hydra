// Zentraler UserStore für Benutzerverwaltung und Login
import { generateUserData, type UserRecord } from './userData';

const USER_KEY = 'gov_users_v1';

function readStoredUsers(): UserRecord[] | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

// Beim ersten Aufruf werden Demo-Benutzer erzeugt (faker wird dafür erst dann nachgeladen) und gespeichert.
export async function getUsers(): Promise<UserRecord[]> {
  const stored = readStoredUsers();
  if (stored) return stored;
  const seeded = await generateUserData(10);
  saveUsers(seeded);
  return seeded;
}

export function setUsers(users: UserRecord[]) {
  saveUsers(users);
}

export async function addUser(user: UserRecord) {
  const users = await getUsers();
  users.push(user);
  saveUsers(users);
}

export async function updateUser(updated: UserRecord) {
  const users = (await getUsers()).map(u => u.id === updated.id ? updated : u);
  saveUsers(users);
}

export async function deleteUser(id: string) {
  const users = (await getUsers()).filter(u => u.id !== id);
  saveUsers(users);
}
