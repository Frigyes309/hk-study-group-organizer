import _ from 'lodash';
import chalk from 'chalk';
/**
 * @description Gives a score to a given grouping action, so later we can find the best group arrangement
 * Lot of aspects are random generated, so this needed to get a better accuracy
 * @param groups A list of groups to generate a score on
 * @returns number Sum of the standardDeviation value calculated on trueDormitory and female columns, lower is better
 */

export function scoreGroups(groups: StudentVector[][]): number {
    return (
        standardDeviation(groups.map((group) => group.filter((s) => s.trueDormitory).length)) +
        standardDeviation(groups.map((group) => group.filter((s) => s.gender === 'N').length))
    );
}

function standardDeviation(array: number[]): number {
    const avg = _.sum(array) / array.length;
    return Math.sqrt(_.sum(_.map(array, (i) => Math.pow(i - avg, 2))) / array.length);
}

export function printGroupStats(groups: StudentVector[][]) {
    groups.forEach((group, id) => {
        const femaleCount = group.filter((student) => student.gender == 'N').length;
        console.log(
            chalk.cyan('[Info]:') +
                chalk.yellow(id.toString().padStart(3, ' ')) +
                '. group => ' +
                `Dormitory: ${chalk.yellow(
                    group
                        .filter((s) => s.trueDormitory)
                        .length.toString()
                        .padStart(2, ' '),
                )} ` +
                `Female: ${
                    femaleCount === 1
                        ? chalk.red(femaleCount.toString().padStart(2, ' '))
                        : chalk.yellow(femaleCount.toString().padStart(2, ' '))
                } ` +
                `Male: ${chalk.yellow((group.length - femaleCount).toString().padStart(2, ' '))} ` +
                `Total: ${chalk.yellow(group.length.toString().padStart(2, ' '))}` +
                (femaleCount === 1 ? chalk.red(' <--- ONLY FEMALE HERE!') : ''),
        );
    });
    console.log(`Total student count: ${chalk.yellow(groups.flat().length)}`);
}
