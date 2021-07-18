const excelToJson = require('convert-excel-to-json');
import { groupBy } from "./utils";
import express from 'express';
import path from 'path';

const baseDataDir = '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/';
const app = express();
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

const gtbData = excelToJson({
  sourceFile: baseDataDir + 'golyatabor.xlsx',
  header: {
    rows: 1
  },
  columnToKey: {
    A: 'neptun',
    B: 'roomSenior',
    C: 'cardSenior',
    D: 'color'
  }
});

type gtbStudent = {
  neptun: string,
  roomSenior: string,
  cardSenior: string,
  color: string
}

const schData = excelToJson({
  sourceFile: baseDataDir + 'koli.xlsx',
  header: {
    rows: 1
  },
  columnToKey: {
    A: 'name',
    B: 'neptun',
    C: 'major',
    D: 'color',
    E: 'card',
    F: 'gender',
    G: 'room'
  }
});

type Student = {
  name: string,
  neptun: string,
  major: string,
  color: string,
  card: string,
  gender: string,
  room: string
};

type vector = {
  room: number,
  gtb: number,
  color: string
};

let colors = new Map<string, {color: string, floor: number, gtb: number}>([
  ['DrWu', {color: 'yellow', floor: 600, gtb: 0}],
  ['Fekete', {color: 'black', floor: 800, gtb: 40}],
  ['Nyuszi', {color: 'blue', floor: 700, gtb: 80}],
  ['SIR', {color: 'gray', floor: 500, gtb: 120}],
  ['TTNY', {color: 'red', floor: 900, gtb: 160}]
]);

let studentVectorMap = new Map<string, vector>(); //Neptun - vector

schData.Munka1.forEach((student: Student) => {
  student.neptun = student.neptun.toUpperCase();
  let vec = studentVectorMap.get(student.neptun) || {room: -1, gtb: -1, color: 'gray'};

  if(student.room){
    let room = Array.from(student.room.toString());
    //vec.room = Number(room.shift())*100 + Number(room.join(''))*10;
    vec.room = Number(student.room);
  }

  if(!student.color) return;
  vec.color = colors.get(student.color)!.color;
  studentVectorMap.set(student.neptun, vec);
});

let cardSeniors = new Map<string, string>();
let roomSeniors = new Map<string, string>();

Array.from(groupBy(gtbData['Beosztás'], (x: gtbStudent) => x.cardSenior)).map(([card, students]) => {
  return {
    card,
    room: Array.from(groupBy(students, y => y.roomSenior).keys())
  }
}).forEach((value, index) => {
  cardSeniors.set(value.card, index.toString());
  value.room.forEach((val, ix) => {
    roomSeniors.set(val, ix.toString());
  })
})

gtbData['Beosztás'].forEach((student: gtbStudent) => {
  student.neptun = student.neptun.toUpperCase();
  let vec = studentVectorMap.get(student.neptun) || {room: -1, gtb: -1, color: 'gray'};
  vec.gtb = Number(cardSeniors.get(student.cardSenior)! + Number(roomSeniors.get(student.roomSenior)!));
  vec.color = colors.get(student.color)!.color;
  studentVectorMap.set(student.neptun, vec);
});

const returnData = Array.from(studentVectorMap).map(([neptun, vec]) => {
  let color = gtbData['Beosztás'].find((x: gtbStudent) => x.neptun.toUpperCase() === neptun.toUpperCase());
  if(!color) color = schData.Munka1.find((x: Student) => x.neptun.toUpperCase() === neptun.toUpperCase());
  if(!color) return [neptun, vec];
  //TODO: Get dorm max room number from the input data
  if(vec.room === -1) vec.room = colors.get(color.color)!.floor + Math.floor(Math.random() * 15);
  //TODO: Get gtb max-min from input data
  if(vec.gtb === -1) vec.gtb = colors.get(color.color)!.gtb + Math.floor(Math.random() * 32);

  return [neptun, vec];
});
console.log(returnData);

app.listen(3000, () => {
  console.log(`Listening on port: ${3000}`);
})

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/data', (req, res) => {
  res.json(returnData);
})