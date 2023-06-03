interface ProcessorInput {
    content: string;
    filename: string;
}
interface ProcessorOutput {
    code?: string;
    map?: string | object;
    dependencies?: string;
}
interface Preprocessor {
    markup: ({ content, filename }: ProcessorInput) => Promise<ProcessorOutput | undefined>;
}

export function gridPreprocess(): Preprocessor {
    return {
        markup
    };
}

async function markup({ content }: ProcessorInput): Promise<ProcessorOutput | undefined> {
    const gridTagEndpoints = findSubstringEndpoints(content, '<Grid>');
    if (gridTagEndpoints.length > 0) {
        gridTagEndpoints.push([content.length, -1]);

        const replacementDatas: [number, number, string][] = [];
        for (let i = 0; i < gridTagEndpoints.length - 1; ++i) { // sliding window technique, item size of 2
            const gridTagStart = gridTagEndpoints[i][1];
            const gridTagEnd = content.indexOf('</Grid>', gridTagStart);
            if (gridTagEnd < gridTagEndpoints[i + 1][0]) {
                let counter = 0;
                const griditemTagEndpoints = findSubstringEndpoints(content, '<GridItem>', gridTagStart, gridTagEnd)
                for (const [griditemTagStart, griditemTagEnd] of griditemTagEndpoints) {
                    replacementDatas.push([griditemTagStart, griditemTagEnd, String.fromCharCode(97 + counter++)]);
                }
            }
        }
        replacementDatas.push([content.length, 0, '']);

        const replacedContentArray = [];
        replacedContentArray.push(content.substring(0, replacementDatas[0][0]));
        for (let i = 1; i < replacementDatas.length; ++i) { // sliding window technique, item size of 2
            replacedContentArray.push(`<div style="grid-area:${replacementDatas[i - 1][2]};">`);
            replacedContentArray.push(content.substring(replacementDatas[i - 1][1], replacementDatas[i][0]));
        }

        return {
            code: replacedContentArray.join('')
                .replaceAll('</GridItem>', '</div>')
                .replaceAll('<Grid>', '<div class="grid">')
                .replaceAll('</Grid>', '</div>')
        };
    }
}

function findSubstringEndpoints(string: string, substring: string, start = 0, end = string.length): [number, number][] {
    const endpoints: [number, number][] = [];
    for (let i = string.indexOf(substring, start); i !== -1 && i < end; i = string.indexOf(substring, i + substring.length)) {
        endpoints.push([i, i + substring.length]);
    }
    return endpoints;
}