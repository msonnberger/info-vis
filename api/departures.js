export const config = {
	runtime: 'experimental-edge',
};

export default (req) => {
	return new Response(JSON.stringify(req));
};
