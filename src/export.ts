import { writeFile, utils } from 'xlsx';
import path from 'path';
import { getGroupsStats } from './scoreGroups';
import _ from 'lodash';

/**
 * @description Exports an excel containing all groups, each group is placed on a different worksheet
 * The first worksheet contains a summary of the whole batch, like: distribution, name, dorm etc.
 * The worksheets names are the group's ids
 * @param filePath Path where to save the output file
 * @param name Name of this batch of export(student groups), also the file will be saved on this name
 * @param groups The groups to export
 */
export function exportGroups(filePath: string, name: string, groups: StudentVector[][]) {
    let wb = utils.book_new();
    wb.Props = {
        Title: name,
        Subject: name,
        //Author: "Bálint Kostyál",
        CreatedDate: new Date(),
    };

    wb.SheetNames.push('Statisztika');
    const exportableStats = getGroupsStats(groups).map((a) => {
        return {
            ['Tankör']: `Tankör: ${a.id + 1}`,
            ['Hallgató (db)']: a.stats.totalCount,
            ['Nő (db)']: a.stats.femaleCount,
            ['Féfi (db)']: a.stats.maleCount,
            ['Kollégista']: a.stats.dormitoryCount,
            ['Kollégisták aránya']: `${a.stats.dormitoryRatio.toFixed(2)}%`,
        };
    });
    let worksheet = utils.json_to_sheet(exportableStats);
    worksheet['!cols'] = fitToColumn(exportableStats);
    wb.Sheets['Statisztika'] = worksheet;

    groups.forEach((group, id) => {
        //Convert the required fields to hungarian names
        const exportableGroup = group.map((student) => {
            return {
                Neptun: student.neptun,
                ['Név']: student.name,
                ['Szín']: student.color,
                ['Koli szoba']: student.trueDormitory ? student.room : '',
                ['Nem']: student.gender === 'N' ? 'Nő' : 'Férfi',
                ['Német']: student.german ? 'X' : ' ',
                ['Imsc']: student.imsc ? 'X' : ' ',
            };
        });
        let sheetName = `${name} - Tankör: ${id + 1}`;
        wb.SheetNames.push(sheetName);
        let worksheet = utils.json_to_sheet(exportableGroup);
        worksheet['!cols'] = fitToColumn(exportableGroup);

        wb.Sheets[sheetName] = worksheet;
    });
    writeFile(wb, path.join(filePath, name + '.xlsx'), {
        bookType: 'xlsx',
    });
}

/**
 * @description Exports an excel containing all generated groups stats
 */
export function exportStats(filePath: string, generationData: GenerationResult[]) {
    let wb = utils.book_new();
    wb.Props = {
        Title: 'Generation Summary',
        Subject: 'Generation Summary',
        Author: 'Bálint Kostyál',
        CreatedDate: new Date(),
    };

    wb.SheetNames.push('Statisztika');
    recolorGroup(generationData[2].groups[0]);

    generationData = generationData.map((generation) => {
        generation.groups.map((g) => recolorGroup(g));
        return generation;
    });

    const exportableData = generationData.map((generation) => {
        const colors = _.groupBy(generation.groups, (g) => g[0].color);

        debugger;
        return {
            ['Név']: generation.name,
            ['Diák (db)']: generation.groups.flat().length,
            ['Tankör (db)']: generation.groups.length,
            ...Object.fromEntries(
                Object.keys(colors).map((key) => {
                    return [[key], colors[key].flat().length];
                }),
            ),
        };
    });

    debugger;
    let worksheet = utils.json_to_sheet(exportableData);
    worksheet['!cols'] = fitToColumn(exportableData);
    wb.Sheets['Statisztika'] = worksheet;
    writeFile(wb, path.join(filePath, 'GenerationSummary' + '.xlsx'), {
        bookType: 'xlsx',
    });
}

function fitToColumn(groups: object[]) {
    let array = groups.map((g) => Object.values(g));
    array.unshift(Object.keys(groups[0]));
    // get maximum character of each column
    return array[0].map((a, i) => ({
        wch: Math.max(...array.map((a2) => (a2[i] ? a2[i].toString().length + 3 : 0))),
    }));
}

function recolorGroup(group: StudentVector[]) {
    const colorGroups = _.groupBy(group, 'color');
    const mostFrequentColor = Object.keys(colorGroups)
        .map((a) => {
            return { color: a, count: colorGroups[a].length };
        })
        .filter((a) => a.color !== 'gray')
        .sort((x, y) => x.count - y.count)
        .pop()!.color;

    return group.map((s) => {
        s.color = mostFrequentColor;
        return s;
    });
}
