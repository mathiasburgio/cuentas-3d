class Index{
    constructor() {
        $("[name='mostrar-contrasena']").on("click", () => {
            this.mostrarContrasena();
        });
        $("[name='iniciar-sesion']").on("click", () => {
            this.iniciarSesion();
        });

        setTimeout(() => {
            let email = localStorage.getItem("email");
            let contrasena = localStorage.getItem("contrasena");
            if(email && contrasena){
                $("[name='email']").val(email);
                $("[name='contrasena']").val(contrasena);
                $("#recordar").prop("checked", true);
            }
        }, 100);
    }
    mostrarContrasena() {
        const input = $("[name='contrasena']");
        const btn = $("[name='mostrar-contrasena']");
        if (input.attr("type") === "password") {
            input.attr("type", "text");
            btn.html("<i class='fas fa-eye-slash'></i>");
        } else {
            input.attr("type", "password");
            btn.html("<i class='fas fa-eye'></i>");
        }
    }
    async iniciarSesion() {
        try{
            await modal.waiting("iniciando sesión...");
            const email = $("[name='email']").val();
            const contrasena = $("[name='contrasena']").val();
        
            let resp = await $.post({
                url: "/usuarios/iniciar-sesion",
                data: {
                    email: email,
                    contrasena: contrasena
                }   
            });
    
            if(resp == "ok"){
                setTimeout(() => {
                    if($("#recordar").prop("checked")){
                        localStorage.setItem("email", email);
                        localStorage.setItem("contrasena", contrasena);
                    }else{
                        localStorage.removeItem("email");
                        localStorage.removeItem("contrasena");
                    }
                    
                    window.location.href = "/home";
                }, 1500);
            }else{
                throw resp;
            }
        }catch(error){
            console.error("Error al iniciar sesión:", error);
            modal.hide(false, ()=>{
                modal.message("Error al iniciar sesión: " + (error?.responseText || error));
            })
        }
    }
}