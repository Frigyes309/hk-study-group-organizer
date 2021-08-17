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
 * @description Options for the vector generation algo
 */
type VectorOptions = {
    gtbScale: number; //Scale for the gtb vector dimension
    //If we have a color-floor mapping from the last generataion we can use that one
    masterColors?: { color: string; floor: number; cards: string[] }[];
};

type Major = 'Vill' | 'Infó' | 'Üzinfó';

type GenerationType = {
    name: string; //Name of this batch, only for display purposes
    major: Major; //Major for the inport
    imsc: boolean;
    german: boolean;
    groupCount: number; //How many groups to create
    basicGroup?: boolean; //Force basic group generation strategy
    allowMultipleGirlRooms: boolean; //If true we allow multiple girl room (dormitory) in one group
};

interface GenerationResult {
    name: string; //Name of this generation batch
    groups: StudentVector[][];
    imsc: boolean;
    german: boolean;
}
