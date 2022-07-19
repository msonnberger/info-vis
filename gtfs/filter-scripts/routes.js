import { createReadStream, createWriteStream } from 'fs';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { transform } from 'stream-transform';

const columns = [
	'route_id',
	'agency_id',
	'route_short_name',
	'route_long_name',
	'route_type',
	'route_color',
	'route_text_color',
];

const lines = ['U1', 'U2', 'U3', 'U4', 'U5', 'U6'];

const readStream = createReadStream('../data/routes.csv', 'utf-8');
const writeStream = createWriteStream('../filtered/routes.csv', 'utf-8');

const transformer = transform((row) => {
	// filter for metro lines only (beginning with 'U')
	if (lines.includes(row.route_long_name)) {
		return row;
	}
});

readStream
	.pipe(parse({ columns, from_line: 2 }))
	.pipe(transformer)
	.pipe(stringify({ header: true }))
	.pipe(writeStream);
