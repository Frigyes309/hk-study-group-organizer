import express from 'express';
import path from 'path';
import _ from 'lodash';
import { Students } from './Students';
import { importStudents } from './studentsImporter';
import { Groups } from './createGroups';
import chalk from 'chalk';
import { createVectors } from './createVector';
import { printGroupStats, scoreGroups } from './scoreGroups';

const dataDir = '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/';
const app = express();
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

console.log(chalk.green('[General]: '), 'Program started');

importStudents(
    {
        DH: path.join(dataDir, 'VIK-alapképzés-felvettek-2020A-besoroláshoz.xlsx'),
        Dorm: path.join(dataDir, 'Bsc-felvettek.xlsx'),
        GTB: path.join(dataDir, 'GTB-2020-tankörbeosztáshoz.xlsx'),
    },
    'Infó',
);

console.log(chalk.green('[General]: '), `Data imported, student count: ${Students.instance.getAll().length}`);

let bestGroups = Array<StudentVector[]>();
let bestScore = Infinity; //Lower is better

//From 100 generation get the best groups
for (let i = 0; i <= 100; i++) {
    const groupCalculator = new Groups(createVectors(Students.instance.getAll()), 16);
    let groups = groupCalculator.createGroups();
    const score = scoreGroups(groups);
    if (score < bestScore) {
        bestGroups = groups;
        bestScore = score;
    }
    console.log(
        `Generation id: ${chalk.yellow(i.toString().padStart(2, ' '))}, Score: ${chalk.yellow(
            score.toFixed(2),
        )}, Best: ${chalk.yellow(bestScore.toFixed(2))}`,
    );
}

//Visually distinct colors: https://mokole.com/palette.html
const colorShowed = _.shuffle([
    '#2f4f4f',
    '#8b4513',
    '#191970',
    '#006400',
    '#bdb76b',
    '#b03060',
    '#ff4500',
    '#ffa500',
    '#ffff00',
    '#0000cd',
    '#00ff00',
    '#00fa9a',
    '#00ffff',
    '#b0c4de',
    '#ff00ff',
    '#1e90ff',
    '#ee82ee',
]);
bestGroups = bestGroups.map((group, index) => {
    group.map((student) => {
        student.color = colorShowed[index];
        return student;
    });
    return group;
});

printGroupStats(bestGroups);

bestGroups.forEach((group, id) => {
    const rooms = _.groupBy(group, 'room');
    bestGroups.forEach((a, ix) => {
        if (id != ix) {
            Object.keys(rooms).forEach((room) => {
                if (Object.keys(_.groupBy(a, 'room')).includes(room) && room !== '0') {
                    console.log(
                        chalk.yellow('[Generation Mistake]: '),
                        `In group: ${chalk.yellow(id)} and ${chalk.yellow(
                            ix,
                        )} are studens who are in the same room: ${chalk.yellow(room)}`,
                    );
                }
            });
        }
    });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/api/data', (req, res) => {
    res.json(bestGroups.flat());
});
