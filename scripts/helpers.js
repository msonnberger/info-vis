import { geoDistance } from 'd3';
import lines from '/data/lines.json';
import linesGeo from '/data/linesGeo.json';

export function calcVehiclePaths(departures, stationCoordinates) {
	const paths = departures.flatMap((departure) => {
		if (departure.countdown === 0) return [];

		const lineShape = linesGeo.features.find((shape) => shape.properties.line === departure.line);

		const coordinatesList = lineShape.geometry.coordinates.map((coordinates) =>
			coordinates.slice(0, 2)
		);
		const closestPointIndex = findClosestPoint(coordinatesList, stationCoordinates);
		const candidateIndices = calcVehiclePositionCandidates(
			lineShape,
			closestPointIndex,
			departure.countdown
		);

		let positionIndex;
		let vehiclePathIndices;

		if (departure.direction === 'H') {
			positionIndex = Math.min(...candidateIndices);
			vehiclePathIndices = [positionIndex, closestPointIndex + 1];
		} else {
			positionIndex = Math.max(...candidateIndices);
			vehiclePathIndices = [closestPointIndex, positionIndex + 1];
		}

		if (!positionIndex || positionIndex === coordinatesList.length - 1) {
			return [];
		} else {
			const vehiclePath = coordinatesList.slice(...vehiclePathIndices);
			if (departure.direction === 'R') vehiclePath.reverse();

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

function findClosestPoint(coordinatesList, targetCoordinates) {
	let closest = 0;

	for (const [i, current] of coordinatesList.entries()) {
		if (geoDistance(current, targetCoordinates) < geoDistance(current, coordinatesList[closest])) {
			closest = i;
		}
	}

	return closest;
}

function calcVehiclePositionCandidates(lineShape, pointIndex, countdown) {
	const AVERAGE_METRO_SPEED = 32.47; // in km/h, Source: https://blog.wienerlinien.at/40-facts-zu-40-jahre-wiener-u-bahn/
	const distanceFromPoint = (AVERAGE_METRO_SPEED / 60) * 1000 * countdown; // speed in meters per minute times minutes away
	const { coordinates } = lineShape.geometry;

	const point = coordinates[pointIndex];
	const distanceTraveledAtPoint = point[2];
	const targetDistances = [
		distanceTraveledAtPoint - distanceFromPoint,
		distanceTraveledAtPoint + distanceFromPoint,
	];

	let candidate1 = 0;
	let candidate2 = coordinates.length - 1;

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
