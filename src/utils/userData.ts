// Dummy User Data für Benutzerverwaltung

export interface UserGroup {
  id: string;
  name: string;
  description: string;
}

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  group: string;
  groupName: string;
  permissions: string[];
  status: string;
  created: string;
}

const GROUPS: UserGroup[] = [
  { id: 'admin', name: 'Administratoren', description: 'Vollzugriff auf alle Systeme' },
  { id: 'archiv', name: 'Archivaufsicht', description: 'Zugriff auf Archivdaten' },
  { id: 'it', name: 'IT-Betrieb', description: 'Technische Verwaltung & Wartung' },
  { id: 'compliance', name: 'Compliance', description: 'Überwachung der Richtlinien' },
  { id: 'gast', name: 'Gast', description: 'Eingeschränkter Zugriff' }
];

export async function generateUserData(count = 8): Promise<UserRecord[]> {
  const { faker } = await import('@faker-js/faker');
  return Array.from({ length: count }).map(() => {
    const group = faker.helpers.arrayElement(GROUPS);
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      username: faker.internet.username().toLowerCase(),
      email: faker.internet.email(),
      password: 'passwort',
      group: group.id,
      groupName: group.name,
      permissions: group.id === 'admin' ? ['read', 'write', 'delete', 'manage'] : ['read', 'write'],
      status: faker.helpers.arrayElement(['aktiv', 'gesperrt', 'in Prüfung']),
      created: faker.date.past().toISOString().split('T')[0]
    };
  });
}

export const GROUPS_LIST = GROUPS;
