import express from 'express';
import path from 'path';
import _ from 'lodash';
import { Students } from './Students';
import { importStudents } from './studentsImporter';
import { Groups } from './createGroups';
import chalk from 'chalk';

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

console.log(chalk.green('[General]: '), 'Data imported');

/**
 * Create ids for card and room seniors
 */
const gtbSeniorGroups = Students.instance.getGtbSeniorGroups();
let cardSeniorIds = new Map<string, number>();
let roomSeniorIds = new Map<string, number>();
Object.keys(gtbSeniorGroups).forEach((card, index) => {
    cardSeniorIds.set(card, index + 1);
    Object.keys(gtbSeniorGroups[card]).forEach((room, index) => {
        roomSeniorIds.set(room, (index + 1) * 3);
    });
});

/**
 * Get most common color from each floor of the Dormitory
 */
let colors: { color: string; floor: number; cards: string[] }[] = [];
const floors = _.groupBy(
    Students.instance.getAllBy((student) => student.room !== 0),
    (student) => Math.floor(student.room / 100),
);
Object.keys(floors).forEach((floorId) => {
    //Get all students color from this floor
    const floorColors = floors[floorId].map((student) => student.color);
    //Get the most common color from this floor
    const color = _.head(_(floorColors).countBy().entries().maxBy(_.last));
    if (typeof color === 'string') {
        colors.push({ color, floor: Number(floorId) * 100, cards: [] });
    } else {
        console.error(
            chalk.red('[Floor Colors]: '),
            `Most frequent color should be a string, but got: ${typeof color} => ${color}`,
        );
    }
});

/**
 * For each color/floor get the card seniors from GTB
 */
const gtbColorGroups = _.groupBy(
    Students.instance.getAllBy((student) => student.cardSenior !== ''),
    'color',
);
Object.keys(gtbColorGroups).forEach((color) => {
    let obj = colors.find((c) => c.color === color);
    if (obj) {
        obj.cards.push(...Object.keys(_.groupBy(gtbColorGroups[color], 'cardSenior')));
    } else {
        console.error(
            chalk.red('[GTB Card Colors]: '),
            `No matching GTB ${color}, and Dormitory ${colors.join()} colors found`,
        );
    }
});

/**
 * Get possible room numbers form the Dormitory
 */
const rooms = Object.keys(
    _.groupBy(
        Students.instance.getAllBy((student) => student.room !== 0),
        (student) => Math.floor(student.room % 100),
    ),
).map((roomId) => Number(roomId));

/**
 * Convert students to vectors
 */
//TODO: This can be refactored to use the Students.instance, instead of creating a new array
let data = Students.instance.getAll().map((student) => {
    let room = student.room;
    let gtb = String(cardSeniorIds.get(student.cardSenior)) + String(roomSeniorIds.get(student.roomSenior));

    //If a student was in GTB, but not in Dormitory
    if (student.cardSenior !== '' && student.room === 0) {
        // She/He already has a color => Assign a random room on the floor for them
        let color = colors.find((c) => c.color === student.color);
        if (color) {
            //Generate a random room on that floor
            //Put them in half rooms, so no overlap will generate with real dorm students, this will give them a better
            //change to be in the same group
            room = color.floor + _.random(Math.min(...rooms), Math.max(...rooms)) + 0.5;
        }
    }
    //If a student will be in Dormitory, but was not in GTB
    else if (student.room !== 0 && student.cardSenior === '') {
        // She/He already has a color => Assign a random card and room senior from the same color
        let color = colors.find((c) => c.color === student.color);
        if (color) {
            let card = _.sample(color.cards);
            if (card) {
                gtb = String(cardSeniorIds.get(card)) + (_.random(1, 3) * 3).toString();
            } else {
                console.log(chalk.red('[Vector Creation]: '), 'No card seniors found for this color');
            }
        }
        //If not Dormitory and not GTB
    } else if (student.room === 0 && student.cardSenior === '') {
        // She/He is gray => May go in any of the groups
        room = 0;
        gtb = '0';
    }
    //If both Dormitory and GTB
    // She/He has both => Nothing to do

    if (isNaN(Number(gtb))) {
        console.log(chalk.red('[Vector Creation]: '), 'Gtb vector axis must be a number, something went wrong');
    }

    student.room = room;

    return {
        ...student,
        x: room,
        y: Number(gtb) * 0.01,
    };
});

const groupCalculator = new Groups(data, 16);
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
const groups = groupCalculator.createGroups().map((group, index) => {
    group.map((student) => {
        student.color = colorShowed[index];
        return student;
    });
    return group;
});

groups.forEach((group, id) => {
    const rooms = _.groupBy(group, 'room');
    groups.forEach((a, ix) => {
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
    res.json(groups.flat());
});
