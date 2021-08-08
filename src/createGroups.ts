import _ from 'lodash';
import chalk from 'chalk';

export class Groups {
    /**
     * @description Distances between ONLY colored students ( Format: neptun-neptun => Distance )
     * @private
     */
    //private _distances: Map<string, number>;

    /**
     * @description Stores all students with vector values
     * @private
     */
    private _coloredStudents: StudentVector[];

    private _grayStudents: StudentVector[];

    /**
     * @description How many study groups to create
     * @private
     */
    private _groupCount: number;

    /**
     * @param students Students array, with it's vector values
     * @param groupCount How many student groups to create
     */
    public constructor(students: StudentVector[], groupCount: number) {
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

        this._groupCount = groupCount;
    }

    /**
     * @description Creates study groups
     * - 0) Treat students together who are in the same room
     * - 1) First deal with students who actually are in the dorm, than the rest colored, than the grays
     * - 2) Get every group start room
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
     */
    public createGroups(): StudentVector[][] {
        const startStudent = this.getGroupStartRooms(this._coloredStudents.filter((student) => student.trueDormitory));
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
            const room = this._coloredStudents.filter((student) => student.room === s.room && student.trueDormitory);

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
        while (inadequateGroupCount <= groups.length) {
            //Before each group pass shuffle the groups order, this will result better student distribution
            groups = _.shuffle(groups);

            groups.forEach((group) => {
                const groupCenter = this.getGroupCenter(group);
                const closestStudent = _.minBy(
                    remainingStudents.map((student) => {
                        const dist = Math.sqrt(
                            Math.pow(student.x - groupCenter.x, 2) + Math.pow(student.y - groupCenter.y, 2),
                        );
                        return { student, dist };
                    }),
                    'dist',
                );

                if (!closestStudent) {
                    if (remainingStudents.length !== 0) {
                        console.log(
                            chalk.red('[Create Groups]: '),
                            'Closest student must exist, there are still remaining students',
                        );
                    }
                    return;
                }

                //Get her/his roommates
                const room = remainingStudents.filter((student) => student.room === closestStudent.student.room);

                if (this.getGroupFloor(group) !== Math.floor(room[0].room / 100) * 100) {
                    //Can't add them because they are in a different floor
                    inadequateGroupCount++;
                    //return;
                } else if (this.isFemaleRoom(room) && this.groupHasFemaleRoom(group)) {
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

        //Distribute gray females equally in the study groups
        let grayFemales = this._grayStudents.filter((s) => s.gender === 'N');
        while (grayFemales.length !== 0) {
            //Add a female to the smallest female count group, until we have females left
            const smallestFemaleCountGroup = _.minBy(groups, (group) => group.filter((s) => s.gender === 'N').length);
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
     * @description Get groupCount many students, who are the furthest away.
     * They will be the starting point of each group
     * //TODO: Document algorithm
     */
    private getGroupStartRooms(students: StudentVector[]): string[] {
        if (students.length < this._groupCount) {
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

        while (startStudents.length !== this._groupCount) {
            const newStartStudent = _.maxBy(
                students.map((student) => {
                    return _.minBy(
                        startStudents.map((startStudent) => {
                            return {
                                distance: startStudents.includes(student.neptun)
                                    ? 0
                                    : distances.get(student.neptun + '-' + startStudent) ?? Infinity,
                                neptun: student.neptun,
                            };
                        }),
                        (s) => s.distance,
                    );
                }),
                (s: { distance: number; neptun: string } | undefined) => (s ? s.distance : 0),
            );
            if (!newStartStudent) {
                console.log(
                    chalk.red('[Create Group]:'),
                    `Can't find next group start student for id: ${startStudents.length}`,
                );
                break;
            }
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
        const rooms = Object.keys(_.groupBy(students, (student) => Math.floor(student.room / 100) * 100));
        if (rooms.length !== 1) {
            console.log(chalk.red('[Group Floor]:'), ' There are multiple floor students in this group');
            return NaN;
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
