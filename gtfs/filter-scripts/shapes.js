import { createReadStream, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseSync } from 'csv-parse/sync';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = [
	'shape_id',
	'shape_pt_lat',
	'shape_pt_lon',
	'shape_pt_sequence',
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

const tripsContent = await readFile('../filtered/trips.csv', 'utf-8');
const trips = parseSync(tripsContent, { columns: tripsColumns, from_line: 2 });
const shapeIds = new Set(trips.map((trip) => trip.shape_id));

const readStream = createReadStream('../data/shapes.csv', 'utf-8');
const writeStream = createWriteStream('../filtered/shapes.csv', 'utf-8');

const transformer = transform((row) => {
	// filter for already filtered trips
	if (shapeIds.has(row.shape_id)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2 }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
