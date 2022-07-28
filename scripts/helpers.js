import { geoDistance } from 'd3';
import lines from '/data/lines.json';
import linesGeo from '/data/linesGeo.json';

// function that calculates the position of arriving trains at a station based on the countdown
// of departures and the location of the station. In order to animate the trains along a path, we
// need to calculate that path (from the location of the train to the station) as well.
export function calcVehiclePaths(departures, stationCoordinates) {
	const paths = departures.flatMap((departure) => {
		// don't include departures that already arrived, as the would disappear immediately after 'arriving' (after 0 seconds)
		if (departure.countdown === 0) return [];

		// get GeoJSON shape that corresponds to the line of the departure
		const lineShape = linesGeo.features.find((shape) => shape.properties.line === departure.line);

		// remove third coordinate (which is used for distance traveled starting at first stop)
		const coordinatesList = lineShape.geometry.coordinates.map((coordinates) =>
			coordinates.slice(0, 2)
		);

		// from the GeoJSON file, get the index of the coordinates which are closest to the actual station
		// this is needed as the coordinates from the station don't line up exactly with the path
		const closestPointIndex = findClosestPoint(coordinatesList, stationCoordinates);

		// calculate two candidates where the train could be, one in each direction.
		const candidateIndices = calcVehiclePositionCandidates(
			lineShape,
			closestPointIndex,
			departure.countdown
		);

		let positionIndex;
		let vehiclePathIndices;

		// in the GeoJSON file, the 'H' direction (= 'hin' in German) is always at towords the end of the list of coordinates.
		// Therefore, trains going in the 'H' direction need to go from the top of the list (where 'R' = 'retour' is)
		// to the bottom. This is implemented by ordering the two indices (one from the location of the train, one from the station) accordingly
		if (departure.direction === 'H') {
			positionIndex = Math.min(...candidateIndices);
			vehiclePathIndices = [positionIndex, closestPointIndex + 1];
		} else {
			positionIndex = Math.max(...candidateIndices);
			vehiclePathIndices = [closestPointIndex, positionIndex + 1];
		}

		// if the departures is so far ahead, that the corresponding train hasn't started yet, don't include it in the results
		if (!positionIndex || positionIndex === coordinatesList.length - 1) {
			return [];
		} else {
			// get the path the train takes by slicing the existing path of the line, from the location of the train to the station
			const vehiclePath = coordinatesList.slice(...vehiclePathIndices);

			// trains going to the 'R' direction (= retour) have to be reversed in order to animate correctly
			if (departure.direction === 'R') vehiclePath.reverse();

			// return train path as GeoJSON
			return [
				{
					type: 'Feature',
					properties: { countdown: departure.countdown, color: lines[departure.line].darkerColor },
					geometry: {
						type: 'LineString',
						coordinates: vehiclePath,
					},
				},
			];
		}
	});

	return paths;
}

// find the point closest to the target in a list of coordinates. Uses d3's `geoDistance` function
// to calculate distances between lat/lon coordinates
function findClosestPoint(coordinatesList, targetCoordinates) {
	let closest = 0;

	for (const [i, current] of coordinatesList.entries()) {
		if (geoDistance(current, targetCoordinates) < geoDistance(current, coordinatesList[closest])) {
			closest = i;
		}
	}

	return closest;
}

// calculates the two candidates where the train could be based on the countdown, one in each direction
function calcVehiclePositionCandidates(lineShape, pointIndex, countdown) {
	const AVERAGE_METRO_SPEED = 32.47; // in km/h, Source: https://blog.wienerlinien.at/40-facts-zu-40-jahre-wiener-u-bahn/
	// calculates the distance the train is away from the station, based on the average speed of metro trains in Vienna.
	const distanceFromPoint = (AVERAGE_METRO_SPEED / 60) * 1000 * countdown; // speed (in meters per minute) times minutes away
	const { coordinates } = lineShape.geometry;

	const point = coordinates[pointIndex];
	// third coordinate corresponds to the distance traveled at that location (extracted from `/data/shapes.csv`)
	const distanceTraveledAtPoint = point[2];

	// two candidates, one in each direction
	const targetDistances = [
		distanceTraveledAtPoint - distanceFromPoint,
		distanceTraveledAtPoint + distanceFromPoint,
	];

	let candidate1 = 0;
	let candidate2 = coordinates.length - 1;

	// find coordintes where distances match the target distances (i.e. difference is the smallest)
	for (let i = 1; i < coordinates.length - 1; i++) {
		if (
			Math.abs(targetDistances[0] - coordinates[i][2]) <
			Math.abs(targetDistances[0] - coordinates[candidate1][2])
		) {
			candidate1 = i;
		}

		if (
			Math.abs(targetDistances[1] - coordinates[i][2]) <
			Math.abs(targetDistances[1] - coordinates[candidate2][2])
		) {
			candidate2 = i;
		}
	}

	return [candidate1, candidate2];
}
