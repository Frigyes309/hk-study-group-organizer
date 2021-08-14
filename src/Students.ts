import chalk from 'chalk';
import _ from 'lodash';

/**
 * @description Student class is responsible for storing all students in the
 * calculation, and providing functions to filter students as needed
 */
export class Students {
    /** @private
     * Singleton instance of students class
     */
    private static _instance: Students;

    /** @private
     *  Stores all students in an array, imported from excel files
     *  Each student is identified by it's unique NEPTUN code
     */
    private _students: Student[];

    private constructor() {
        this._students = Array<Student>();
    }

    /**
     * @returns
     * The current instance of this class if exists, or creates a new instance
     */
    public static get instance() {
        // Do you need arguments? Make it a regular static method instead.
        return this._instance || (this._instance = new this());
    }

    /**
     * @description Clears the students array
     */
    public clear() {
        this._students = Array<Student>();
    }

    /**
     * @description Adds a student to the mapping
     * @param student Student to add to the list
     */
    public add(student: Student) {
        student.neptun = student.neptun.toUpperCase();
        if (!this.getByNeptun(student.neptun)) {
            this._students.push(student);
        } else {
            console.log(chalk.yellow('[Students]: '), `This student is already stored, Neptun: ${student.neptun}`);
        }
    }

    /**
     * @description Get's a student from the list, by it's neptun code
     * @param neptun Neptun code to search by
     * @returns Student|undefined The student found by the neptun code
     */
    public getByNeptun(neptun: string): Student | undefined {
        neptun = neptun.toUpperCase();
        return this._students.find((student) => student.neptun === neptun);
    }

    /**
     * @description Get's all students
     */
    public getAll(): Student[] {
        return this._students;
    }

    /**
     * @description Get's all student where the predicate returns true
     * @param predicate Function witch iterated over each Student
     */
    public getAllBy(predicate: (a: Student) => boolean): Student[] {
        return this._students.filter(predicate);
    }

    /**
     * @description Groups students who were in GTB, by its card than room seniors
     * card-1: {
     *   room-1: [
     *     student-1, student-2, etc.
     *   ],
     *   room-2: [
     *     student-1, student-2, etc.
     *   ],
     *   etc.
     * },
     * card-2: { etc. }
     */
    public getGtbSeniorGroups(): { [key: string]: { [key: string]: Student[] } } {
        const gtbStudents = this.getAllBy((student) => student.cardSenior !== '');
        // Create groups from GTB Students by it's cardSenior and roomSenior
        let GtbGroups = _.groupBy(
            // Sort by color, so after groupBy all the same color groupSeniors get after each other
            // This makes all groups the same size on the gtb axis
            gtbStudents.sort((x, y) => x.color.localeCompare(y.color)),
            'cardSenior',
        );
        _.forEach(GtbGroups, (group, key) => {
            // @ts-ignore
            GtbGroups[key] = _.groupBy(GtbGroups[key], 'roomSenior');
        });
        return _.toPlainObject(GtbGroups);
    }
}
