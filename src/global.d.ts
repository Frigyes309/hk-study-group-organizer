/**
 *  @description
 *  Stores the properties of a student
 */
interface Student {
  /** Unique neptun code for a student stored in a capitalized format */
  neptun: string,
  name: string,
  major: string,
  /** Gender of this student, stored in a hungarian format (F - Male) (N - Female) */
  gender: 'F' | 'N',
  /** Undefined if Student was not in GTB */
  cardSenior: CardSenior | undefined,
  /** Undefined if Student was not in GTB */
  roomSenior: RoomSenior | undefined,
  /** Undefined if Student is not in dormitory */
  room: number | undefined,
  /** Undefined if not assigned yet */
  group: Group | undefined,
}

/**
 * @description
 * Card senior of a Student. There are 20 card seniors. Each card senior has 3 room seniors
 */
interface CardSenior {
  id: number,
  name: string
}

/**
 * @description
 * Room senior of a Student. Each room senior has 9 Student in 3 separate rooms
 */
interface RoomSenior {
  id: number,
  name: string
}

/**
 * @description
 * Each student has a group witch defines the color of a student
 */
interface Group {
  /** eg. [ 'DrWu', 'Fekete', 'Nyuszi', 'SIR', 'TTNY' ] */
  name: string,
  /** eg. [ 'yellow', 'black', 'blue', 'white', 'red' ] */
  color: string,
  /** Where most of the group members can be found in the dormitory */
  mainFloor: number
}