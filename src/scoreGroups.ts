import _ from 'lodash';
import chalk from 'chalk';
/**
 * @description Gives a score to a given grouping action, so later we can find the best group arrangement
 * Lot of aspects are random generated, so this needed to get a better accuracy
 * @param groups A list of groups to generate a score on
 * @returns number Sum of the standardDeviation value calculated on trueDormitory and female columns, lower is better
 */

export function scoreGroups(groups: StudentVector[][]): number {
    let inSameRoomButNotGroup = 0;
    groups.forEach((group, id) => {
        const rooms = _.groupBy(group, 'room');
        groups.forEach((a, ix) => {
            if (id != ix) {
                Object.keys(rooms).forEach((room) => {
                    if (Object.keys(_.groupBy(a, 'room')).includes(room) && room !== '0') {
                        inSameRoomButNotGroup++;
                    }
                });
            }
        });
    });

    const isImsc = groups[0][0].imsc;

    return (
        inSameRoomButNotGroup +
        standardDeviation(groups.map((group) => group.filter((s) => s.trueDormitory).length)) +
        standardDeviation(groups.map((group) => group.filter((s) => s.gender === 'N').length)) +
        //In IMSc groups the group count is soo important, because all groups must stay under 20 Persons, and they almost fill this total cap
        standardDeviation(groups.map((group) => group.length)) * (isImsc ? 5 : 1)
    );
}

function standardDeviation(array: number[]): number {
    const avg = _.sum(array) / array.length;
    return Math.sqrt(_.sum(_.map(array, (i) => Math.pow(i - avg, 2))) / array.length);
}

export function printGroupStats(groups: MatchedGroup[]) {
    groups.forEach(({ group, label }) => {
        let stats = getGroupStats(group);
        console.log(
            chalk.cyan('[Info]:') +
                chalk.yellow(label) +
                '. group => ' +
                `Dormitory: ${chalk.yellow(stats.dormitoryCount.toString().padStart(2, ' '))} ` +
                `Female: ${
                    stats.femaleCount === 1
                        ? chalk.red(stats.femaleCount.toString().padStart(2, ' '))
                        : chalk.yellow(stats.femaleCount.toString().padStart(2, ' '))
                } ` +
                `Male: ${chalk.yellow(stats.maleCount.toString().padStart(2, ' '))} ` +
                `Total: ${chalk.yellow(stats.totalCount.toString().padStart(2, ' '))} ` +
                `Color: ${chalk
                    .yellow(stats.colors.map((c) => c.color).join(', '))
                    .toString()
                    .padStart(4, ' ')}` +
                (stats.femaleCount === 1 ? chalk.red(' <--- ONLY FEMALE HERE!') : ''),
        );
    });
    console.log(
        chalk.cyan('[Info]:') + ` Total student count: ${chalk.yellow(groups.map((g) => g.group).flat().length)}`,
    );
}

export function getGroupsStats(groups: MatchedGroup[]) {
    return groups.map(({ group, label }) => {
        return { label, stats: getGroupStats(group) };
    });
}

type groupStat = {
    totalCount: number;
    dormitoryCount: number;
    femaleCount: number;
    maleCount: number;
    colors: { color: string; count: number }[]; //All available colors, and it's counts
    dormitoryRatio: number; //Percentage of dormitory students in this group
    gtbCount: number;
};

/**
 * @description Given a group this function generates various metrics about the group
 * @param group The group, on witch we calculate the stats
 */
function getGroupStats(group: StudentVector[]): groupStat {
    const colorGroups = _.groupBy(group, 'color');
    return {
        totalCount: group.length,
        femaleCount: group.filter((s) => s.gender === 'N').length,
        maleCount: group.filter((s) => s.gender === 'F').length,
        dormitoryCount: group.filter((s) => s.trueDormitory).length,
        colors: Object.keys(colorGroups).map((a) => {
            return { color: a, count: colorGroups[a].length };
        }),
        dormitoryRatio: (group.filter((s) => s.trueDormitory).length / group.length) * 100,
        gtbCount: group.filter((s) => s.roomSenior !== '').length,
    };
}
