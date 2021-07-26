import chalk from 'chalk';

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
   * @description Adds a student to the mapping
   * @param student Student to add to the list
   */
  public add(student: Student) {
    student.neptun = student.neptun.toUpperCase();
    if(!this.getByNeptun(student.neptun)){
      this._students.push(student);
    }else{
      console.log(chalk.yellow('[Students]: '), `This student is already stored, Neptun: ${student.neptun}`);
    }
  }

  /**
   * @description Get's a student from the list, by it's neptun code
   * @param neptun Neptun code to search by
   * @returns Student|undefined The student found by the neptun code
   */
  public getByNeptun(neptun: string): Student | undefined{
    neptun = neptun.toUpperCase();
    return this._students.find(student => student.neptun === neptun);
  }

  /**
   * @description Get's all students
   */
  public getAll(): Student[]{
    return this._students;
  }

  /**
   * @description Get's all student who's key's value
   * @param key Key of Student type, to get students by
   * @param value Value to be
   */
  public getAllBy(key: keyof Student, value: string | number | boolean): Student[] {
    return this._students.filter(student => student[key] === value);
  }
}