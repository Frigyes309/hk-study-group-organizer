/**
 * Excel imported dataTypes
 */
type StudentGTB = {
    neptun: string;
    roomSenior: string;
    cardSenior: string;
    color: string;
};

type StudentDormitory = {
    name: string;
    neptun: string;
    score: number;
    major: string;
    admissionType: string;
    color: string;
    room: number;
};

type StudentDH = {
    neptun: string;
    name: string;
    zipCode: number;
    /** Gender of this student, stored in a hungarian format (F - Male) (N - Female) */
    gender: 'F' | 'N';
    imsc: boolean;
    doublePassive: boolean;
    german: boolean;
};

type Vector = {
    x: number;
    y: number;
};

/**
 *  @description
 *  Stores the properties of a student and other metadata about them
 */

type Student = StudentGTB &
    StudentDH &
    StudentDormitory & {
        //True if this student will actually live in the dorm, or just got a random room for generation
        trueDormitory: boolean;
        //To witch group this student is assigned
        groupId: number;
    };

/**
 * @description
 * Combined student type with a vector
 */
type StudentVector = Student & Vector;

/**
 * @description
 * Each student has a group witch defines the color of a student
 */
interface Group {
    /** eg. [ 'DrWu', 'Fekete', 'Nyuszi', 'SIR', 'TTNY' ] */
    name: string;
    /** eg. [ 'yellow', 'black', 'blue', 'white', 'red' ] */
    color: string;
    /** Where most of the group members can be found in the dormitory */
    mainFloor: number;
}
