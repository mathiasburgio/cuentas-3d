const http = require("http");
const express = require("express")
const app = express();
const session = require("express-session");
const MongoStore = require('connect-mongo');
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const db = require('./utils/db');

const configuracion = require("./configuracion.json");

// Cargar variables de entorno
require('dotenv').config();

// Configuro las sesiones
app.use(session({
    secret: process.env?.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge : Number(process.env?.SESSION_MAXAGE) || (1000 * 60 * 60 * 24 * 5),//5 días
        sameSite: true,
        //secure : !(process.env.NODE_ENV == 'development') // true ssl
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI + "_sessions" })
}));

// Configuro el parser de parametros
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Verifico directorios clave
let directories = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "uploads", "temp"),
    path.join(__dirname, "uploads", "files3d"),
    path.join(__dirname, "uploads", "images"),
    path.join(__dirname, "uploads", "backups"),
];
directories.forEach(directory=>{
    if(fs.existsSync(directory) == false) fs.mkdirSync( directory )
})

//conecta a la base de datos y cargo los modelos
let conn = null;
db().then(ret=>{ 
    conn = ret; 
})

// Aplico el motor de vistas
app.set("view engine", "ejs");

// Expongo archivos estaticos
app.use("/css", express.static( path.join(__dirname, "/public/css") ));
app.use("/js", express.static( path.join(__dirname + "/public/js") ));
app.use("/resources", express.static( path.join(__dirname + "/public/resources") ));
app.use("/files3d", express.static( path.join(__dirname + "/uploads/files3d") ));
app.use("/images", express.static( path.join(__dirname + "/uploads/images") ));

// Registro las rutas
app.use( require("./routes/home-routes") );
app.use( require("./routes/resumen-routes") );
app.use( require("./routes/trabajos-routes") );
app.use( require("./routes/usuarios-routes") );
app.use( require("./routes/archivos-routes") );
app.use(require("./routes/control-routes.js"));

// Registro rutas de administracion
app
.get("/ping", (req, res)=>{
    res.send("pong");
    res.end();
})
.get("/", (req, res)=>{
    res.status(200).sendFile( path.join(__dirname, "views", "index.html") );
})
.get("/403", (req, res)=>{
    res.status(403).sendFile( path.join(__dirname, "views", "html", "403.html") );
})
.get("/configuracion", (req, res)=>{
    if(!req.session?.data?.email) return res.status(403).end("Forbidden");
    res.status(200).json(configuracion);
})

// Registro ruta 404
app.use((req, res, next) => {
    //res.status(404).send("Error 404 - Recurso no encontrado");
    res.status(404).sendFile(__dirname + "/views/404.html")
})

// Inicio el servidor
app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor iniciado en el puerto ${process.env.PORT || 3000}`);
    console.log(`Entorno: ${process.env.NODE_ENV || "desarrollo"}`);
});