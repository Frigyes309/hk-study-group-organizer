import path from 'path';
import chalk from 'chalk';
import express from 'express';
import { Bar, Presets } from 'cli-progress';
import { Students } from './Students';
import { importStudents } from './studentsImporter';
import { Groups } from './createGroups';
import { createVectors, getFloorColors } from './createVector';
import { printGroupStats, scoreGroups } from './scoreGroups';
import { exportGroups, exportStats } from './export';
import { generationTypes } from './generationTypes';
import { importGroupSeniors } from './dataImporter';
import { matchSeniorsToGroups } from './matchSeniorsToGroups';

const app = express();
app.use('/public', express.static(path.join(__dirname, '..', 'dist', 'public')));
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

const CONFIG = {
    inputDir: '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/',
    outputDir: '/Users/balint/Documents/GitHub/hk-study-group-organizer/data/output',
    groupGenerationCount: 1, //How many times try to generate a group combination witch will give us the best score
    gtbScale: 0.01, //Scale for the gtb vector dimension
};

console.log(chalk.green('[General]: '), 'Program started');

const groupSeniors = importGroupSeniors(path.join(CONFIG.inputDir, 'Tankörsenior_beosztás2021.xlsx'));

importStudents(
    {
        DH: path.join(CONFIG.inputDir, 'VIK alapképzés felvettek 2021A besoroláshoz.xlsx'),
        Dorm: path.join(CONFIG.inputDir, '2020/Bsc-felvettek.xlsx'), //TODO: This is old data
        GTB: path.join(CONFIG.inputDir, 'GTB_Tankörbeosztáshoz.xlsx'),
    },
    'Vill',
);
let s = Students.instance.getAll();
debugger;
const masterFloorColors = getFloorColors();

const result: GenerationResult[] = generationTypes.map((generationType) => {
    console.log();
    console.log(chalk.cyan(`--------- [${generationType.name}] ---------`));
    importStudents(
        {
            DH: path.join(CONFIG.inputDir, 'VIK alapképzés felvettek 2021A besoroláshoz.xlsx'),
            Dorm: path.join(CONFIG.inputDir, '2020/Bsc-felvettek.xlsx'), //TODO: This is old data
            GTB: path.join(CONFIG.inputDir, 'GTB_Tankörbeosztáshoz.xlsx'),
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

    const matchedGroups = matchSeniorsToGroups(bestGroups, generationType.courseCodes, groupSeniors);

    printGroupStats(matchedGroups);

    exportGroups(CONFIG.outputDir, generationType.name, matchedGroups);

    return {
        name: generationType.name,
        groups: matchedGroups,
        imsc: generationType.imsc,
        german: generationType.german,
    };
});

debugger;

exportStats(CONFIG.outputDir, result);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/api/data', (req, res) => {
    res.json(result);
});
