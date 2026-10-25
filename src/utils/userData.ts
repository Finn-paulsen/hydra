// Dummy User Data für Benutzerverwaltung
import { faker } from '@faker-js/faker';

const GROUPS = [
  { id: 'admin', name: 'Administratoren', description: 'Vollzugriff auf alle Systeme' },
  { id: 'archiv', name: 'Archivaufsicht', description: 'Zugriff auf Archivdaten' },
  { id: 'it', name: 'IT-Betrieb', description: 'Technische Verwaltung & Wartung' },
  { id: 'compliance', name: 'Compliance', description: 'Überwachung der Richtlinien' },
  { id: 'gast', name: 'Gast', description: 'Eingeschränkter Zugriff' }
];

export function generateUserData(count = 8) {
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
