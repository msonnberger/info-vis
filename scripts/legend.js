import * as d3 from 'd3';
import lines from '../gtfs/filtered/lines.json';
import linesGeo from '../gtfs/filtered/linesGeo.json';

import { stops } from './shapes';

const legend = d3.select('.legend');
const stationInfo = d3.select('.station-info').style('display', 'none');

legend
	.append('div')
	.style('display', 'flex')
	.style('gap', '8px')
	.selectAll('div')
	.data(linesGeo.features)
	.join('div')
	.text((d) => d.properties.line)
	.style('background-color', (d) => lines[d.properties.line].color)
	.style('padding', '5px')
	.style('border-radius', '3px')
	.style('font-size', '1.2rem')
	.style('width', '30px')
	.style('line-height', '30px')
	.style('text-align', 'center')
	.style('aspect-ratio', '1 / 1')
	.style('color', 'white')
	.style('font-weight', 'bold');

stops.on('click', async (_, d) => {
	legend.style('display', 'none');
	stationInfo.style('display', 'block').select('h1').text(d.PlatformText);

	const res = await fetch('http://localhost:8787/?diva=' + d.DIVA);
	const departures = await res.json();

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
					.style('padding', '5px')
					.style('border-radius', '3px')
					.style('font-size', '1rem')
					.style('width', '24px')
					.style('line-height', '24px')
					.style('text-align', 'center')
					.style('aspect-ratio', '1 / 1')
					.style('color', 'white')
					.style('font-weight', 'bold');

				li.append('div')
					.attr('class', 'direction')
					.text((d) => lines[d.line].directions[d.direction]);

				li.append('div')
					.attr('class', 'countdown')
					.text((d) => (d.countdown === 0 ? 'now' : d.countdown + 'min'));
				return li;
			},
			(update) => {
				update
					.select('.line-icon')
					.text((d) => d.line)
					.style('background-color', (d) => lines[d.line].color);
				update.select('.direction').text((d) => lines[d.line].directions[d.direction]);
				update.select('.countdown').text((d) => (d.countdown === 0 ? 'now' : d.countdown + 'min'));

				return update;
			},
			(exit) => {
				return exit.remove();
			}
		);
});

d3.select('.close-button').on('click', () => {
	stationInfo.style('display', 'none');
	legend.style('display', 'block');
});
