import { importDH, importDormitory, importGTB } from "./dataImporter";
import { Students } from "./Students";

/**
 * @description Imports a group [Vill, Infó, Üzinfó] of students
 * @param filePaths Object containing the excel file paths [DH, Dormitory, GTB]
 * @param major Which major to import [Vill, Infó, Üzinfó]
 */
export function importStudents(filePaths: { DH: string, Dorm: string, GTB: string }, major: 'Vill' | 'Infó' | 'Üzinfó'){
  //TODO: Before import new data clear the Students class container

  const infoDH = importDH(filePaths.DH, major); //TODO: This major -> excel sheet mapping may needs to be changed
  if(!infoDH){
    //TODO: Create better error handling
    process.exit(-1);
  }
  const infoDorm = importDormitory(filePaths.Dorm, 'Bsc elsőéves felvettek');
  if(!infoDorm){
    //TODO: Create better error handling
    process.exit(-1);
  }
  const infoGTB = importGTB(filePaths.GTB);
  if(!infoGTB){
    //TODO: Create better error handling
    process.exit(-1);
  }

  infoDH.forEach((student) => {

    const studentGTB = infoGTB.find((s) => s.neptun === student.neptun);
    const studentDorm = infoDorm.find((s) => s.neptun === student.neptun);

    Students.instance.add({
      ...student,
      roomSenior: studentGTB ? studentGTB.roomSenior : '' ,
      cardSenior: studentGTB ? studentGTB.cardSenior : '',
      color: studentGTB ? studentGTB.color : (studentDorm ? studentDorm.color : ''),
      admissionType: studentDorm ?  studentDorm.admissionType : '',
      major: studentDorm ? studentDorm.major : '',
      room: studentDorm ? studentDorm.room : 0,
      score: studentDorm ? studentDorm.score : 0,
    });
  });
}