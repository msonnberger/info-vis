import { createReadStream, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = ['DIVA', 'PlatformText', 'Municipality', 'MunicipalityID', 'Longitude', 'Latitude'];

const allStopsContent = await readFile('../raw/metro-stops.csv', 'utf-8');
const allStops = new Set(allStopsContent.split('\n'));

const readStream = createReadStream('../raw/haltestellen.csv', 'utf-8');
const writeStream = createWriteStream('../stops.csv', 'utf-8');

const transformer = transform((row) => {
	if (allStops.has(row.PlatformText)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2, delimiter: ';' }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
