import { Player, MatchResult, Position, SkillMode } from "../types";

// Helper para calcular el rating de un jugador (self-contained, no necesita mode)
// Si tiene physical+skill calcula el promedio, sino usa stars
export const calculatePlayerRating = (player: Player): number => {
  if (player.physical !== undefined && player.skill !== undefined) {
    return (player.physical + player.skill) / 2;
  }
  return player.stars;
};

// Helper para calcular el rating de un jugador según el modo
export const getPlayerRating = (player: Player, mode: SkillMode): number => {
  return calculatePlayerRating(player);
};

// Helper to migrate players from basic to advanced mode
export const migrateToAdvancedMode = (players: Player[]): Player[] => {
  return players.map(p => ({
    ...p,
    physical: p.physical ?? p.stars,
    skill: p.skill ?? p.stars
  }));
};

// Helper to calculate average from rating (not raw stars)
export const getAverageFromRating = (players: Player[], mode: SkillMode): number => {
  if (players.length === 0) return 0;
  const sum = players.reduce((acc, p) => acc + getPlayerRating(p, mode), 0);
  return parseFloat((sum / players.length).toFixed(1));
};

// Fisher-Yates shuffle helper
const shuffle = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const generateBalancedTeams = async (players: Player[], mode: SkillMode = 'basic'): Promise<MatchResult> => {
    // 1. Group players by position
    // Shuffle first to ensure random order for players with same stars
    const goalkeepers = shuffle(players.filter(p => p.position === Position.GK));
    const defenders = shuffle(players.filter(p => p.position === Position.DEF));
    const midfielders = shuffle(players.filter(p => p.position === Position.MID));
    const forwards = shuffle(players.filter(p => p.position === Position.FWD));

    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // Helper to calculate total rating of a team (using mode)
    const getTeamRating = (team: Player[]) => team.reduce((acc, p) => acc + getPlayerRating(p, mode), 0);

    // 2. Initial Distribution (Smart Greedy)
    const allGroups = [goalkeepers, defenders, midfielders, forwards];

    allGroups.forEach(group => {
        group.forEach(player => {
            const ratingA = getTeamRating(teamA);
            const ratingB = getTeamRating(teamB);
            const countA = teamA.length;
            const countB = teamB.length;

            if (countA < countB) {
                teamA.push(player);
            } else if (countB < countA) {
                teamB.push(player);
            } else {
                if (ratingA <= ratingB) {
                    teamA.push(player);
                } else {
                    teamB.push(player);
                }
            }
        });
    });

    // 3. Optimization Step (Hill Climbing)
    // Try to swap players to minimize the difference in total rating
    // while keeping position balance relatively stable.

    const calculateCost = (tA: Player[], tB: Player[]) => {
        const ratingDiff = Math.abs(getTeamRating(tA) - getTeamRating(tB));
        return ratingDiff;
    };

    let currentCost = calculateCost(teamA, teamB);
    let improved = true;
    const MAX_ITERATIONS = 100; // Prevent infinite loops
    let iterations = 0;

    while (improved && iterations < MAX_ITERATIONS) {
        improved = false;
        iterations++;

        // Try swapping every pair
        for (let i = 0; i < teamA.length; i++) {
            for (let j = 0; j < teamB.length; j++) {
                const pA = teamA[i];
                const pB = teamB[j];

                // Only swap if they have the same position (to maintain structure)
                if (pA.position === pB.position) {
                    // Try swap
                    const newRatingA = getTeamRating(teamA) - getPlayerRating(pA, mode) + getPlayerRating(pB, mode);
                    const newRatingB = getTeamRating(teamB) - getPlayerRating(pB, mode) + getPlayerRating(pA, mode);
                    const newCost = Math.abs(newRatingA - newRatingB);

                    if (newCost < currentCost) {
                        // Commit swap
                        teamA[i] = pB;
                        teamB[j] = pA;
                        currentCost = newCost;
                        improved = true;
                        break; // Restart search from new state
                    }
                }
            }
            if (improved) break;
        }
    }

    // 4. Calculate stats using rating helper
    const getAverage = (team: Player[]) => getAverageFromRating(team, mode);

    return {
        teamA: {
            name: "Equipo Pan",
            players: teamA,
            averageSkill: getAverage(teamA)
        },
        teamB: {
            name: "Equipo Queso",
            players: teamB,
            averageSkill: getAverage(teamB)
        },
        analysis: "Equipos optimizados para paridad de habilidad."
    };
};
