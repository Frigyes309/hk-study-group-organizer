import chalk from 'chalk';
import _ from 'lodash';

export function matchSeniorsToGroups(
    groups: StudentVector[][],
    courseCodes: string[],
    seniors: GroupSeniors[],
): MatchedGroup[] {
    if (courseCodes.length !== groups.length) {
        console.log(chalk.red('[Seniors to Groups]: '), 'Groups and course codes length are different');
        throw new Error('Groups and course codes length are different');
    }

    //If we assign a label to a group, we mark that label as used
    let usedCourseCodes: string[] = [];

    //For each group we count how many card, or room seniors are match to the group senior candidates
    //Then for each group senior candidates we choose the highest available group
    const seniorGroupsCount = groups.map((group) => {
        return {
            group,
            color: _.head(
                _(group.map((s) => s.color).filter((a) => a !== 'gray'))
                    .countBy()
                    .entries()
                    .maxBy(_.last),
            ),
            courseCodes: courseCodes
                .map((c) => {
                    return {
                        code: c,
                        //Get group's color => Most frequent color in the group
                        desiredColor: seniors.filter((a) => a.courseCode === c)[0].desiredColor,
                        count: group
                            .map((student) => [/*student.cardSenior,*/ student.roomSenior])
                            .flat()
                            .filter((a) =>
                                seniors
                                    .filter((s) => s.courseCode === c)[0]
                                    .seniors.map((s) => s.senior)
                                    .includes(a),
                            ).length,
                    };
                })
                .sort((x, y) => y.count - x.count),
        };
    });

    return seniorGroupsCount
        .sort((a, b) => {
            //courseCodes got sorted in the previous step
            return b.courseCodes[0].count - a.courseCodes[0].count;
        })
        .map((group) => {
            let highestCode = group.courseCodes
                .filter((code) => !usedCourseCodes.includes(code.code))
                .filter((code) => code.desiredColor === group.color)
                .sort((x, y) => x.count - y.count)
                .pop();
            if (!highestCode) {
                //Do the same, but with no color filter
                highestCode = group.courseCodes
                    .filter((code) => !usedCourseCodes.includes(code.code))
                    .sort((x, y) => x.count - y.count)
                    .pop();
            }
            if (!highestCode) {
                debugger;
                console.log(chalk.red('[Seniors to Groups]: '), "Can't get highest code count");
                throw new Error("Can't get highest code count");
            }
            usedCourseCodes.push(highestCode.code);
            return {
                group: group.group,
                label: highestCode.code,
                groupColor: group.color as string,
            };
        });
}
