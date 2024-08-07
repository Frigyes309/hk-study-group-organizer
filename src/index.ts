import chalk from 'chalk';
import { Bar, Presets } from 'cli-progress';
import express from 'express';
import path from 'path';
import { Groups } from './createGroups';
import { createVectors, getFloorColors } from './createVector';
import { importGroupSeniors } from './dataImporter';
import { exportGroups, exportStats } from './export';
import { generationTypes } from './generationTypes';
import { matchSeniorsToGroups } from './matchSeniorsToGroups';
import { printGroupStats, scoreGroups } from './scoreGroups';
import { Students } from './Students';
import { importStudents } from './studentsImporter';

const app = express();
app.use('/public', express.static(path.join(__dirname, '..', 'dist', 'public')));
// sets ejs views folder
app.set('views', path.join(__dirname, '../views'));
// sets view engine
app.set('view engine', 'ejs');

const CONFIG = {
    inputDir: './data',
    outputDir: './data/output',
    groupGenerationCount: 200, //How many times try to generate a group combination witch will give us the best score
    gtbScale: 0.1, //Scale for the gtb vector dimension
};

console.log(chalk.green('[General]: '), 'Program started');

const groupSeniors = importGroupSeniors(path.join(CONFIG.inputDir, 'tsz.xlsx'));

importStudents(
    {
        DH: path.join(CONFIG.inputDir, 'dh.xlsx'),
        Dorm: path.join(CONFIG.inputDir, 'koli.xlsx'),
        GTB: path.join(CONFIG.inputDir, 'gtb.xlsx'),
    },
    'All',
);
//const infoGTB = importGTB(path.join(CONFIG.inputDir, 'GTB_Tankörbeosztáshoz.xlsx'));
//let s = Students.instance.getAll();
const masterFloorColors = getFloorColors();

const result: GenerationResult[] = generationTypes.map((generationType) => {
    console.log();
    console.log(chalk.cyan(`--------- [${generationType.name}] ---------`));
    importStudents(
        {
            DH: path.join(CONFIG.inputDir, 'dh.xlsx'),
            Dorm: path.join(CONFIG.inputDir, 'koli.xlsx'),
            GTB: path.join(CONFIG.inputDir, 'gtb.xlsx'),
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
            //TODO: This desired color is duplicate
            groupSeniors.filter((g) => generationType.courseCodes.includes(g.courseCode)).map((a) => a.desiredColor),
        );
        let groups =
            generationType.groupCount === 1 //No need for complex generation, if we only care about one group
                ? groupCalculator.createBasicGroups()
                : groupCalculator.createGroups({
                      allowMultipleGirlRooms: generationType.allowMultipleGirlRooms,
                      desiredColors: groupSeniors
                          .filter((g) => generationType.courseCodes.includes(g.courseCode))
                          .map((a) => a.desiredColor),
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

    const matchedGroups = matchSeniorsToGroups(bestGroups, generationType.courseCodes, groupSeniors);

    printGroupStats(matchedGroups);

    exportGroups(
        CONFIG.outputDir,
        generationType.name,
        matchedGroups,
        groupSeniors.filter((g) => generationType.courseCodes.includes(g.courseCode)),
    );

    return {
        name: generationType.name,
        groups: matchedGroups,
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
    res.json(result);
});
