/**
 * Excel imported dataTypes
 */
type StudentGTB = {
    neptun: string;
    roomSenior: string;
    cardSenior: string;
    color: string; //TODO: Make colors strong typed
};

type StudentDormitory = {
    room: number;
    neptun: string;
    color: string;
};

type StudentDH = {
    neptun: string;
    name: string;
    zipCode: number;
    /** Gender of this student, stored in a hungarian format (F - Male) (N - Female) */
    gender: 'F' | 'N'; //TODO: Change gender to ENGLISH format
    imsc: boolean;
    doublePassive: boolean;
    german: boolean;
};

type GroupSeniors = {
    courseCode: string;
    instructor: string;
    seniors: { senior: string; color: string }[];
    desiredColor: string | undefined;
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
    //Name of this batch, only for display purposes
    name: string;
    //All courseCodes for this generation, eg.: [I_IMSc1, I_IMSc2, I_IMSc3]
    courseCodes: string[];
    //Major for the import
    major: Major;
    imsc: boolean;
    german: boolean;
    //How many groups to create
    groupCount: number;
    //Force basic group generation strategy
    basicGroup?: boolean;
    //If true we allow multiple girl room (dormitory) in one group
    allowMultipleGirlRooms: boolean;
};

interface GenerationResult {
    name: string; //Name of this generation batch
    groups: MatchedGroup[];
    imsc: boolean;
    german: boolean;
}

interface MatchedGroup {
    group: StudentVector[];
    label: string;
}
