import * as d3 from 'd3';
import lines from '../gtfs/filtered/linesGeo.json';
import { svg, stops } from './shapes';

const legend = d3.select('.legend');
const stationInfo = d3.select('.station-info').style('display', 'none');

legend
	.append('div')
	.style('display', 'flex')
	.style('gap', '8px')
	.selectAll('div')
	.data(lines.features)
	.join('div')
	.text((d) => d.properties.line)
	.style('background-color', (d) => d.properties.color)
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
	const res = await fetch('http://localhost:3000/api/departures/60200014');
	const departures = await res.json();
	console.log(departures);
	stationInfo.style('display', 'block').select('h1').text(d.PlatformText);
});

d3.select('.close-button').on('click', () => {
	stationInfo.style('display', 'none');
	legend.style('display', 'block');
});
