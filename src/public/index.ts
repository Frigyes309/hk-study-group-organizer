import Chart, { ChartConfiguration, ChartData } from 'chart.js/auto';

async function getGenerationResult(): Promise<GenerationResult[]> {
    return fetch('/api/data')
        .then((res) => res.json())
        .catch((err) => console.error(err));
}

let chart: Chart;

async function renderData(data: GenerationResult[]) {
    const chartData: ChartData = {
        datasets: data
            .map((generation) => {
                return generation.groups.map(({ group, label }) => {
                    return {
                        label: `${generation.name} - ${label}`,
                        data: group
                            .filter((s) => s.x !== 0 && s.y !== 0)
                            .map((student) => {
                                return {
                                    x: student.x ? student.x : 0,
                                    y: student.y ? student.y : 0,
                                    data: { ...student, batchName: generation.name },
                                };
                            }),
                        backgroundColor: group[0].color,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                    };
                });
            })
            .flat(),
    };

    const config: ChartConfiguration = {
        type: 'scatter',
        data: chartData,
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            //return window.data[context.dataIndex];

                            const student = (context.raw as { data: StudentVector & { batchName: string } }).data;
                            return [
                                `${student.batchName} - ${student.name}`,
                                `Room: ${student.room} - Gtb: ${student.y.toFixed(2)}`,
                                `Group id: ${student.groupId}`,
                            ];
                        },
                    },
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    //min: 900,
                    //max: 920,
                },
                y: {
                    //min: 0,
                    //max: 10
                },
            },
        },
    };
    const chartElement = document.getElementById('myChart');
    if (!chartElement) {
        console.error("Can't find chart element");
        //TODO: Better error handle
        return;
    }

    // @ts-ignore
    const ctx = chartElement.getContext('2d');
    chart = new Chart(ctx, config);
}

function renderButtons(buttonNames: string) {}

(async () => {
    renderData(await getGenerationResult());
})();
