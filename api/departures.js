export const config = {
	runtime: 'experimental-edge',
};

export default (req) => {
	return Response.json(req);
};
