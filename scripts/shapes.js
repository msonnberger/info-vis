import L from 'leaflet';
import * as d3 from 'd3';
import { map } from './map';
import shapes from '../gtfs/filtered/shapes.csv?url';

import geoJson from './geoJson.json';

L.svg({ clickable: true }).addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select('svg').attr('pointer-events', 'auto');
const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

const projection = d3.geoTransform({
	point: function (lon, lat) {
		const { x, y } = map.latLngToLayerPoint(new L.LatLng(lat, lon));
		this.stream.point(x, y);
	},
});
// creates geopath from projected points (SVG)
const pathCreator = d3.geoPath().projection(projection);

const areaPaths = g
	.selectAll('path')
	.data(geoJson.features)
	.join('path')
	.attr('fill', 'none')
	.attr('stroke', 'black')
	.attr('stroke-width', 2.5);

// Function to place svg based on zoom
const onZoom = () => areaPaths.attr('d', pathCreator);
// initialize positioning
onZoom();
// reset whenever map is moved
map.on('zoomend', onZoom);
