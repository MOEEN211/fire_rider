import type { Person, Seat, Vehicle, AvailabilityCode, Duty } from '../types/board';

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
  if (UNAVAILABLE_CODES.includes(person.availability)) {
    return false;
  }
  return person.availability === 'On Duty';
}

function getSeatRequirements(seatLabel: string, isLadder: boolean): SeatRequirement | undefined {
  const baseLabel = seatLabel.replace(/\s\d+$/, '');
  if (isLadder) {
    return LADDER_SEAT_REQUIREMENTS[baseLabel] || LADDER_SEAT_REQUIREMENTS[seatLabel];
  }
  return PUMP_SEAT_REQUIREMENTS[baseLabel] || PUMP_SEAT_REQUIREMENTS[seatLabel];
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
 * 9. WC rank rotates between 41P1 OIC and 41P2 OIC
 * 10. Tie on time → fewer total rides
 */
export function generateBoardAssignments(
  vehicles: Vehicle[],
  people: Person[],
  history: AssignmentHistory[] = []
): Record<string, string | undefined> {
  const assignments: Record<string, string | undefined> = {};
  
  // Trackers per layer as requested by client (independent layers)
  const assignedToPumps = new Set<string>();
  const assignedToLadder = new Set<string>();

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
    ffPriority: boolean = false,
    tracker: Set<string> = assignedToPumps
  ): boolean => {
    if (!seat) return false;

    let candidates = people.filter(
      (p) => !tracker.has(p.id) && isAvailable(p) && filter(p)
    );

    if (candidates.length === 0) return false;

    if (ffPriority) {
      const ffOnly = candidates.filter((p) => p.rank === 'FF');
      if (ffOnly.length > 0) candidates = ffOnly;
    }

    const best = pickBest(candidates, seat.id);
    if (!best) return false;

    assignments[seat.id] = best.id;
    tracker.add(best.id);
    return true;
  };

  const getSeatsByLabel = (vehicle: Vehicle, label: string): Seat[] =>
    vehicle.seats.filter((s) => s.label === label);

  // === LAYER 1: PUMPS (41P1 & 41P2) ===
  
  // 1. OIC Rotation (Rule 9: WC rotates between P1 and P2 based on history)
  const p1OIC = getSeat(v41P1, 'OIC');
  const p2OIC = getSeat(v41P2, 'OIC');
  
  // Pick all eligible OIC candidates (WC and CC with OIC skill)
  const oicCandidates = people.filter(p => isAvailable(p) && p.skills.includes('OIC') && (p.rank === 'WC' || p.rank === 'CC'));
  
  // Find WC specifically for rotation logic
  const wcCandidate = oicCandidates.find(p => p.rank === 'WC');
  const ccCandidates = oicCandidates.filter(p => p.rank === 'CC');
  
  // Check history to determine where WC was last assigned
  let wcLastOnP1 = false;
  if (wcCandidate && history.length > 0) {
    const wcHistoryP1 = history.find(h => h.personId === wcCandidate.id && h.seatId === p1OIC?.id);
    const wcHistoryP2 = history.find(h => h.personId === wcCandidate.id && h.seatId === p2OIC?.id);
    if (wcHistoryP1 && wcHistoryP2) {
      // If both exist, compare dates
      wcLastOnP1 = (wcHistoryP1.lastDate?.getTime() || 0) > (wcHistoryP2.lastDate?.getTime() || 0);
    } else if (wcHistoryP1) {
      wcLastOnP1 = true;
    }
  }
  
  // Assign OICs with rotation: WC alternates, CC fills remaining
  if (p1OIC && p2OIC) {
    if (wcCandidate && !wcLastOnP1) {
      // WC last on P2 (or never), so put WC on P1 this time
      assignments[p1OIC.id] = wcCandidate.id;
      assignedToPumps.add(wcCandidate.id);
      // CC on P2
      const bestCC = pickBest(ccCandidates.filter(p => !assignedToPumps.has(p.id)), p2OIC.id);
      if (bestCC) {
        assignments[p2OIC.id] = bestCC.id;
        assignedToPumps.add(bestCC.id);
      }
    } else if (wcCandidate && wcLastOnP1) {
      // WC last on P1, so put WC on P2 this time
      assignments[p2OIC.id] = wcCandidate.id;
      assignedToPumps.add(wcCandidate.id);
      // CC on P1
      const bestCC = pickBest(ccCandidates.filter(p => !assignedToPumps.has(p.id)), p1OIC.id);
      if (bestCC) {
        assignments[p1OIC.id] = bestCC.id;
        assignedToPumps.add(bestCC.id);
      }
    } else {
      // No WC available, just assign best CC to both
      const bestP1 = pickBest(oicCandidates.filter(p => !assignedToPumps.has(p.id)), p1OIC.id);
      if (bestP1) {
        assignments[p1OIC.id] = bestP1.id;
        assignedToPumps.add(bestP1.id);
      }
      const bestP2 = pickBest(oicCandidates.filter(p => !assignedToPumps.has(p.id)), p2OIC.id);
      if (bestP2) {
        assignments[p2OIC.id] = bestP2.id;
        assignedToPumps.add(bestP2.id);
      }
    }
  }

  // 2. 41P1 Core Drivers & BA
  tryAssign(getSeat(v41P1, 'DRIVER'), (p) => p.skills.includes('LGVE') && p.rank !== 'WC');
  getSeatsByLabel(v41P1, 'BA').forEach(seat => tryAssign(seat, (p) => p.skills.includes('BA'), true));

  // 3. 41P2 Core Drivers & BA
  tryAssign(getSeat(v41P2, 'DRIVER'), (p) => p.skills.includes('LGVE') && p.rank !== 'WC');
  getSeatsByLabel(v41P2, 'BA').forEach(seat => tryAssign(seat, (p) => p.skills.includes('BA'), true));

  // 4. Backfill remaining pump seats
  [v41P1, v41P2].forEach(v => {
    v.seats.forEach(seat => {
      if (!assignments[seat.id]) {
        tryAssign(seat, (p) => isEligibleForSeat(p, seat.label, false));
      }
    });
  });

  // === LAYER 3: ECO Priority (Rule 6) ===
  const p1ECO = getSeat(v41P1, 'ECO');
  const p2ECO = getSeat(v41P2, 'ECO');
  
  // Try assign P1 ECO first
  if (p1ECO && !assignments[p1ECO.id]) {
    tryAssign(p1ECO, (p) => p.skills.includes('BA'), true);
    // If no BA available, use anyone (including no-skill people like Kian Macdonald)
    if (!assignments[p1ECO.id]) {
      tryAssign(p1ECO, (p) => true, false);
    }
  }
  
  // Then try assign P2 ECO - must fill this seat
  if (p2ECO && !assignments[p2ECO.id]) {
    tryAssign(p2ECO, (p) => p.skills.includes('BA'), true);
    // If no BA available, use ANY available person
    if (!assignments[p2ECO.id]) {
      tryAssign(p2ECO, (p) => true, false);
    }
  }

  // === LAYER 4: Final backfill - ensure ALL seats filled ===
  // Fill any remaining empty seats with any available person
  [v41P1, v41P2].forEach(v => {
    v.seats.forEach(seat => {
      if (!assignments[seat.id]) {
        console.log(`[Final Backfill] Filling empty seat ${seat.label} on ${v.name}`);
        tryAssign(seat, (p) => true, false);
      }
    });
  });

  // === LAYER 5: SPECIALIST (41A8) - MUST happen after all pump seats filled ===
  // 41A8 crew MUST come from 41P2 only (not 41P1)
  if (v41A8) {
    const a8OIC = getSeat(v41A8, 'OIC');
    const a8Driver = getSeat(v41A8, 'DRIVER');
    
    // Get the FULL list of people assigned to 41P2 (now all 5 seats should be filled)
    const p2AssignedPeople = v41P2.seats
      .map(seat => assignments[seat.id])
      .filter((id): id is string => !!id)
      .map(id => people.find(p => p.id === id))
      .filter((p): p is Person => !!p);
    
    console.log('[41A8] 41P2 assigned people:', p2AssignedPeople.map(p => p.name));
    console.log('[41A8] Total P2 crew count:', p2AssignedPeople.length);
    
    // Find eligible OIC from 41P2 crew only (must have TTO or OIC skill)
    const p2OICCands = p2AssignedPeople.filter(p => 
      p.skills.includes('TTO') || p.skills.includes('OIC')
    );
    console.log('[41A8] P2 OIC candidates:', p2OICCands.map(p => p.name));
    
    // Find eligible Driver from 41P2 crew only (must have LGVETL)
    const p2DriverCands = p2AssignedPeople.filter(p => 
      p.skills.includes('LGVETL')
    );
    console.log('[41A8] P2 Driver candidates:', p2DriverCands.map(p => p.name));
    
    // Assign 41A8 OIC from P2 crew
    if (a8OIC && p2OICCands.length > 0) {
      const bestOIC = pickBest(p2OICCands, a8OIC.id);
      if (bestOIC) {
        assignments[a8OIC.id] = bestOIC.id;
        console.log('[41A8] Assigned OIC from P2:', bestOIC.name);
      }
    }
    
    // Assign 41A8 Driver from P2 crew (different person from OIC)
    const p2DriverCandsExclOIC = p2DriverCands.filter(p => p.id !== assignments[a8OIC?.id ?? '']);
    if (a8Driver && p2DriverCandsExclOIC.length > 0) {
      const bestDriver = pickBest(p2DriverCandsExclOIC, a8Driver.id);
      if (bestDriver) {
        assignments[a8Driver.id] = bestDriver.id;
        console.log('[41A8] Assigned Driver from P2:', bestDriver.name);
      }
    }
  }

  return assignments;
}

/**
 * Fair rotation for station duties (Mess, Watchroom, Boilers)
 * Only FF rank eligible.
 * NOTE: Duties are an independent layer - people can be assigned to multiple duties
 * concurrently alongside vehicle assignments (41P1, 41P2, 41A8).
 * 
 * Implements strict rotation: tracks duty history and penalizes recent assignments
 * to ensure duties are distributed fairly among all FF people over time.
 */
export function generateDutyAssignments(
  duties: Duty[],
  people: Person[],
  history: AssignmentHistory[]
): Record<string, string | undefined> {
  const assignments: Record<string, string | undefined> = {};

  // Only FF rank eligible for duties
  const ffPeople = people.filter((p) => p.rank === 'FF' && isAvailable(p));
  console.log('[generateDutyAssignments] FF people available:', ffPeople.map(p => p.name));

  if (ffPeople.length === 0) {
    console.log('[generateDutyAssignments] No FF people available');
    return assignments;
  }

  const dutyIds = new Set(duties.map(d => d.id));

  // For each FF person, find how many days ago they last did ANY duty
  // Higher daysSince = hasn't done a duty in longer = higher priority
  const daysSinceAnyDuty = (person: Person): number => {
    const dutyHistory = history.filter(h => h.personId === person.id && dutyIds.has(h.seatId));
    if (dutyHistory.length === 0) return 99999; // never done any duty — top priority
    const mostRecent = dutyHistory.reduce((best, h) =>
      (h.lastDate && (!best.lastDate || h.lastDate > best.lastDate)) ? h : best
    );
    if (!mostRecent.lastDate) return 99999;
    return Math.floor((Date.now() - mostRecent.lastDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Sort FF people by days since any duty (descending = longest ago first)
  // This is the master rotation order for this generation
  const rotationOrder = [...ffPeople].sort((a, b) => {
    const daysA = daysSinceAnyDuty(a);
    const daysB = daysSinceAnyDuty(b);
    if (daysB !== daysA) return daysB - daysA; // longest ago first
    return a.rides - b.rides; // tie-break: fewer rides
  });

  console.log('[generateDutyAssignments] Rotation order:', rotationOrder.map(p => ({
    name: p.name,
    daysSinceAnyDuty: daysSinceAnyDuty(p),
  })));

  // Assign duties in rotation order — each person gets at most one duty per generation
  const assigned = new Set<string>();
  for (const duty of duties) {
    const pick = rotationOrder.find(p => !assigned.has(p.id));
    if (pick) {
      assignments[duty.id] = pick.id;
      assigned.add(pick.id);
      console.log(`[generateDutyAssignments] Assigned ${pick.name} to ${duty.label} (${daysSinceAnyDuty(pick)} days since last duty)`);
    }
  }

  console.log('[generateDutyAssignments] Final assignments:', assignments);
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
