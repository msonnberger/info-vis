import L from 'leaflet';
import * as d3 from 'd3';
import { map } from './map';
import linesGeoJson from '/data/linesGeo.json';
import stopsCsv from '/data/stops.csv?url';

const calcCircleRadius = () => Math.pow(1.1, map.getZoom() * 1.1);
const calcStrokeWidth = () => Math.pow(1.14, map.getZoom() * 1.1);

L.svg({ clickable: true }).addTo(map);

export const svg = d3
	.select(map.getPanes().overlayPane)
	.select('svg')
	.attr('pointer-events', 'auto');

export const g = svg.append('g');

const projection = d3.geoTransform({
	point: function (lon, lat) {
		const { x, y } = map.latLngToLayerPoint(new L.LatLng(lat, lon));
		this.stream.point(x, y);
	},
});
// creates geopath from projected points (SVG)
const pathCreator = d3.geoPath().projection(projection);

const lines = g
	.selectAll('path')
	.data(linesGeoJson.features)
	.join('path')
	.attr('fill', 'none')
	.attr('id', (d) => d.properties.line)
	.attr('stroke', (d) => d.properties.color);

const stopsData = await d3.csv(stopsCsv);

const tooltip = g
	.append('text')
	.style('visibility', 'hidden')
	.style('font-size', '14px')
	.style('font-weight', 'bold');

export const stops = g
	.selectAll('circle')
	.data(stopsData)
	.join('circle')
	.attr('fill', 'black')
	.attr('stroke', 'transparent')
	.attr('stroke-width', '20')
	.style('cursor', 'pointer')
	.on('mouseover', function (_, d) {
		d3.select(this)
			.transition()
			.duration(100)
			.attr('r', calcCircleRadius() * 2);

		tooltip
			.style('visibility', 'visible')
			.text(d.PlatformText)
			.attr('x', map.latLngToLayerPoint([d.Latitude, d.Longitude]).x + 15)
			.attr('y', map.latLngToLayerPoint([d.Latitude, d.Longitude]).y + 3);
	})
	.on('mouseout', function () {
		d3.select(this).transition().duration(100).attr('r', calcCircleRadius());
		tooltip.style('visibility', 'hidden');
	});

// Function to place svg based on zoom
const onZoom = () => {
	lines.attr('d', pathCreator);
	lines.attr('stroke-width', calcStrokeWidth());
	//Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
	//leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
	//Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
	stops.attr('cx', (d) => map.latLngToLayerPoint([d.Latitude, d.Longitude]).x);
	stops.attr('cy', (d) => map.latLngToLayerPoint([d.Latitude, d.Longitude]).y);
	stops.attr('r', calcCircleRadius());
	d3.selectAll('.vehicle')
		.attr('r', calcStrokeWidth() / 2)
		.select('animateMotion')
		.attr('path', pathCreator);
};
// initialize positioning
onZoom();
// reset whenever map is moved
map.on('zoomend', onZoom);

export const addVehicles = (vehiclePaths) => {
	const vehicles = g
		.selectAll('circle.vehicle')
		.data(vehiclePaths)
		.join(
			(enter) =>
				enter
					.append('circle')
					.attr('class', 'vehicle')
					.attr('r', calcStrokeWidth() / 2)
					.attr('fill', (d) => d.properties.color)
					.append('animateMotion')
					.attr('dur', (d) => d.properties.countdown * 60 + 's')
					.attr('path', pathCreator)
					.attr('rotate', 'auto'),
			(update) =>
				update
					.attr('fill', (d) => d.properties.color)
					.select('animateMotion')
					.attr('dur', (d) => d.properties.countdown * 60 + 's')
					.attr('path', pathCreator),
			(exit) => exit.remove()
		);
};
