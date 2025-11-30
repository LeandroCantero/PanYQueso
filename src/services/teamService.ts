import { Player, MatchResult, Position } from "../types";

// Fisher-Yates shuffle helper
const shuffle = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const generateBalancedTeams = async (players: Player[]): Promise<MatchResult> => {
    // 1. Group players by position
    // Shuffle first to ensure random order for players with same stars
    const goalkeepers = shuffle(players.filter(p => p.position === Position.GK));
    const defenders = shuffle(players.filter(p => p.position === Position.DEF));
    const midfielders = shuffle(players.filter(p => p.position === Position.MID));
    const forwards = shuffle(players.filter(p => p.position === Position.FWD));

    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // Helper to calculate total stars of a team
    const getTeamStars = (team: Player[]) => team.reduce((acc, p) => acc + p.stars, 0);

    // 2. Initial Distribution (Smart Greedy)
    const allGroups = [goalkeepers, defenders, midfielders, forwards];

    allGroups.forEach(group => {
        group.forEach(player => {
            const starsA = getTeamStars(teamA);
            const starsB = getTeamStars(teamB);
            const countA = teamA.length;
            const countB = teamB.length;

            if (countA < countB) {
                teamA.push(player);
            } else if (countB < countA) {
                teamB.push(player);
            } else {
                if (starsA <= starsB) {
                    teamA.push(player);
                } else {
                    teamB.push(player);
                }
            }
        });
    });

    // 3. Optimization Step (Hill Climbing)
    // Try to swap players to minimize the difference in total stars
    // while keeping position balance relatively stable.

    const calculateCost = (tA: Player[], tB: Player[]) => {
        const starsDiff = Math.abs(getTeamStars(tA) - getTeamStars(tB));
        // We could add position penalty here if we wanted to enforce strict position matching,
        // but for now, we prioritize stars as requested.
        return starsDiff;
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
                // OR if the user doesn't care about structure (but usually they do).
                // Let's be flexible: Allow swapping if same position OR if it improves balance significantly.
                // For "Pan y Queso", usually position matters. Let's stick to same position swaps first.
                if (pA.position === pB.position) {
                    // Try swap
                    const newStarsA = getTeamStars(teamA) - pA.stars + pB.stars;
                    const newStarsB = getTeamStars(teamB) - pB.stars + pA.stars;
                    const newCost = Math.abs(newStarsA - newStarsB);

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

    // 4. Calculate stats
    const getAverage = (team: Player[]) => {
        if (team.length === 0) return 0;
        const sum = team.reduce((acc, p) => acc + p.stars, 0);
        return parseFloat((sum / team.length).toFixed(1));
    };

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
        analysis: "Equipos optimizados para paridad de estrellas."
    };
};
