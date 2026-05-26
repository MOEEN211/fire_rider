export type Seat = {
  id: string;
  label: string;
  personId?: string;
};

export type Vehicle = {
  id: string;
  name: string;
  registration: string;
  seats: Seat[];
};

export type AvailabilityCode =
  | 'On Duty'
  | 'Toil'
  | 'AA'
  | 'AB'
  | 'ME'
  | 'DS'
  | 'PH'
  | 'CL'
  | 'MCL'
  | 'LSL'
  | 'SL'
  | 'TE'
  | 'TI'
  | 'Rest Day'
  | 'Bank Holiday'
  | 'Stand Down';

export type SkillCode = 'OIC' | 'BA' | 'LGVE' | 'LGVETL' | 'TTO';

export type RankCode = 'WC' | 'CC' | 'FF';

export type DutyStatusCode = 'On Duty' | 'On Leave' | 'Sick' | 'Training' | 'Other';

export type Person = {
  id: string;
  marker: string;
  rank: RankCode;
  name: string;
  staffNumber: string;
  skills: SkillCode[];
  dutyStatus: DutyStatusCode;
  rides: number;
  availability: AvailabilityCode;
};

export type Duty = {
  id: string;
  label: string;
  personId?: string;
};

export type CalendarEvent = {
  id: string;
  time: string;
  title: string;
};
