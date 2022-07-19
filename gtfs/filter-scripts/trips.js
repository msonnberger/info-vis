import { createReadStream, createWriteStream } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseSync } from 'csv-parse/sync';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = [
	'route_id',
	'service_id',
	'trip_id',
	'shape_id',
	'trip_headsign',
	'direction_id',
	'block_id',
];

const routesColumns = [
	'route_id',
	'agency_id',
	'route_short_name',
	'route_long_name',
	'route_type',
	'route_color',
	'route_text_color',
];

const routesContent = await readFile('../filtered/routes.csv', 'utf-8');
const routes = parseSync(routesContent, { columns: routesColumns, from_line: 2 });
const routeIds = routes.map((route) => route.route_id);

const readStream = createReadStream('../data/trips.csv', 'utf-8');
const writeStream = createWriteStream('../filtered/trips.csv', 'utf-8');

const transformer = transform((row) => {
	// filter for already filtered routes
	if (routeIds.includes(row.route_id)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2 }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
