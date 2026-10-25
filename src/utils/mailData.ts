// Dummy Mail Data Generator using faker

export interface MailItem {
  id: string;
  from: string;
  subject: string;
  date: string;
  body: string;
}

export async function generateMailData(count = 10): Promise<MailItem[]> {
  const { faker } = await import('@faker-js/faker');
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    from: faker.internet.email(),
    subject: faker.lorem.sentence(),
    date: faker.date.recent().toISOString().split('T')[0],
    body: faker.lorem.paragraphs(2)
  }));
}
