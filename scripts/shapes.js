import L from 'leaflet';
import * as d3 from 'd3';
import { map } from './map';
import linesGeoJson from '/data/linesGeo.json';
import stopsCsv from '/data/stops.csv?url';

// calculate circle and path width based on zoom level of the map
const calcCircleRadius = () => Math.pow(1.1, map.getZoom() * 1.1);
const calcStrokeWidth = () => Math.pow(1.14, map.getZoom() * 1.1);

// add svg to Leaflet's overlay pane
L.svg({ clickable: true }).addTo(map);

// select the svg by targeting the map's overlay pane
export const svg = d3
	.select(map.getPanes().overlayPane)
	.select('svg')
	.attr('pointer-events', 'auto');

export const g = svg.append('g');

const tooltip = g
	.append('text')
	.style('visibility', 'hidden')
	.style('font-size', '14px')
	.style('font-weight', 'bold');

// custom projection (instead of mercator for example) which transforms a pair of coordinates (lon/lat)
// to SVG coordinates which can be used on the maps's overlay pane.
const projection = d3.geoTransform({
	point: function (lon, lat) {
		const { x, y } = map.latLngToLayerPoint(new L.LatLng(lat, lon));
		this.stream.point(x, y);
	},
});

// creates geopath from projection
const pathCreator = d3.geoPath().projection(projection);

// adds the metro lines to the map, `d` attribute is set in `onZoom()` function
const lines = g
	.selectAll('path')
	.data(linesGeoJson.features)
	.join('path')
	.attr('fill', 'none')
	.attr('id', (d) => d.properties.line)
	.attr('stroke', (d) => d.properties.color);

// load stops data from csv file
const stopsData = await d3.csv(stopsCsv);

// adds stops as circles to the map. Station name is displayed on hover
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

// each path and circle position needs to be recalculated when map is zoomed
const onZoom = () => {
	lines.attr('d', pathCreator);
	lines.attr('stroke-width', calcStrokeWidth());

	// similar to line 30, we have to use Leaflet's transformation method to project the point
	// into the svg's x, y coordinates
	stops.attr('cx', (d) => map.latLngToLayerPoint([d.Latitude, d.Longitude]).x);
	stops.attr('cy', (d) => map.latLngToLayerPoint([d.Latitude, d.Longitude]).y);
	stops.attr('r', calcCircleRadius());
	d3.selectAll('.vehicle')
		.attr('r', calcStrokeWidth() / 2)
		.select('animateMotion')
		.attr('path', pathCreator);
};

// gets called when map is first loaded, so that all paths and circles have an initial position
onZoom();

// call `onZoom` when map gets zoomed
map.on('zoomend', onZoom);

// adds the calculated paths of trains to the map in order to display their live location
export const addVehicles = (vehiclePaths) => {
	g.selectAll('circle.vehicle')
		.data(vehiclePaths)
		.join(
			(enter) =>
				enter
					.append('circle')
					.attr('class', 'vehicle')
					.attr('r', calcStrokeWidth() / 2)
					.attr('fill', (d) => d.properties.color)
					// SVG <animateMotion> element animates an element along a path by setting the `path` attribute
					.append('animateMotion')
					.attr('dur', (d) => d.properties.countdown * 60 + 's') // duration: minutes * 60 to get seconds
					.attr('path', pathCreator)
					.attr('rotate', 'auto'),
			// when another station is select, update exisiting circles accordingly
			(update) =>
				update
					.attr('fill', (d) => d.properties.color)
					.select('animateMotion')
					.attr('dur', (d) => d.properties.countdown * 60 + 's')
					.attr('path', pathCreator),
			// simply remove circles when needed.
			(exit) => exit.remove()
		);
};
