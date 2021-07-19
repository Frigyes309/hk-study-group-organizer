const excel = require('convert-excel-to-json')
import { Students } from "./Students";
import chalk from "chalk";

export class dataImporter{
  /**
   * @description
   * Imports excel table containing Students
   * @param path Path to the current excel file
   * @param columnMap column ids ( eg. A, B, ... ) mapped to object names ( eg. neptun, roomSenior, ... )
   * @param rowsToSkip how many first rows to skip, default: 1
   * @param sheetName name of the sheet which to read from, if only one sheet is present it's not necessary
   */
  public static import(path: string, columnMap: { [key: string]: string }, sheetName: string | undefined, rowsToSkip: 1){
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
    if(sheetName){
      sheet = data[sheetName];
      if(!sheet){
        console.error(chalk.red("[Excel Import]: ") + `Can't find this sheet: [${sheetName}]`);
      }
    }else{
      let keys = Object.keys(data);
      if(keys.length > 1){
        console.error(chalk.red("[Excel Import]: ") + `No sheet name is provided for import and there are multiple sheets: [${keys.join()}]`);
      }
      //In excel at least one sheet is always present
      sheet = data[keys[0]];
    }


  }
}