const rateLimit = require("express-rate-limit");

const createRateLimit = (limit=3, minutes=5, message='Demaciados intentos. Intenta nuevamente en unos minutos.') => {
	return rateLimit({
		windowMs: minutes * 60 * 1000, // 5 minutes
		limit: limit,
		message: message,
		standardHeaders: 'draft-7', 
		legacyHeaders: false, 
		// store: ... , // Redis, Memcached, etc. See below.
	})
};

const verificarPermisos = (req, res, next) => {
	if(req.session?.data?.email){
		next();
	}else{
		res.status(403).end("No tienes permisos para acceder a esta sección");
	}
}

module.exports = {
	createRateLimit,
	verificarPermisos
}