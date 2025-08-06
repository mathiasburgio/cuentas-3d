const configuracion = require("../configuracion.json");

async function iniciarSesion(req, res){
    try{
        let { email, contrasena } = req.body;
        if(!email || !contrasena) throw new Error("Email y contraseña son requeridos");

        const usuario = configuracion.usuarios.find(u => u.email === email && u.contrasena === contrasena);
        if(!usuario) throw new Error("Usuario o contraseña incorrectos");
        req.session.data = {
            email: usuario.email,
        };
        req.session.save();
        res.status(200).end("ok");
    }catch(error){
        //console.error("Error al iniciar sesión:", error);
        res.status(500).end(error.toString());
    };
}

async function cerrarSesion(req, res){
    try{
        req.session.destroy();
        setTimeout(() => {
            res.redirect("/");
        },1000);
    }catch(error){
        //console.error("Error al cerrar sesión:", error);
        res.status(500).end(error.toString());
    };
}

module.exports = {
    iniciarSesion,
    cerrarSesion
};