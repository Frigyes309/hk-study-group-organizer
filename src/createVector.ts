import _ from 'lodash';
import chalk from 'chalk';
import { Students } from './Students';

/**
 * @description Convert students to vectors
 * @param students students array to convert
 * @returns StudentVector[] students converted to vector values
 */
export function createVectors(students: Student[]): StudentVector[] {
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

    return students.map((student) => {
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
}
