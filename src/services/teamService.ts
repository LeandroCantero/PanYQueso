import { Player, MatchResult, Position } from "../types";

export const generateBalancedTeams = async (players: Player[]): Promise<MatchResult> => {
    // 1. Group players by position
    const goalkeepers = players.filter(p => p.position === Position.GK).sort((a, b) => b.stars - a.stars);
    const defenders = players.filter(p => p.position === Position.DEF).sort((a, b) => b.stars - a.stars);
    const midfielders = players.filter(p => p.position === Position.MID).sort((a, b) => b.stars - a.stars);
    const forwards = players.filter(p => p.position === Position.FWD).sort((a, b) => b.stars - a.stars);

    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // 2. Distribute each group
    const distributeGroup = (group: Player[]) => {
        group.forEach((player, index) => {
            // Alternate starting team based on index to avoid stacking one team with all "first picks" of each position
            // We can flip the order for every other position group to balance it out further
            if (index % 2 === 0) {
                teamA.push(player);
            } else {
                teamB.push(player);
            }
        });
    };

    // Distribute in order of importance/spine
    distributeGroup(goalkeepers);
    distributeGroup(defenders);
    distributeGroup(midfielders);
    distributeGroup(forwards);

    // 3. Calculate stats
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
        analysis: "Equipos generados respetando posiciones y habilidad."
    };
};
