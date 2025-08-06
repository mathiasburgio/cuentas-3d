const express = require("express");
const usuarosController = require("../controllers/usuarios-controller");
const router = express.Router();
const middlewares = require("../utils/middlewares");

router.post("/usuarios/iniciar-sesion", 
    middlewares.createRateLimit(3, 5, "Demasiados intentos. Intenta nuevamente en unos minutos."),
    usuarosController.iniciarSesion);
router.post("/usuarios/cerrar-sesion", usuarosController.cerrarSesion);
router.get("/usuarios/cerrar-sesion", usuarosController.cerrarSesion);

module.exports = router;