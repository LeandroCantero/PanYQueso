export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD'
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  stars: number; // 1-5
}

export interface Team {
  name: string;
  players: Player[];
  averageSkill: number;
}

export interface MatchResult {
  teamA: Team;
  teamB: Team;
  analysis: string;
}

// Helper for position colors
export const PositionColors: Record<Position, string> = {
  [Position.GK]: 'bg-neo-yellow',
  [Position.DEF]: 'bg-neo-blue',
  [Position.MID]: 'bg-neo-green',
  [Position.FWD]: 'bg-neo-red',
};

// Helper for Spanish display labels
export const PositionLabels: Record<Position, string> = {
  [Position.GK]: 'ARQ',
  [Position.DEF]: 'DEF',
  [Position.MID]: 'MED',
  [Position.FWD]: 'DEL',
};