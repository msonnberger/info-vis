import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapboxLogo from '../mapbox-logo.base64?raw';

const map = L.map('map', {
	center: [48.20884, 16.3712904],
	zoom: 13,
	zoomDelta: 0.5,
	zoomSnap: 0.5,
	maxBounds: [
		[48.087045, 16.164308],
		[48.350858, 16.56062],
	],
	attributionControl: false,
});

const tileURLParams = new URLSearchParams({
	access_token: import.meta.env.VITE_MAPBOX_KEY,
	tilesize: 512,
});

const tileURL =
	'https://api.mapbox.com/styles/v1/msonnberger/cl5p8hn9x000d14kfe0x09188/tiles/{z}/{x}/{y}@2x?';

L.tileLayer(tileURL + tileURLParams.toString(), {
	zoomOffset: -1,
	tileSize: 512,
	minZoom: 12,
	maxZoom: 16,
}).addTo(map);

const credits1 = L.control.attribution().addTo(map);

credits1.addAttribution(
	`© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>`
);

const credits2 = L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

credits2.addAttribution(`<img src=${mapboxLogo} width="65" height="20">`);
