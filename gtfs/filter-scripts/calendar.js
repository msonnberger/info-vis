import { createReadStream, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseSync } from 'csv-parse/sync';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = [
	'service_id',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
	'start_date',
	'end_date',
];

const tripsColumns = [
	'route_id',
	'service_id',
	'trip_id',
	'shape_id',
	'trip_headsign',
	'direction_id',
	'block_id',
];

const tripsContent = await readFile('../filtered/trips.csv', 'utf-8');
const trips = parseSync(tripsContent, { columns: tripsColumns, from_line: 2 });
const serviceIds = new Set(trips.map((trip) => trip.service_id));

const readStream = createReadStream('../data/calendar.csv', 'utf-8');
const writeStream = createWriteStream('../filtered/calendar.csv', 'utf-8');

const transformer = transform((row) => {
	// filter for already filtered trips
	if (serviceIds.has(row.service_id)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2 }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
