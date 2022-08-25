import chalk from 'chalk';
const excel = require('convert-excel-to-json');

/**
 * @description
 * Imports a general sheet from any excel file based on the columnMap provided
 * @param path Path to the current excel file
 * @param columnMap column ids ( eg. A, B, ... ) mapped to object names ( eg. neptun, roomSenior, ... )
 * @param rowsToSkip how many first rows to skip, default: 1
 * @param sheetName name of the sheet which to read from, if only one sheet is present it's not necessary
 *
 * @returns excelSheet|undefined Excel sheet converted to an array of objects, object keys from columnMap
 */
function importSheet(
    path: string,
    columnMap: { [key: string]: string },
    sheetName: string | undefined = undefined,
    rowsToSkip = 1,
): [{ [key: string]: any }] | undefined {
    const data = excel({
        sourceFile: path,
        header: {
            rows: rowsToSkip,
        },
        columnToKey: columnMap,
    });

    if (!data) {
        console.error(chalk.red('[Excel Import]: ') + "Can' t read excel file: " + path);
    }

    let sheet;
    const keys = Object.keys(data);

    //Get the sheet from excel, first try to get the sheet by name
    //If no name is provided and only one sheet exists grab the first sheet
    if (sheetName) {
        sheet = data[sheetName];
        if (!sheet) {
            console.error(
                chalk.red('[Excel Import]: ') +
                    `Can't find this sheet: [${sheetName}], available names: [${keys.join()}]`,
            );
        }
    } else {
        if (keys.length > 1) {
            console.error(
                chalk.red('[Excel Import]: ') +
                    `No sheet name is provided for import and there are multiple sheets: [${keys.join()}], importing the first one`,
            );
        }
        //In excel at least one sheet is always present
        sheet = data[keys[0]];
    }
    return sheet;
}

/**
 * Imports an excel file containing students who were in GTB
 * @param path Path to the excel file
 * @param sheetName Name of the sheet if more than one is present in the excel
 *
 */
export function importGTB(path: string, sheetName: string | undefined = undefined): [StudentGTB] | undefined {
    let sheet = importSheet(
        path,
        {
            A: 'neptun',
            B: 'cardSenior',
            C: 'roomSenior',
            D: 'color',
        },
        sheetName,
    );
    if (!sheet) {
        console.log(chalk.red('[Excel Import]: ') + `Can't import GTB excel file: ${path}`);
        return undefined;
    }
    //Convert the neptun code to uppercase format
    sheet.map((row) => {
        return {
            ...row,
            neptun: row.neptun.toUpperCase(),
        };
    });
    // @ts-ignore
    return sheet;
}

/**
 * Imports an excel file containing students who will live in the dormitory
 * @param path Path to the excel file
 * @param sheetName Name of the sheet if more than one is present in the excel
 */
export function importDormitory(
    path: string,
    sheetName: string | undefined = undefined,
): [StudentDormitory] | undefined {
    //TODO: Currently wait list is being ignored => Everyone is gray from there
    // Student's color on the wait list is known, maybe assign random rooms on the floor for them?
    let sheet = importSheet(
        path,
        {
            A: 'room',
            B: 'neptun',
            C: 'color',
            //A: 'name',
            //G: 'score',
            //I: 'major',
            //K: 'admissionType',
        },
        sheetName,
    );
    if (!sheet) {
        console.log(chalk.red('[Excel Import]: ') + `Can't import Dormitory excel file: ${path}`);
        return undefined;
    }
    //Convert the neptun code to uppercase format
    sheet.map((row) => {
        return {
            ...row,
            neptun: row.neptun.toUpperCase(),
        };
    });
    // @ts-ignore
    return sheet;
}

/**
 * Imports an excel file containing all students who got accepted to the University
 * @param path Path to the excel file
 * @param sheetName Name of the sheet if more than one is present in the excel
 */
export function importDH(path: string, sheetName: string | undefined = undefined): [StudentDH] | undefined {
    let sheet = importSheet(
        path,
        {
            B: 'neptun',
            C: 'name',
            D: 'zipCode',
            E: 'gender',
            F: 'imsc',
            G: 'doublePassive',
            H: 'german',
        },
        sheetName,
    );
    if (!sheet) {
        console.log(chalk.red('[Excel Import]: ') + `Can't import DH excel file: ${path}`);
        return undefined;
    }
    //Convert the neptun code to uppercase format
    // @ts-ignore
    sheet = sheet.map((row) => {
        return {
            ...row,
            neptun: row.neptun.toUpperCase(),
            gender: row.gender == 'Férfi' ? 'F' : 'N',
            imsc: row.imsc == 'X',
            doublePassive: row.doublePassive == 'X',
            german: row.german == 'X',
        };
    });
    // @ts-ignore
    return sheet;
}

/**
 * @description Imports an excel file containing all groupSeniors, and their colors.
 * This later used to map the generated group to the available groupSeniors
 */
export function importGroupSeniors(path: string, sheetName: string | undefined = undefined): GroupSeniors[] {
    let sheet = importSheet(
        path,
        {
            A: 'courseCode',
            //B: 'day', //Time of the group session
            //C: 'hours',
            D: 'instructor',
            E: 'senior1',
            F: 'senior2',
            G: 'senior3',
            H: 'senior4',
            I: 'color1',
            J: 'color2',
            K: 'color3',
            L: 'color4',
            N: 'desiredColor',
        },
        sheetName,
    );
    if (!sheet) {
        console.log(chalk.red('[Excel Import]: ') + `Can't import group seniors excel file: ${path}`);
        process.exit(1);
    }

    const huColor = new Map<string, string>([
        ['sárga', 'yellow'],
        ['fekete', 'black'],
        ['kék', 'blue'],
        ['fehér', 'white'],
        ['piros', 'red'],
    ]);

    return sheet.map((row) => {
        const seniors = [
            { senior: row.senior1 as string, color: huColor.get(row.color1) ?? '' },
            { senior: row.senior2 as string, color: huColor.get(row.color2) ?? '' },
            { senior: row.senior3 as string, color: huColor.get(row.color3) ?? '' },
            { senior: row.senior4 as string, color: huColor.get(row.color4) ?? '' },
        ];
        return {
            courseCode: row.courseCode as string,
            instructor: row.instructor as string,
            seniors: seniors.filter((s) => s.color && s.senior),
            desiredColor: huColor.get(row.desiredColor) ? huColor.get(row.desiredColor) : undefined,
        };
    });
}
