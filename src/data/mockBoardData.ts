import type { CalendarEvent, Duty, Person, Vehicle } from '../types/board';

export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    name: '41P1',
    registration: 'Rescue Pump 1',
    seats: [
      { id: 'v1-oic', label: 'OIC' },
      { id: 'v1-driver', label: 'DRIVER' },
      { id: 'v1-ba1', label: 'BA' },
      { id: 'v1-ba2', label: 'BA' },
      { id: 'v1-eco', label: 'ECO' },
    ],
  },
  {
    id: 'vehicle-2',
    name: '41P2',
    registration: 'Rescue Pump 2',
    seats: [
      { id: 'v2-oic', label: 'OIC' },
      { id: 'v2-driver', label: 'DRIVER' },
      { id: 'v2-ba1', label: 'BA' },
      { id: 'v2-ba2', label: 'BA' },
      { id: 'v2-eco', label: 'ECO' },
    ],
  },
  {
    id: 'vehicle-3',
    name: '41A8',
    registration: 'Turn-table Ladder',
    seats: [
      { id: 'v3-oic', label: 'OIC' },
      { id: 'v3-driver', label: 'DRIVER' },
    ],
  },
];

export const mockPeople: Person[] = [
  { id: 'p1', marker: '', rank: 'WC', name: 'SCOTT GOODMAN', staffNumber: '5010', skills: ['OIC'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p2', marker: '', rank: 'CC', name: 'JUSTIN DEEBLE', staffNumber: '676', skills: ['OIC', 'LGVE', 'LGVETL', 'TTO'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p3', marker: '', rank: 'CC', name: 'GARY DUFFY-WILLIAMS', staffNumber: '587', skills: ['OIC', 'LGVE', 'LGVETL', 'TTO'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p4', marker: '', rank: 'FF', name: 'SAMUEL BROOKS', staffNumber: '5387', skills: ['LGVE', 'BA', 'TTO'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p5', marker: '', rank: 'FF', name: 'JAKE CONNELL', staffNumber: '3071', skills: ['LGVE', 'BA', 'TTO'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p6', marker: '', rank: 'FF', name: 'NATHAN HOLT', staffNumber: '2623', skills: ['LGVE', 'LGVETL', 'TTO', 'BA'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p7', marker: '', rank: 'FF', name: 'BEN HARRIS', staffNumber: '2684', skills: ['BA', 'TTO'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p8', marker: '', rank: 'FF', name: 'KYLE MCBRIDE', staffNumber: '2689', skills: ['BA'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p9', marker: '', rank: 'FF', name: 'KRISTIAN BOWLES', staffNumber: '2078', skills: ['BA'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p10', marker: '', rank: 'FF', name: 'NATASHA LAKE', staffNumber: '2001', skills: ['BA'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p11', marker: '', rank: 'FF', name: 'CAMERON LAW', staffNumber: '2010', skills: ['BA'], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
  { id: 'p12', marker: '', rank: 'FF', name: 'KIAN MACDONALD', staffNumber: '2019', skills: [], dutyStatus: 'On Duty', rides: 0, availability: 'On Duty' },
];

export const mockDuties: Duty[] = [
  { id: 'mess', label: 'Mess/Tea' },
  { id: 'watchroom', label: 'Watchroom' },
  { id: 'boilers', label: 'Boilers' },
];

export const mockEvents: CalendarEvent[] = [];
