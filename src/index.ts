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
import { exportGroups, exportStats } from './export';

const app = express();
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

const CONFIG = {
    inputDir: '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/',
    outputDir: '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/output',
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
        allowMultipleGirlRooms: false,
    },
    {
        name: 'Info IMSC',
        major: 'Infó',
        imsc: true,
        german: false,
        groupCount: 3,
        allowMultipleGirlRooms: true,
    },
    {
        name: 'Info German',
        major: 'Infó',
        imsc: false,
        german: true,
        groupCount: 1,
        allowMultipleGirlRooms: false,
    },
    {
        name: 'Vill General',
        major: 'Vill',
        imsc: false,
        german: false,
        groupCount: 10,
        allowMultipleGirlRooms: false,
    },
    {
        name: 'Vill IMSC',
        major: 'Vill',
        imsc: true,
        german: false,
        groupCount: 1,
        allowMultipleGirlRooms: false,
    },
    {
        name: 'Vill German',
        major: 'Vill',
        imsc: false,
        german: true,
        groupCount: 1,
        allowMultipleGirlRooms: false,
    },
    {
        name: 'Bprof General',
        major: 'Üzinfó',
        imsc: false,
        german: false,
        groupCount: 5,
        allowMultipleGirlRooms: true,
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

const result: GenerationResult[] = generationTypes.map((generationType) => {
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
        let groups =
            generationType.groupCount === 1 //No need for complex generation, if we only care about one group
                ? groupCalculator.createBasicGroups()
                : groupCalculator.createGroups({ allowMultipleGirlRooms: generationType.allowMultipleGirlRooms });
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

    exportGroups(CONFIG.outputDir, generationType.name, bestGroups);

    return {
        name: generationType.name,
        groups: bestGroups,
        imsc: generationType.imsc,
        german: generationType.german,
    };
});

exportStats(CONFIG.outputDir, result);

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
