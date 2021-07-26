import express from 'express';
import path from 'path';
import _ from 'lodash';
import { Students } from "./Students";
import { importStudents } from "./studentsImporter";

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


// Create groups from GTB Students by it's cardSenior and roomSenior
let GtbGroups = _.groupBy(Students.instance.getAll(), 'cardSenior');
_.forEach(GtbGroups, (group, key) => {
  // @ts-ignore
  GtbGroups[key] = _.groupBy(GtbGroups[key], 'roomSenior');
});
console.log(GtbGroups);

/*Students.instance.getAll().map((student) => {
  return { x: student.room, y: student }
});*/

let colors = new Map<string, {color: string, floor: number, gtb: number}>([
  ['DrWu', {color: 'yellow', floor: 600, gtb: 0}],
  ['Fekete', {color: 'black', floor: 800, gtb: 40}],
  ['Nyuszi', {color: 'blue', floor: 700, gtb: 80}],
  ['SIR', {color: 'gray', floor: 500, gtb: 120}],
  ['TTNY', {color: 'red', floor: 900, gtb: 160}]
]);

app.listen(3000, () => {
  console.log(`Listening on port: ${3000}`);
})

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/api/data', (req, res) => {
  res.json([]);
})