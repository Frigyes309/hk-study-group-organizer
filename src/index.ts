import express from 'express';
import path from 'path';
import _ from 'lodash';
import chalk from 'chalk';
import { Bar, Presets } from 'cli-progress';
import { Students } from './Students';
import { importStudents } from './studentsImporter';
import { Groups } from './createGroups';
import { createVectors, getFloorColors } from './createVector';
import { printGroupStats, scoreGroups } from './scoreGroups';

const app = express();
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

const CONFIG = {
    inputDir: '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/',
    outputDir: '',
    groupGenerationCount: 100, //How many times try to generate a group combination witch will give us the best score
    gtbScale: 0.01, //Scale for the gtb vector dimension
};

const generationTypes: GenerationType[] = [
    {
        name: 'Info General',
        major: 'Infó',
        imsc: false,
        german: false,
        groupCount: 18,
        basicGroup: false,
        calculateWithInadequateGroupCount: true,
    },
    {
        name: 'Info IMSC',
        major: 'Infó',
        imsc: true,
        german: false,
        groupCount: 3,
        basicGroup: false,
        calculateWithInadequateGroupCount: false,
    },
    {
        name: 'Info German',
        major: 'Infó',
        imsc: false,
        german: true,
        groupCount: 1,
        basicGroup: true,
        calculateWithInadequateGroupCount: true,
    },
    {
        name: 'Vill General',
        major: 'Vill',
        imsc: false,
        german: false,
        groupCount: 10,
        basicGroup: false,
        calculateWithInadequateGroupCount: true,
    },
    {
        name: 'Vill IMSC',
        major: 'Vill',
        imsc: true,
        german: false,
        groupCount: 1,
        basicGroup: true,
        calculateWithInadequateGroupCount: true,
    },
    {
        name: 'Vill German',
        major: 'Vill',
        imsc: false,
        german: true,
        groupCount: 1,
        basicGroup: true,
        calculateWithInadequateGroupCount: true,
    },
    {
        name: 'Bprof General',
        major: 'Üzinfó',
        imsc: false,
        german: false,
        groupCount: 5,
        basicGroup: true,
        calculateWithInadequateGroupCount: true,
    },
];

console.log(chalk.green('[General]: '), 'Program started');

importStudents(
    {
        DH: path.join(CONFIG.inputDir, 'VIK-alapképzés-felvettek-2020A-besoroláshoz.xlsx'),
        Dorm: path.join(CONFIG.inputDir, 'Bsc-felvettek.xlsx'),
        GTB: path.join(CONFIG.inputDir, 'GTB-2020-tankörbeosztáshoz.xlsx'),
    },
    'Infó',
);
const masterFloorColors = getFloorColors();

generationTypes.forEach((generationType) => {
    console.log();
    console.log(chalk.cyan(`--------- [${generationType.name}] ---------`));
    importStudents(
        {
            DH: path.join(CONFIG.inputDir, 'VIK-alapképzés-felvettek-2020A-besoroláshoz.xlsx'),
            Dorm: path.join(CONFIG.inputDir, 'Bsc-felvettek.xlsx'),
            GTB: path.join(CONFIG.inputDir, 'GTB-2020-tankörbeosztáshoz.xlsx'),
        },
        generationType.major,
        generationType.imsc,
        generationType.german,
    );

    console.log(
        chalk.green('[General]: '),
        `${generationType.name} imported, student count: ${Students.instance.getAll().length}`,
    );

    let bestGroups = Array<StudentVector[]>();
    let bestScore = Infinity; //Lower is better

    let progressBar = new Bar(
        {
            noTTYOutput: true,
            format: `${chalk.magenta('[{name}]')}: [{bar}] ${chalk.yellow(
                '{percentage}',
            )}% | ETA: {eta}s | Current/Best Score: {bestCurrent}`,
        },
        Presets.shades_classic,
    );
    progressBar.start(CONFIG.groupGenerationCount, 0, { name: generationType.name, bestCurrent: '0.00/0.00' });

    //From n generation get the best groups
    for (let i = 0; i < CONFIG.groupGenerationCount; i++) {
        const groupCalculator = new Groups(
            createVectors(Students.instance.getAll(), { gtbScale: CONFIG.gtbScale, masterColors: masterFloorColors }),
            generationType.groupCount,
        );
        let groups = generationType.basicGroup
            ? groupCalculator.createBasicGroups()
            : groupCalculator.createGroups({
                  calculateWithInadequateGroupCount: generationType.calculateWithInadequateGroupCount,
              });
        const score = scoreGroups(groups);
        if (score < bestScore) {
            bestGroups = groups;
            bestScore = score;
        }
        progressBar.increment(1, {
            name: generationType.name,
            bestCurrent: `${score.toFixed(2)}/${bestScore.toFixed(2)}`,
        });
        progressBar.render();
    }
    progressBar.stop();

    printGroupStats(bestGroups);
});

//Visually distinct colors: https://mokole.com/palette.html
/*const colorShowed = _.shuffle([
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
        //student.color = colorShowed[index];
        return student;
    });
    return group;
});*/

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/api/data', (req, res) => {
    res.json({});
});
