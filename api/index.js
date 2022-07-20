import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

app.use(cors());

app.get('/api/departures/:diva', async (req, res) => {
	const { diva } = req.params;
	const apiRes = await fetch('https://www.wienerlinien.at/ogd_realtime/monitor?diva=' + diva);
	const data = await apiRes.json();
	let { monitors } = data.data;
	monitors = monitors.filter((monitor) => monitor.lines.some((line) => line.type === 'ptMetro'));

	const departures = monitors.map((monitor) => {
		const lineDepartures = monitor.lines.map((line) => {
			return line.departures.departure.map((departure) => {
				const { vehicle, departureTime } = departure;
				return {
					countdown: departureTime?.countdown,
					line: vehicle?.name,
					direction: vehicle?.towards.trim().toUpperCase(),
				};
			});
		});

		return lineDepartures;
	});

	res.json(
		departures
			.flat(2)
			.sort((a, b) => a.countdown - b.countdown)
			.filter((dep) => !!dep.line && !!dep.direction && !!dep.countdown)
	);
});

app.listen(3000, () => {
	console.log('listening...');
});
