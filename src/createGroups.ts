/**
 * @description Creates student groups
 *  1) Get groupCount many students, who are the furthest away. They will be the
 *     starting point of each group.
 *  2) For each groups center, get the closest student who is not part of a
 *     group yet, and add her/him to the group.
 *  3) Randomly add the gray students to the groups
 *  4) Search for groups where only one female is present, fix that group
 *      //TODO: Write down algorithm for female fixing
 */
import _ from 'lodash';
import chalk from 'chalk';

export class Groups {
    /**
     * @description Distances between ONLY colored students ( Format: neptun-neptun => Distance )
     * @private
     */
    private _distances: Map<string, number>;

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

        console.log(chalk.cyan('[Info]: '), `Colored student count: ${this._coloredStudents.length}`);
        const colorGroups = _.groupBy(this._coloredStudents, 'color');
        Object.keys(colorGroups).forEach((color) => {
            console.log(chalk.cyan('[Info]: '), `- ${color} student count: ${colorGroups[color].length}`);
        });
        console.log(chalk.cyan('[Info]: '), `Gray student count: ${this._grayStudents.length}`);

        this._groupCount = groupCount;
        //Calculate the distances, ONLY for colored students
        //IMPROVEMENT: We calculate all a-b and b-a, and even a-a distance combinations
        //             Distance calculations could be reduced to half
        this._distances = new Map<string, number>(); //string: Neptun-Neptun, number: Distance
        this._coloredStudents.forEach((student1) => {
            this._coloredStudents.forEach((student2) => {
                //Pythagoras theorem to get distance between two students
                const dist = Math.sqrt(Math.pow(student1.x - student2.x, 2) + Math.pow(student1.y - student2.y, 2));
                this._distances.set(student1.neptun + '-' + student2.neptun, dist);
            });
        });
    }

    public createGroups(): string[] {
        return this.getGroupStartStudents(this._coloredStudents);
    }

    /**
     * @description Get groupCount many students, who are the furthest away.
     * They will be the starting point of each group
     * //TODO: Document algorithm
     */
    private getGroupStartStudents(students: StudentVector[]): string[] {
        if (students.length < this._groupCount) {
            console.log(
                chalk.red('[Create Groups]: '),
                `Can't create more groups, than students available. Students: ${students.length}, Groups: ${this._groupCount}`,
            );
            return [];
        }

        let startStudents: string[] = [];

        const maxTwo = _.maxBy(Array.from(this._distances), (s) => s[1]);
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
                                    : this._distances.get(student.neptun + '-' + startStudent) ?? Infinity,
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
}
