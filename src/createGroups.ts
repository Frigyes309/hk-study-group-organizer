import chalk from 'chalk';
import _ from 'lodash';

export class Groups {
    /**
     * @description Stores all students with vector values
     * @private
     */
    private _coloredStudents: StudentVector[];

    private _grayStudents: StudentVector[];

    /**
     * @description Filter for the start students, so starts students can be only this colors
     * This makes sense if we have more colors, then groups to generate.
     * @private
     */
    private _startStudentsColorFilter: string[];

    /**
     * @description How many study groups to create
     * @private
     */
    private _groupCount: number;

    /**
     * @param students Students array, with it's vector values
     * @param groupCount How many student groups to create
     * @param desiredColors
     */
    public constructor(students: StudentVector[], groupCount: number, desiredColors: (string | undefined)[]) {
        this._coloredStudents = students.filter((s) => s.color !== 'gray');
        this._grayStudents = students.filter((s) => s.color === 'gray');

        /*console.log(chalk.cyan('[Info]: '), `Colored student count: ${this._coloredStudents.length}`);
        const colorGroups = _.groupBy(this._coloredStudents, 'color');
        Object.keys(colorGroups).forEach((color) => {
            console.log(chalk.cyan('[Info]: '), `- ${color} student count: ${colorGroups[color].length}`);
        });
        console.log(chalk.cyan('[Info]: '), `Gray student count: ${this._grayStudents.length}`);
        console.log(chalk.cyan('[Info]: '), ` - Female: ${this._grayStudents.filter((s) => s.gender === 'N').length}`);
        console.log(chalk.cyan('[Info]: '), ` - Male:   ${this._grayStudents.filter((s) => s.gender === 'F').length}`);*/

        const colorGroups = _.groupBy(
            students.filter((s) => s.color !== 'gray' && desiredColors.includes(s.color)).map((s) => s.color),
        );

        const colors = Object.keys(colorGroups)
            .map((key) => {
                return { color: key, count: colorGroups[key].length };
            })
            .sort((x, y) => x.count - y.count);

        this._startStudentsColorFilter = [];
        for (let i = 0; i < groupCount; i++) {
            if (colors.length > 0) {
                this._startStudentsColorFilter.push(colors.pop()!.color);
            }
        }

        this._groupCount = groupCount;
    }

    /**
     * @description Creates study groups
     * - 0) Treat students together who are in the same room
     * - 1) First deal with students who actually are in the dorm, than the rest colored, than the grays
     * - 2) Get every group start student and her/his room
     * - 3) For every group search the closest student room, and put them into that group
     *       - Disallow to put student rooms in group, if they are in an other floor in the dorm (distance is to high)
     *       - Disallow to put two girl rooms in the same study groups
     *       - Do this until we allowed to put students in any of the groups
     * - 4) For rest of the students searches the closest group, and put them into that group
     *       - Note: here only will be students if there are more girl rooms in any floor, than groups on that floor
     *       - TODO: Also implement this 4th step
     * - 5) Put gray students (who have no vector value), in groups
     *       - First fill the females, always put her to the group with the least females
     *       - Than with males make the group counts even
     * @returns StudentVector[][] Student groups created
     */
    public createGroups(config: {
        allowMultipleGirlRooms: boolean;
        desiredColors: (string | undefined)[];
    }): StudentVector[][] {
        const startStudent = this.getGroupStartStudents(
            this._coloredStudents.filter((student) => student.trueDormitory),
            config.desiredColors,
        );
        if (!startStudent) {
            console.log(chalk.red('[Create Groups]: '), 'Group start students are empty');
            return [];
        }
        //Each study groups will be an array of students
        let groups = startStudent.map((neptun) => {
            const s = this._coloredStudents.find((s) => s.neptun === neptun);
            if (!s) {
                console.log(chalk.red('[Create Groups]: '), `Can't find original student data for neptun: ${neptun}`);
                process.exit(1);
            }
            //Find her/his roommates
            const room = this._coloredStudents.filter((student) => student.room === s.room);

            return [...room];
        });

        //First for the remainingStudents put only the trueDormitory students
        let remainingStudents = this._coloredStudents
            .filter((student) => student.trueDormitory)
            //Filter out start students
            .filter((student) => !groups.flat().some((groupS) => groupS!.neptun === student.neptun));

        //If a room is inadequate for a group count this group, if this number goes higher or equal to the group count
        //we know that this room can't fit any group, by this conditions => Go to the next step
        let inadequateGroupCount = 0;
        //For every group search the closest student room, and put them into that group
        while (remainingStudents.length !== 0) {
            //Before each group pass shuffle the groups order, this will result better student distribution
            groups = _.shuffle(groups);

            inadequateGroupCount = 0;
            groups.forEach((group) => {
                const groupCenter = this.getGroupCenter(group);
                //For the closest calculation first use the colors we have groups for, (This only makes sense if we have more colors than groups)
                let filteredRemainingStudents = remainingStudents.filter((s) =>
                    this._startStudentsColorFilter.includes(s.color),
                );
                //Then the rest
                if (filteredRemainingStudents.length === 0) {
                    filteredRemainingStudents = remainingStudents;
                }
                const closestStudent = _.minBy(
                    filteredRemainingStudents
                        .map((student) => {
                            if (student.x === undefined || student.y === undefined) {
                                console.log(`[Create Groups]: Student ${student.neptun} has no vector value`);
                                return null; // Filter out invalid students
                            }
                            const dist = Math.sqrt(
                                Math.pow(student.x - groupCenter.x, 2) + Math.pow(student.y - groupCenter.y, 2),
                            );
                            return { student, dist };
                        })
                        .filter(Boolean), // Remove null values from the array
                    'dist',
                );

                if (!closestStudent) {
                    if (remainingStudents.length !== 0) {
                        // console.log(
                        //     chalk.red('[Create Groups]: '),
                        //     'Closest student must exist, there are still remaining students',
                        // );
                    }
                    return;
                }

                //Get her/his roommates
                const room = remainingStudents.filter((student) => student.room === closestStudent.student.room);

                if (
                    //this.getGroupFloor(group) !== Math.floor(room[0].room / 100) * 100 &&
                    //This room is not on the same floor
                    group.filter((s) => Math.floor(room[0].room / 100) * 100 == Math.floor(s.room / 100) * 100)
                        .length === 0
                ) {
                    //But no other group exists with this color's
                    if (groups.flat().filter((s) => s.color === room[0].color).length === 0) {
                        //Still add this room to this group
                        inadequateGroupCount = 0;
                        group.push(...room);
                    } else {
                        //Can't add them because they are in a different floor, and there is a group for them
                        inadequateGroupCount++;
                    }
                } else if (
                    this.isFemaleRoom(room) &&
                    this.groupHasFemaleRoom(group) &&
                    !config.allowMultipleGirlRooms
                ) {
                    //Can't add them because this study group already has a female room
                    inadequateGroupCount++;
                    //return;
                } else {
                    inadequateGroupCount = 0;
                    group.push(...room);
                }

                //Remove now added students from the remaining students
                remainingStudents = remainingStudents.filter(
                    (student) => !groups.flat().some((groupS) => groupS!.neptun === student.neptun),
                );
                if (remainingStudents.length === 0) {
                    //console.log(chalk.green('[Create Groups]:'), ' Successfully grouped dormitory students');
                    //Make a new batch of remaining students from students who are fakeDorm students
                    //Basically all remaining colored students
                    remainingStudents = this._coloredStudents.filter(
                        (student) => !groups.flat().some((groupS) => groupS!.neptun === student.neptun),
                    );
                    if (remainingStudents.length === 0) {
                        //console.log(chalk.green('[Create Groups]:'), ' Successfully grouped non dormitory students');
                        //No students remaining exit the loop
                        inadequateGroupCount = Infinity;
                        return;
                    }
                }
            });
        }
        if (remainingStudents.length !== 0) {
            console.log('HE?');
        }

        //Distribute gray females equally in the study groups
        let grayFemales = this._grayStudents.filter((s) => s.gender === 'N');
        while (grayFemales.length !== 0) {
            //Add a female to the smallest female count group, until we have females left
            const smallestFemaleCountGroup = _.minBy(
                groups.filter((g) => {
                    //For this 0 female count group only one female is available, skip this group
                    return !(grayFemales.length < 2 && g.filter((s) => s.gender === 'N').length === 0);
                }),
                (group) => group.filter((s) => s.gender === 'N').length,
            );
            if (!smallestFemaleCountGroup) {
                console.log(chalk.red('[Gray Female Distribute]: '), 'Smallest count female study group not exists');
                break;
            }
            const newFemale = grayFemales.shift();
            if (!newFemale) {
                console.log(chalk.red('[Gray Female Distribute]: '), 'New female should exist');
                break;
            }
            smallestFemaleCountGroup.push(newFemale);
        }

        //Distribute gray males so that each group have almost the same size
        let grayMales = this._grayStudents.filter((s) => s.gender === 'F');
        while (grayMales.length !== 0) {
            //Add a female to the smallest female count group, until we have females left
            const smallestGroup = _.minBy(groups, (group) => group.length);
            if (!smallestGroup) {
                console.log(chalk.red('[Gray Distribute]: '), 'Smallest count study group not exists');
                break;
            }
            const newStudent = grayMales.shift();
            if (!newStudent) {
                console.log(chalk.red('[Gray Distribute]: '), 'New student should exist');
                break;
            }
            smallestGroup.push(newStudent);
        }

        groups.forEach((group, id) => {
            //Assign group ids to the students
            group.map((student) => {
                student.groupId = id;
                return student;
            });
        });

        return groups;
    }

    /**
     * @description Randomly creates student groups, this is useful for small batches of students, like
     * IMSC, Deutch and Bprof
     */
    public createBasicGroups(): StudentVector[][] {
        let groups = Array<StudentVector[]>();
        for (let i = 0; i < this._groupCount; i++) {
            groups.push([]);
        }

        let groupId = 0;
        _.shuffle(this._coloredStudents).forEach((student) => {
            if (groupId >= this._groupCount) groupId = 0;
            groups[groupId].push(student);
            groupId++;
        });
        _.shuffle(this._grayStudents).forEach((student) => {
            if (groupId >= this._groupCount) groupId = 0;
            groups[groupId].push(student);
            groupId++;
        });

        return groups;
    }

    /**
     * @description Get groupCount many students, who are the furthest away.
     * They will be the starting point of each group
     * //TODO: Document algorithm
     */
    private getGroupStartStudents(students: StudentVector[], desiredColors: (string | undefined)[]): string[] {
        students = students
            //Apply the _startStudentsColorFilter, so start students only can be this colored
            .filter((s) => this._startStudentsColorFilter.includes(s.color))
            //Apply the desired colors filter, in this step this is necessary for the first two students generation
            .filter((s) => desiredColors.includes(s.color));

        if (students.length < this._groupCount) {
            //If count is not enough do the same color filtering, but with all students
            students = this._coloredStudents
                //.filter((s) => this._startStudentsColorFilter.includes(s.color))
                .filter((s) => desiredColors.includes(s.color));
        }

        if (students.length < this._groupCount) {
            //If still not enough we are doomed :/
            console.log(
                chalk.red('[Create Groups]: '),
                `Can't create more groups, than students available. Students: ${students.length}, Groups: ${this._groupCount}`,
            );
            return [];
        }

        //Calculate the distances
        //IMPROVEMENT: We calculate all a-b and b-a, and even a-a distance combinations
        //             Distance calculations could be reduced to half
        let distances = new Map<string, number>(); //string: Neptun-Neptun, number: Distance
        students.forEach((student1) => {
            students.forEach((student2) => {
                //Pythagoras theorem to get distance between two students
                const dist = Math.sqrt(Math.pow(student1.x - student2.x, 2) + Math.pow(student1.y - student2.y, 2));
                distances.set(student1.neptun + '-' + student2.neptun, dist);
            });
        });

        let startStudents: string[] = [];

        const maxTwo = _.maxBy(Array.from(distances), (s) => s[1]);
        if (!maxTwo) {
            console.log(chalk.red('[Create Group]:'), ' At least two students are required to calculate max distance');
            return [];
        }
        startStudents.push(...maxTwo[0].split('-'));

        //Remove the start students two colors from the desired colors list
        students
            .filter((s) => startStudents.includes(s.neptun))
            .map((s) => s.color)
            .forEach((color) => {
                desiredColors.splice(desiredColors.indexOf(color), 1);
            });
        const GC = this._groupCount;
        while (startStudents.length !== this._groupCount) {
            const newStartStudent = _.maxBy(
                (function () {
                    const filteredStudents = students.filter((student) => desiredColors.includes(student.color));
                    const initialFilteredCount = filteredStudents.length;

                    if (initialFilteredCount < GC) {
                        const additionalStudentsNeeded = GC - initialFilteredCount;
                        const remainingStudents = students.filter((student) => !desiredColors.includes(student.color));
                        filteredStudents.push(...remainingStudents.slice(0, additionalStudentsNeeded));
                        console.log(
                            `NEPTUN of student who were swapped: ${remainingStudents
                                .slice(0, additionalStudentsNeeded)
                                .map((s) => s.neptun)}`,
                        );
                    }

                    return filteredStudents.map((student) => {
                        return _.minBy(
                            startStudents.map((startStudent) => {
                                return {
                                    distance: startStudents.includes(student.neptun)
                                        ? 0
                                        : distances.get(student.neptun + '-' + startStudent) ?? Infinity,
                                    neptun: student.neptun,
                                    color: student.color,
                                };
                            }),
                            (s) => s.distance,
                        );
                    });
                })(),
                (s) => (s ? s.distance : 0),
            );

            if (!newStartStudent) {
                console.log(
                    chalk.red('[Create Group]:'),
                    `Can't find next group start student for id: ${startStudents.length}`,
                );
                break;
            }
            //Remove from desiredColors
            desiredColors.splice(desiredColors.indexOf(newStartStudent.color), 1);
            startStudents.push(newStartStudent.neptun);
        }
        return startStudents;
    }

    /**
     * For a group of student calculates the "center of mass"
     * @param students Students to calculate for
     * @private
     */
    private getGroupCenter(students: (StudentVector | undefined)[]): Vector {
        let center = students.reduce(
            (total, next) => {
                if (!next) return total;
                total.x += next.x;
                total.y += next.y;
                return total;
            },
            { x: 0, y: 0 },
        );
        center.x /= students.length;
        center.y /= students.length;
        return center;
    }

    /**
     * Determines witch dorm floor a study group is at, handles errors
     * @param students study group
     * @private
     */
    private getGroupFloor(students: StudentVector[]): number {
        if (students.length === 0) {
            console.log(chalk.red('[Group Floor]:'), " Can't calculate floor for empty group");
            return NaN;
        }
        const rooms = _.groupBy(students, (student) => Math.floor(student.room / 100) * 100);
        if (Object.keys(rooms).length !== 1) {
            //console.log(chalk.red('[Group Floor]:'), ' There are multiple floor students in this group');
            //We have more than one color on this floor, get the most common
            return Number(
                _.maxBy(
                    Object.keys(rooms).map((key) => {
                        return { floor: key, count: rooms[key].length };
                    }),
                    (a) => a.count,
                )!.floor,
            );
        }
        return Number(rooms[0]);
    }

    /**
     * Determines for a room, if that room is a female room
     * A room is a female room if at least half of the students there are females
     * @param room Room of students
     * @private
     */
    private isFemaleRoom(room: StudentVector[]): boolean {
        if (room.length === 0) return false;
        return room.filter((s) => s.gender === 'N').length >= room.length / 2;
    }

    /**
     * Determines for a study group if it contains at least one female room
     * @param group Study group to search in
     * @private
     */
    private groupHasFemaleRoom(group: StudentVector[]): boolean {
        const rooms = _.groupBy(group, (student) => Math.floor(student.room / 100) * 100);
        return !!Object.keys(rooms).find((key) => this.isFemaleRoom(rooms[key]));
    }
}
