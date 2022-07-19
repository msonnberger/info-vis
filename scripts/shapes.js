import L from 'leaflet';
import * as d3 from 'd3';
import { map } from './map';
import linesGeoJson from '../gtfs/filtered/linesGeo.json';
import stopsCsv from '../gtfs/filtered/stops.csv?url';

L.svg({ clickable: true }).addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select('svg').attr('pointer-events', 'auto');
const g = svg.append('g');

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
	.attr('stroke', (d) => d.properties.color)
	.attr('stroke-width', 5);

const stopsData = await d3.csv(stopsCsv);

const stops = g
	.selectAll('circle')
	.data(stopsData)
	.join('circle')
	.attr('fill', 'steelblue')
	.attr('stroke', 'black')
	.attr('r', 3)
	.on('mouseover', function () {
		//function to add mouseover event
		d3.select(this)
			.transition() //D3 selects the object we have moused over in order to perform operations on it
			.duration('150') //how long we are transitioning between the two states (works like keyframes)
			.attr('fill', 'red') //change the fill
			.attr('r', 10); //change radius
	})
	.on('mouseout', function () {
		//reverse the action based on when we mouse off the the circle
		d3.select(this).transition().duration('150').attr('fill', 'steelblue').attr('r', 3);
	});

// Function to place svg based on zoom
const onZoom = () => {
	lines.attr('d', pathCreator);
	//Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
	//leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
	//Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
	stops.attr('cx', (d) => map.latLngToLayerPoint([d.stop_lat, d.stop_lon]).x);
	stops.attr('cy', (d) => map.latLngToLayerPoint([d.stop_lat, d.stop_lon]).y);
};
// initialize positioning
onZoom();
// reset whenever map is moved
map.on('zoomend', onZoom);
