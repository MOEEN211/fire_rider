import type { Person, Seat, Vehicle, AvailabilityCode } from '../types/board';

export type SeatRequirement = {
  label: string;
  requiredSkills: string[];
  excludedRanks?: string[];
  requiredRanks?: string[];
  ffPriority?: boolean;
};

export type AssignmentHistory = {
  personId: string;
  seatId: string;
  lastDate: Date | null; // null = never sat in this seat (highest priority)
};

// Seat requirements for 41P1 / 41P2
export const PUMP_SEAT_REQUIREMENTS: Record<string, SeatRequirement> = {
  OIC: { label: 'OIC', requiredSkills: ['OIC'], requiredRanks: ['WC', 'CC'], excludedRanks: ['FF'] },
  DRIVER: { label: 'DRIVER', requiredSkills: ['LGVE'], excludedRanks: ['WC'] },
  BA: { label: 'BA', requiredSkills: ['BA'], ffPriority: true },
  'BA 1': { label: 'BA', requiredSkills: ['BA'], ffPriority: true },
  'BA 2': { label: 'BA', requiredSkills: ['BA'], ffPriority: true },
  ECO: { label: 'ECO', requiredSkills: ['BA'], ffPriority: true },
};

// Seat requirements for 41A8
export const LADDER_SEAT_REQUIREMENTS: Record<string, SeatRequirement> = {
  OIC: { label: 'OIC', requiredSkills: ['TTO'] },
  DRIVER: { label: 'DRIVER', requiredSkills: ['LGVETL'] },
};

export const AVAILABILITY_CODES: AvailabilityCode[] = [
  'On Duty',
  'Toil',
  'AA',
  'AB',
  'ME',
  'DS',
  'PH',
  'CL',
  'MCL',
  'LSL',
  'SL',
  'TE',
  'TI',
  'Rest Day',
  'Bank Holiday',
  'Stand Down',
];

const UNAVAILABLE_CODES: AvailabilityCode[] = [
  'Toil',
  'AA',
  'AB',
  'ME',
  'DS',
  'PH',
  'CL',
  'MCL',
  'LSL',
  'SL',
  'TE',
  'TI',
  'Rest Day',
  'Bank Holiday',
  'Stand Down',
];

export function isAvailable(person: Person): boolean {
  return person.availability === 'On Duty';
}

function getSeatRequirements(seatLabel: string, isLadder: boolean): SeatRequirement | undefined {
  if (isLadder) {
    return LADDER_SEAT_REQUIREMENTS[seatLabel];
  }
  return PUMP_SEAT_REQUIREMENTS[seatLabel];
}

export function isEligibleForSeat(person: Person, seatLabel: string, isLadder: boolean = false): boolean {
  if (!isAvailable(person)) {
    return false;
  }

  const req = getSeatRequirements(seatLabel, isLadder);
  if (!req) {
    return true; // No requirements known, allow anyone
  }

  // Check excluded ranks
  if (req.excludedRanks && req.excludedRanks.length > 0) {
    if (req.excludedRanks.includes(person.rank)) {
      return false;
    }
  }

  // Check required ranks
  if (req.requiredRanks && req.requiredRanks.length > 0) {
    if (!req.requiredRanks.includes(person.rank)) {
      return false;
    }
  }

  // Check skill requirement
  if (req.requiredSkills.length > 0) {
    const hasSkill = req.requiredSkills.some((skill) => person.skills.includes(skill as any));
    if (!hasSkill) {
      return false;
    }
  }

  return true;
}

export function getEligiblePeople(
  people: Person[],
  seatLabel: string,
  excludePersonIds: Set<string> = new Set(),
  isLadder: boolean = false
): Person[] {
  return people.filter(
    (person) =>
      isEligibleForSeat(person, seatLabel, isLadder) && !excludePersonIds.has(person.id)
  );
}

/**
 * Score a person for a seat. Lower score = better candidate.
 * - Never sat in seat: score = -Infinity (highest priority)
 * - Otherwise: score = days since last assignment (higher = better)
 * Tie-breaker: fewer total rides
 */
export function scoreCandidate(
  person: Person,
  seatId: string,
  history: AssignmentHistory[]
): number {
  const record = history.find(
    (h) => h.personId === person.id && h.seatId === seatId
  );

  if (!record || record.lastDate === null) {
    // Never sat in this seat — highest priority
    return -1000000;
  }

  // Days since last assignment. We want the person who sat in it longest ago.
  // Higher daysSince = better candidate. To make "lower score = better", subtract from a large number.
  const daysSince = Math.floor(
    (new Date().getTime() - new Date(record.lastDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return 1000 - daysSince;
}

export function assignSeat(
  seat: Seat,
  people: Person[],
  history: AssignmentHistory[],
  assignedPersonIds: Set<string>,
  isLadder: boolean = false
): string | undefined {
  const eligible = getEligiblePeople(people, seat.label, assignedPersonIds, isLadder);

  if (eligible.length === 0) {
    return undefined;
  }

  // Score and sort (lowest score first = best candidate)
  const scored = eligible.map((person) => ({
    person,
    score: scoreCandidate(person, seat.id, history),
  }));

  scored.sort((a, b) => a.score - b.score);

  return scored[0].person.id;
}

/**
 * Generate automatic seat assignments following all Green Watch Riders rules:
 * 1. Time Since Last for all positions (unless crewing needs override)
 * 2. Fill 41P1 core crew (OIC, Driver, BA, BA) first
 * 3. Then fill 41P2 core crew (OIC, Driver, BA, BA)
 * 4. Then ECO on 41P1, then ECO on 41P2
 * 5. 41A8 crewed from 41P2 pool (after 41P2 core crew assigned)
 * 6. OIC/DRIVER priority over BA/ECO
 * 7. If unable to fill critical seat → empty (UI shows SBY)
 * 8. No skillset → ECO on 41P1
 * 9. WC rank MUST be in OIC seat
 * 10. Tie on time → fewer total rides
 */
export function generateBoardAssignments(
  vehicles: Vehicle[],
  people: Person[],
  history: AssignmentHistory[] = []
): Record<string, string | undefined> {
  const assignments: Record<string, string | undefined> = {};
  const assignedPersonIds = new Set<string>();

  const v41P1 = vehicles.find((v) => v.name === '41P1');
  const v41P2 = vehicles.find((v) => v.name === '41P2');
  const v41A8 = vehicles.find((v) => v.name === '41A8');

  if (!v41P1 || !v41P2 || !v41A8) {
    console.warn('[generateBoardAssignments] Missing required vehicles');
    return assignments;
  }

  const getSeat = (vehicle: Vehicle, label: string): Seat | undefined =>
    vehicle.seats.find((s) => s.label === label);

  const pickBest = (candidates: Person[], seatId: string): Person | undefined => {
    if (candidates.length === 0) return undefined;
    
    return [...candidates].sort((a, b) => {
      const scoreA = scoreCandidate(a, seatId, history);
      const scoreB = scoreCandidate(b, seatId, history);
      
      if (scoreA !== scoreB) return scoreA - scoreB;
      
      // Rule 10: Tie on time → fewer total rides
      return a.rides - b.rides;
    })[0];
  };

  const tryAssign = (
    seat: Seat | undefined,
    filter: (p: Person) => boolean,
    ffPriority: boolean = false
  ): boolean => {
    if (!seat) return false;

    let candidates = people.filter(
      (p) => !assignedPersonIds.has(p.id) && isAvailable(p) && filter(p)
    );

    if (candidates.length === 0) return false;

    if (ffPriority) {
      const ffOnly = candidates.filter((p) => p.rank === 'FF');
      if (ffOnly.length > 0) candidates = ffOnly;
    }

    const best = pickBest(candidates, seat.id);
    if (!best) return false;

    assignments[seat.id] = best.id;
    assignedPersonIds.add(best.id);
    return true;
  };

  const getSeatsByLabel = (vehicle: Vehicle, label: string): Seat[] =>
    vehicle.seats.filter((s) => s.label === label);

  // === PHASE 1: 41P1 Core Crew ===
  const p1OIC = getSeat(v41P1, 'OIC');
  const p1Driver = getSeat(v41P1, 'DRIVER');
  const p1ECO = getSeat(v41P1, 'ECO');

  // Rule 9: WC must be in OIC seat
  const wcPerson = people.find((p) => p.rank === 'WC' && isAvailable(p));
  if (wcPerson && p1OIC && wcPerson.skills.includes('OIC')) {
    assignments[p1OIC.id] = wcPerson.id;
    assignedPersonIds.add(wcPerson.id);
  } else {
    tryAssign(p1OIC, (p) => p.skills.includes('OIC') && (p.rank === 'WC' || p.rank === 'CC'));
  }
  tryAssign(p1Driver, (p) => p.skills.includes('LGVE') && p.rank !== 'WC');
  
  // Rule 2 & 5: Handle multiple BA seats correctly
  getSeatsByLabel(v41P1, 'BA').forEach(seat => tryAssign(seat, (p) => p.skills.includes('BA'), true));

  // === PHASE 2: 41P2 Core Crew ===
  const p2OIC = getSeat(v41P2, 'OIC');
  const p2Driver = getSeat(v41P2, 'DRIVER');
  const p2ECO = getSeat(v41P2, 'ECO');

  tryAssign(p2OIC, (p) => p.skills.includes('OIC') && (p.rank === 'WC' || p.rank === 'CC'));
  tryAssign(p2Driver, (p) => p.skills.includes('LGVE') && p.rank !== 'WC');
  
  // Handle multiple BA seats for P2
  getSeatsByLabel(v41P2, 'BA').forEach(seat => tryAssign(seat, (p) => p.skills.includes('BA'), true));

  // === PHASE 3: 41A8 — crewed ONLY from 41P2 pool (Rule 4) ===
  const a8OIC = getSeat(v41A8, 'OIC');
  const a8Driver = getSeat(v41A8, 'DRIVER');

  const p2SeatIds = v41P2.seats.map((s) => s.id);

  // Pull 41A8 OIC from 41P2 (not OIC seat — preserve command)
  if (a8OIC) {
    const p2Assignments = Object.entries(assignments).filter(
      ([seatId, personId]) => personId && p2SeatIds.includes(seatId) && seatId !== p2OIC?.id
    );
    const candidates = p2Assignments
      .map(([seatId, personId]) => {
        const person = people.find((p) => p.id === personId);
        // Rule: Re-use eligibility rules (isEligibleForSeat) for ladder check
        return person && isEligibleForSeat(person, 'OIC', true) ? { person, seatId } : null;
      })
      .filter((x): x is { person: Person; seatId: string } => x !== null);

    if (candidates.length > 0) {
      const best = pickBest(candidates.map(c => c.person), a8OIC.id);
      if (best) {
        assignments[a8OIC.id] = best.id;
        // Also add to assigned set to ensure they aren't somehow reused elsewhere
        assignedPersonIds.add(best.id);
      }
    }
  }

  // Pull 41A8 Driver from 41P2 (any seat, not OIC, and NOT already picked for a8OIC)
  if (a8Driver) {
    const a8OicPersonId = assignments[a8OIC?.id ?? ''];
    const p2Assignments = Object.entries(assignments).filter(
      ([seatId, personId]) => 
        personId && 
        p2SeatIds.includes(seatId) && 
        seatId !== p2OIC?.id &&
        personId !== a8OicPersonId // Rule: Must be a different person than the OIC
    );
    const candidates = p2Assignments
      .map(([seatId, personId]) => {
        const person = people.find((p) => p.id === personId);
        // Rule: Re-use eligibility rules (isEligibleForSeat) for ladder check
        return person && isEligibleForSeat(person, 'DRIVER', true) ? { person, seatId } : null;
      })
      .filter((x): x is { person: Person; seatId: string } => x !== null);

    if (candidates.length > 0) {
      const best = pickBest(candidates.map(c => c.person), a8Driver.id);
      if (best) {
        assignments[a8Driver.id] = best.id;
        assignedPersonIds.add(best.id);
      }
    }
  }

  // === PHASE 4: Backfill vacated 41P2 seats ===
  const backfillSeats = v41P2.seats.filter((seat) => !assignments[seat.id]);
  for (const seat of backfillSeats) {
    const personId = assignSeat(seat, people, history, assignedPersonIds, false);
    if (personId) {
      assignments[seat.id] = personId;
      assignedPersonIds.add(personId);
    }
  }

  // === PHASE 5: ECO ===
  tryAssign(p1ECO, (p) => p.skills.includes('BA'), true);
  tryAssign(p2ECO, (p) => p.skills.includes('BA'), true);

  // === PHASE 6: No skillset → ECO on 41P1 (Rule 8) ===
  const noSkillRemaining = people.filter(
    (p) => !assignedPersonIds.has(p.id) && isAvailable(p) && p.skills.length === 0
  );
  if (p1ECO && !assignments[p1ECO.id] && noSkillRemaining.length > 0) {
    const best = pickBest(noSkillRemaining, p1ECO.id);
    if (best) {
      assignments[p1ECO.id] = best.id;
      assignedPersonIds.add(best.id);
    }
  }

  // Log for debugging
  console.log('[generateBoardAssignments] Result:', assignments);

  return assignments;
}

/**
 * Generate automatic duty assignments following Rule 6:
 * Mess/Tea, Watchroom and Bollies rotate fairly between FF Rank
 * based on longest time since last duty assignment.
 */
export function generateDutyAssignments(
  duties: { id: string; label: string }[],
  people: Person[],
  history: AssignmentHistory[] = [],
  excludedPersonIds: Set<string> = new Set()
): Record<string, string | undefined> {
  const assignments: Record<string, string | undefined> = {};
  const assignedPersonIds = new Set<string>(excludedPersonIds);

  // Only FF rank eligible for duties
  const ffPeople = people.filter((p) => p.rank === 'FF' && isAvailable(p));

  for (const duty of duties) {
    const eligible = ffPeople.filter((p) => !assignedPersonIds.has(p.id));
    if (eligible.length === 0) continue;

    const scored = eligible.map((p) => ({
      person: p,
      score: scoreCandidate(p, duty.id, history),
    }));
    scored.sort((a, b) => a.score - b.score);

    const best = scored[0].person;
    assignments[duty.id] = best.id;
    assignedPersonIds.add(best.id);
  }

  console.log('[generateDutyAssignments] Result:', assignments);
  return assignments;
}

/**
 * Build mock history for testing.
 * In production, this should query Supabase confirmed board history.
 */
export function buildMockHistory(
  people: Person[],
  vehicles: Vehicle[],
  duties: { id: string; label: string }[] = []
): AssignmentHistory[] {
  const history: AssignmentHistory[] = [];
  const now = new Date();

  for (const person of people) {
    for (const vehicle of vehicles) {
      for (const seat of vehicle.seats) {
        // Randomly assign some people to some seats with dates in the past
        if (Math.random() > 0.6) {
          const daysAgo = Math.floor(Math.random() * 60) + 1;
          history.push({
            personId: person.id,
            seatId: seat.id,
            lastDate: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
          });
        } else {
          history.push({
            personId: person.id,
            seatId: seat.id,
            lastDate: null,
          });
        }
      }
    }

    // Mock history for duties too (so rotation works)
    for (const duty of duties) {
      if (Math.random() > 0.6) {
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        history.push({
          personId: person.id,
          seatId: duty.id,
          lastDate: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        });
      } else {
        history.push({
          personId: person.id,
          seatId: duty.id,
          lastDate: null,
        });
      }
    }
  }

  return history;
}
