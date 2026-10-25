// Zentraler UserStore für Benutzerverwaltung und Login
import { generateUserData } from './userData';

const USER_KEY = 'gov_users_v1';

function loadUsers() {
  const raw = localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return generateUserData(10);
    }
  }
  return generateUserData(10);
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

export function getUsers() {
  return loadUsers();
}

export function setUsers(users) {
  saveUsers(users);
}

export function addUser(user) {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(updated) {
  const users = loadUsers().map(u => u.id === updated.id ? updated : u);
  saveUsers(users);
}

export function deleteUser(id) {
  const users = loadUsers().filter(u => u.id !== id);
  saveUsers(users);
}
