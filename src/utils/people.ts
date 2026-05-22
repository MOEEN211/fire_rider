import type { Person } from '../types/board';

export function getPersonName(people: Person[], personId?: string) {
  if (!personId) {
    return '';
  }

  return people.find((person) => person.id === personId)?.name ?? '';
}
