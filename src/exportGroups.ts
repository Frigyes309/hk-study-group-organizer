import { writeFile, utils } from 'xlsx';
import path from 'path';

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
    //TODO: Create summary worksheet
    groups.forEach((group, id) => {
        //Convert the required fields to hungarian names
        const exportableGroup = group.map((student) => {
            return {
                Neptun: student.neptun,
                ['Név']: student.name,
                ['Szín']: student.color,
                IMSC: student.imsc ? 'igen' : '',
                ['Német']: student.german ? 'igen' : '',
            };
        });
        let sheetName = `${name} - Tankör: ${id + 1}`;
        wb.SheetNames.push(sheetName);
        let worksheet = utils.json_to_sheet(exportableGroup);
        worksheet['!cols'] = fitToColumn(exportableGroup.map((g) => Object.values(g)));

        wb.Sheets[sheetName] = worksheet;
    });
    writeFile(wb, path.join(filePath, name + '.xlsx'), {
        bookType: 'xlsx',
    });
}

function fitToColumn(groups: any[][]) {
    // get maximum character of each column
    return groups[0].map((a, i) => ({
        wch: Math.max(...groups.map((a2) => (a2[i] ? a2[i].toString().length : 0))) + 5,
    }));
}
