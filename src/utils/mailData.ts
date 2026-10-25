// Dummy Mail Data Generator using faker
import { faker } from '@faker-js/faker';

export function generateMailData(count = 10) {
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    from: faker.internet.email(),
    subject: faker.lorem.sentence(),
    date: faker.date.recent().toISOString().split('T')[0],
    body: faker.lorem.paragraphs(2)
  }));
}
