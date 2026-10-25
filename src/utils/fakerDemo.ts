import { faker } from '@faker-js/faker'

export function generateFakeUsers(count = 10) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    job: faker.person.jobTitle(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country(),
    bio: faker.lorem.sentences(2),
    avatar: faker.image.avatar(),
  }))
}

export function generateFakeNetwork(nodeCount = 12) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: 'N' + (i + 1),
    group: faker.number.int({ min: 1, max: 3 }),
    size: faker.number.int({ min: 6, max: 18 }),
    label: faker.internet.domainName(),
  }))
  const links = Array.from({ length: nodeCount * 1.5 }, () => {
    const source = faker.number.int({ min: 0, max: nodeCount - 1 })
    let target = faker.number.int({ min: 0, max: nodeCount - 1 })
    while (target === source) target = faker.number.int({ min: 0, max: nodeCount - 1 })
    return {
      source: nodes[source].id,
      target: nodes[target].id,
      value: faker.number.int({ min: 1, max: 10 })
    }
  })
  return { nodes, links }
}

export function generateFakeTimeline(count = 20) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    date: faker.date.past({ years: 5 }).toISOString().slice(0, 10),
    event: faker.lorem.sentence(),
    user: faker.person.fullName(),
    location: faker.location.city(),
  }))
}

export function generateFakeBio() {
  return {
    name: faker.person.fullName(),
    birth: faker.date.past({ years: 30 }).toISOString().slice(0, 10),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country(),
    about: faker.lorem.paragraphs(2),
    avatar: faker.image.avatar(),
  }
}