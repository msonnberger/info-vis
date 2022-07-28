import { createReadStream, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseSync } from 'csv-parse/sync';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = [
	'trip_id',
	'arrival_time',
	'departure_time',
	'stop_id',
	'stop_sequence',
	'pickup_type',
	'drop_off_type',
	'shape_dist_traveled',
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

const tripsContent = await readFile('../trips.csv', 'utf-8');
const trips = parseSync(tripsContent, { columns: tripsColumns, from_line: 2 });
const tripIds = new Set(trips.map((trip) => trip.trip_id));

const readStream = createReadStream('../raw/stop_times.csv', 'utf-8');
const writeStream = createWriteStream('../stop_times.csv', 'utf-8');

const transformer = transform((row) => {
	// filter for already filtered trips
	if (tripIds.has(row.trip_id)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2 }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
