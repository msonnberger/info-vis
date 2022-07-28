import { readFile, writeFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';

const shapesContent = await readFile('../shapes.csv', 'utf-8');
const rows = parse(shapesContent, { columns: true });
const shapes = {};

for (const row of rows) {
	if (!shapes[row.shape_id]) {
		shapes[row.shape_id] = [[+row.shape_pt_lon, +row.shape_pt_lat, +row.shape_dist_traveled]];
	} else {
		shapes[row.shape_id].push([+row.shape_pt_lon, +row.shape_pt_lat, +row.shape_dist_traveled]);
	}
}

const lineColors = {
	U1: '#E3000F',
	U2: '#A862A4',
	U3: '#EF7C00',
	U4: '#319F49',
	U6: '#9D6830',
};

const maximums = {
	U1: 0,
	U2: 0,
	U3: 0,
	U4: 0,
	U6: 0,
};

const geoJson = {
	type: 'FeatureCollection',
	features: [],
};

for (const [id, coordinates] of Object.entries(shapes)) {
	const line = id.split('-')[1];

	if (line === 'U3' || line === 'U6') {
		coordinates.reverse();
	}

	const feature = {
		type: 'Feature',
		properties: {
			id,
			line,
			color: lineColors[line],
		},
		geometry: {
			type: 'LineString',
			coordinates,
		},
	};

	if (coordinates.length > maximums[line]) {
		geoJson.features = geoJson.features.filter((feature) => feature.properties.line !== line);
		geoJson.features.push(feature);
		maximums[line] = coordinates.length;
	}
}

await writeFile('../linesGeo.json', JSON.stringify(geoJson));
