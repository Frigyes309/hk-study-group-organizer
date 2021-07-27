import express from 'express';
import path from 'path';
import _ from 'lodash';
import { Students } from "./Students";
import { importStudents } from "./studentsImporter";
import chalk from "chalk";

const dataDir = '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/';
const app = express();
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

importStudents({
  DH: path.join(dataDir, 'VIK-alapképzés-felvettek-2020A-besoroláshoz.xlsx'),
  Dorm: path.join(dataDir, 'Bsc-felvettek.xlsx'),
  GTB: path.join(dataDir, 'GTB-2020-tankörbeosztáshoz.xlsx')
}, 'Infó');

/**
 * Create ids for card and room seniors
 */
const gtbSeniorGroups =  Students.instance.getGtbSeniorGroups();
let cardSeniorIds = new Map<string, number>();
let roomSeniorIds = new Map<string, number>();
Object.keys(gtbSeniorGroups).forEach(((card, index) => {
  cardSeniorIds.set(card, index + 1);
  Object.keys(gtbSeniorGroups[card]).forEach((room, index) => {
    roomSeniorIds.set(room, (index + 1) * 3);
  });
}));

/**
 * Get most common color from each floor of the Dormitory
 */
let colors : {color: string, floor: number, cards: string[]}[] = [];
const floors = _.groupBy(Students.instance.getAllBy(student => student.room !== 0),
    student => Math.floor(student.room / 100));
Object.keys(floors).forEach(floorId => {
  //Get all students color from this floor
  const floorColors = floors[floorId].map(student => student.color);
  //Get the most common color from this floor
  const color = _.head(_(floorColors).countBy().entries().maxBy(_.last));
  if(typeof color === 'string'){
    colors.push({ color, floor: Number(floorId) * 100, cards: [] })
  }else{
    console.error(chalk.red('[Floor Colors]: '), `Most frequent color should be a string, but got: ${typeof color} => ${color}`);
  }
})

/**
 * For each color/floor get the card seniors from GTB
 */
const gtbColorGroups = _.groupBy(Students.instance.getAllBy(student => student.cardSenior !== ''), 'color');
Object.keys(gtbColorGroups).forEach(color => {
  let obj = colors.find(c => c.color === color);
  if(obj){
    obj.cards.push(...Object.keys(_.groupBy(gtbColorGroups[color], 'cardSenior')));
  }else{
    console.error(chalk.red('[GTB Card Colors]: '), `No matching GTB ${color}, and Dormitory ${colors.join()} colors found`);
  }
})

/**
 * Get possible room numbers form the Dormitory
 */
const rooms = Object.keys(_.groupBy(Students.instance.getAllBy(student => student.room !== 0),
  student => Math.floor(student.room % 100))).map(roomId => Number(roomId));

/**
 * Convert students to vectors
 */
let data = Students.instance.getAll().map((student) => {
  let room = student.room;
  let gtb = cardSeniorIds.get(student.cardSenior)! + roomSeniorIds.get(student.roomSenior)!;

  //If a student was in GTB, but not in Dormitory
  if(student.cardSenior !== '' && student.room === 0){
    // She/He already has a color => Assign a random room on the floor for them
    let color = colors.find(c => c.color === student.color);
    if(color){
      //Generate a random room on that floor
      room = color.floor + _.random(Math.min(...rooms), Math.max(...rooms))
    }
  }
  //If a student will be in Dormitory, but was not in GTB
  else if(student.room !== 0 && student.cardSenior === ''){
    // She/He already has a color => Assign a random card and room senior from the same color
    let color = colors.find(c => c.color === student.color);
    if(color){
      let card = _.sample(color.cards);
      if(card){
        gtb = cardSeniorIds.get(card)! + _.random(1, 3) * 3;
      }else{
        console.log(chalk.red('[]: '), 'No card seniors found for this color');
      }
    }
  //If not Dormitory and not GTB
  }else if(student.room === 0 && student.cardSenior === ''){
    // She/He is gray => May go in any of the groups
    room = 0;
    gtb = 0;
  }
  //If both Dormitory and GTB
    // She/He has both => Nothing to do

  return {
    ...student,
    x: room,
    y: gtb,
  }
});

/*let colors = new Map<string, {color: string, floor: number, gtb: number}>([
  ['DrWu', {color: 'yellow', floor: 600, gtb: 0}],
  ['Fekete', {color: 'black', floor: 800, gtb: 40}],
  ['Nyuszi', {color: 'blue', floor: 700, gtb: 80}],
  ['SIR', {color: 'gray', floor: 500, gtb: 120}],
  ['TTNY', {color: 'red', floor: 900, gtb: 160}]
]);*/

app.listen(3000, () => {
  console.log(`Listening on port: ${3000}`);
})

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/data', (req, res) => {
  res.json(data);
})