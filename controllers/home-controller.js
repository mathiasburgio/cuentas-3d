const path = require("path");
const fechas = require("../utils/fechas");
const fs = require("fs");

function obtenerVista(req, res){
    res.sendFile( path.join(__dirname, "..", "views", "home.html") );
}

module.exports = {
    obtenerVista
};