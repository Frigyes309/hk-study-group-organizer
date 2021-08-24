import chalk from 'chalk';

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
            courseCodes: courseCodes
                .map((c) => {
                    return {
                        code: c,
                        count: group
                            .map((student) => [student.cardSenior, student.roomSenior])
                            .flat()
                            .filter((a) =>
                                seniors
                                    .filter((s) => s.courseCode === c)[0]
                                    .seniors.map((s) => s.senior)
                                    .includes(a),
                            ).length,
                    };
                })
                .sort((x, y) => x.count - y.count),
        };
    });

    return seniorGroupsCount
        .sort((a, b) => {
            //courseCodes got sorted in the previous step
            return a.courseCodes[0].count - b.courseCodes[0].count;
        })
        .map((group) => {
            const highestCode = group.courseCodes
                .filter((code) => !usedCourseCodes.includes(code.code))
                .sort((x, y) => x.count - y.count)
                .pop();
            if (!highestCode) {
                console.log(chalk.red('[Seniors to Groups]: '), "Can't get highest code count");

                throw new Error("Can't get highest code count");
            }
            usedCourseCodes.push(highestCode.code);
            return {
                group: group.group,
                label: highestCode.code,
            };
        });
}
