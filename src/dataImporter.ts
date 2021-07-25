import path from "path";

const excel = require('convert-excel-to-json')
import { Students } from "./Students";
import chalk from "chalk";

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
function importSheet(path: string, columnMap: { [key: string]: string }, sheetName: string|undefined = undefined, rowsToSkip = 1) : [{[key: string]: any}]|undefined{
  const data = excel({
    sourceFile: path,
    header: {
      rows: rowsToSkip
    },
    columnToKey: columnMap
  });

  if(!data){
    console.error(chalk.red('[Excel Import]: ') + "Can' t read excel file: " + path);
  }

  //Get the sheet from excel, first try to get the sheet by name
  //If no name is provided and only one sheet exists grab the first sheet
  let sheet;
  const keys = Object.keys(data);
  if(sheetName){
    sheet = data[sheetName];
    if(!sheet){
      console.error(chalk.red("[Excel Import]: ") + `Can't find this sheet: [${sheetName}], available names: [${keys.join()}]`);
    }
  }else{
    if(keys.length > 1){
      console.error(chalk.red("[Excel Import]: ") + `No sheet name is provided for import and there are multiple sheets: [${keys.join()}]`);
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
export function importGTB(path: string, sheetName: string|undefined = undefined) : [StudentGTB] | undefined{
  let sheet = importSheet(path, {
    A: 'neptun',
    B: 'roomSenior',
    C: 'cardSenior',
    D: 'color'
  }, sheetName);
  if(!sheet){
    console.log(chalk.red('[Excel Import]: ') + `Can't import GTB excel file: ${path}`);
    return undefined;
  }
  //Convert the neptun code to uppercase format
  sheet.map(row => {
    return {
      ...row,
      neptun: row.neptun.toUpperCase()
    }
  });
  // @ts-ignore
  return sheet;
}

/**
 * Imports an excel file containing students who will live in the dormitory
 * @param path Path to the excel file
 * @param sheetName Name of the sheet if more than one is present in the excel
 */
export function importDormitory(path: string, sheetName: string|undefined = undefined) : [StudentDormitory] | undefined{
  let sheet = importSheet(path, {
    A : 'name',
    D : 'neptun',
    G : 'score',
    I : 'major',
    K : 'admissionType',
    L : 'color',
    M : 'room',
  }, sheetName);
  if(!sheet){
    console.log(chalk.red('[Excel Import]: ') + `Can't import Dormitory excel file: ${path}`);
    return  undefined;
  }
  //Convert the neptun code to uppercase format
  sheet.map(row => {
    return {
      ...row,
      neptun: row.neptun.toUpperCase()
    }
  });
  // @ts-ignore
  return sheet;
}

/**
 * Imports an excel file containing all students who got accepted to the University
 * @param path Path to the excel file
 * @param sheetName Name of the sheet if more than one is present in the excel
 */
export function importDH(path: string, sheetName: string|undefined = undefined) : [StudentDH] | undefined{
  let sheet = importSheet(path, {
    A : 'neptun',
    B : 'name',
    C : 'zipCode',
    D : 'gender',
    E : 'imsc',
    F : 'doublePassive',
    G : 'german',
  }, sheetName);
  if(!sheet){
    console.log(chalk.red('[Excel Import]: ') + `Can't import DH excel file: ${path}`);
    return  undefined;
  }
  //Convert the neptun code to uppercase format
  // @ts-ignore
  sheet = sheet.map(row => {
    return {
      ...row,
      neptun: row.neptun.toUpperCase(),
      gender: row.gender == 'Férfi' ? 'F' : 'N',
      imsc: row.imsc == 'X',
      doublePassive: row.doublePassive == 'X',
      german: row.german == 'X',
    }
  });
  // @ts-ignore
  return sheet;
}

/**
 * Excel imported dataTypes
 */
type StudentGTB = {
  neptun : string,
  roomSenior : string,
  cardSenior: string,
  color : string,
}

type StudentDormitory = {
  name : string,
  neptun : string,
  score: number,
  major: string,
  admissionType: string,
  color: string,
  room: number,
}

type StudentDH = {
  neptun: string,
  name: string,
  zipCode: number,
  /** Gender of this student, stored in a hungarian format (F - Male) (N - Female) */
  gender: 'F' | 'N',
  imsc: boolean,
  doublePassive: boolean,
  german: boolean
}