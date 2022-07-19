import { createReadStream, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseSync } from 'csv-parse/sync';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = ['stop_id', 'stop_name', 'stop_lat', 'stop_lon', 'zone_id'];

const stopTimesColums = [
	'trip_id',
	'arrival_time',
	'departure_time',
	'stop_id',
	'stop_sequence',
	'pickup_type',
	'drop_off_type',
	'shape_dist_traveled',
];

const stopTimesContent = await readFile('../filtered/stop_times.csv', 'utf-8');
const stopTimes = parseSync(stopTimesContent, { columns: stopTimesColums, from_line: 2 });
const stopIds = new Set(stopTimes.map((time) => time.stop_id));

const readStream = createReadStream('../data/stops.csv', 'utf-8');
const writeStream = createWriteStream('../filtered/stops.csv', 'utf-8');

const transformer = transform((row) => {
	// filter for already filtered trips
	if (stopIds.has(row.stop_id)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2 }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
