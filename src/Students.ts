import _ from "lodash";
import chalk from 'chalk';

export class Students {
  /** @private
   * Singleton instance of students class
   */
  private static _instance: Students;

  /** @private
   *  Stores all students in a mapping, imported from excel files
   *  Each student is identified by it's unique NEPTUN code
   */
  private _students: Map<string, Student>;


  private constructor() {
    this._students = new Map<string, Student>();
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
    this._students.set(student.neptun, student);
  }

  /**
   * @description Get's a student from the list, by it's neptun code
   * @param neptun Neptun code to search by
   * @returns Student|undefined The student found by the neptun code
   */
  public getByNeptun(neptun: string): Student | undefined{
    neptun = neptun.toUpperCase();
    return this._students.get(neptun);
  }
}