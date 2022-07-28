import * as d3 from 'd3';
import lines from '/data/lines.json';
import linesGeo from '/data/linesGeo.json';

import { stops, addVehicles } from './shapes';
import { calcVehiclePaths } from './helpers';

const legend = d3.select('.legend');
// hide detailed station info initially, as no station is selected yet.
const stationInfo = d3.select('.station-info').style('display', 'none');

// shows all lines (U1 - U6) and displays their icons. this acts a legend to know which color stands for which line.
legend
	.append('div')
	.style('display', 'flex')
	.style('gap', '8px')
	.selectAll('div')
	.data(linesGeo.features)
	.join('div')
	.attr('class', 'line-icon')
	.text((d) => d.properties.line)
	.style('background-color', (d) => lines[d.properties.line].color)
	.style('font-size', '1.2rem')
	.style('width', '30px')
	.style('line-height', '30px');

// executed when station is selected
stops.on('click', async (_, d) => {
	// swap visibility of legend and detailed station info.
	legend.style('display', 'none');
	stationInfo.style('display', 'block').select('h1').text(d.PlatformText);

	// fetch departues from API proxy (which fetches from Wiener Linien realtime API)
	// `DIVA` is an ID used for one station and includes all lines at that station
	const res = await fetch('https://api.msonnberger.workers.dev/?diva=' + d.DIVA);
	const departures = await res.json();

	// uses function from `helpers.js` to calculate the paths of the trains arriving at the station and adds them to the map
	const vehiclePaths = calcVehiclePaths(departures, [+d.Longitude, +d.Latitude]);
	addVehicles(vehiclePaths);

	// filter which lines stop at selected station
	const linesAtStation = [...new Set(departures.map((dep) => dep.line))].sort();

	// show icons for all lines stopping at the stations
	stationInfo
		.select('header')
		.select('.lines-at-station')
		.selectAll('div')
		.data(linesAtStation)
		.join(
			(enter) =>
				enter
					.append('div')
					.attr('class', 'line-icon')
					.text((d) => d)
					.style('background-color', (d) => lines[d].color)
					.style('font-size', '0.8rem')
					.style('width', '20px')
					.style('line-height', '20px'),
			(update) => update.text((d) => d).style('background-color', (d) => lines[d].color),
			(exit) => exit.remove()
		);

	// for each upcoming departure, add an list element which shows the line icon, the destionation and a countdown
	stationInfo
		.select('ul')
		.selectAll('li')
		.data(departures)
		.join(
			(enter) => {
				const li = enter.append('li');
				li.append('div')
					.attr('class', 'line-icon')
					.text((d) => d.line)
					.style('background-color', (d) => lines[d.line].color)
					.style('font-size', '1rem')
					.style('width', '24px')
					.style('line-height', '24px');

				li.append('p')
					.attr('class', 'direction')
					.text((d) => lines[d.line].directions[d.direction]);

				li.append('p')
					.attr('class', 'countdown')
					.text((d) => (d.countdown === 0 ? 'now' : d.countdown))
					.filter((d) => d.countdown !== 0)
					.append('span')
					.html('&hairsp;min');

				return li;
			},
			(update) => {
				update
					.select('.line-icon')
					.text((d) => d.line)
					.style('background-color', (d) => lines[d.line].color);
				update.select('.direction').text((d) => lines[d.line].directions[d.direction]);
				update
					.select('.countdown')
					.text((d) => (d.countdown === 0 ? 'now' : d.countdown))
					.filter((d) => d.countdown !== 0)
					.append('span')
					.html('&hairsp;min');

				return update;
			},
			(exit) => exit.remove()
		);
});

d3.select('.close-button').on('click', () => {
	stationInfo.style('display', 'none');
	legend.style('display', 'block');
});
