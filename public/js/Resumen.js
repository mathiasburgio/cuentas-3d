class Resumen{
    constructor(inicializar = false) {
        this.acumuladores = null;
        this.trabajos = [];
        this.reinversiones = [];
        this.anioMes = null;
        if (inicializar) this.init();
    }
    init() {

        let fx = fechas.getNow(false);
        $("[name='anioMes']").val(fx.split("-")[0] + "-" + fx.split("-")[1]);
        this.anioMes = $("[name='anioMes']").val();
        $("[name='anioMes']").on("change", ev => {
            let ele = $(ev.currentTarget);
            this.anioMes = ele.val();
            this.cargarRegistros();
        });

        $("[name='agregarIngresoExtra']").on("click", () => {
            modal.message("Funcionalidad no implementada", "Próximamente podrás agregar ingresos extra al resumen.");
        });
        $("[name='agregarEgresoExtra']").on("click", () => {
            modal.message("Funcionalidad no implementada", "Próximamente podrás agregar egresos extra al resumen.");
        });
        $("[name='ejecutarReinversion']").on("click", () => {
            this.modalEjecutarReinversion();
        });
        $("[name='verReinversiones']").on("click", () => {
            this.modalVerReinversiones();
        });

        $("[name='anioMes']").change();
    }
    async cargarRegistros() {
        try {
            const response = await $.get(`/resumen/obtener-resumen/${this.anioMes}`);
            this.trabajos = response.trabajos || [];
            this.reinversiones = response.reinversiones || [];
            this.listarRegistros();
        } catch (error) {
            console.error("Error al cargar los registros:", error);
            modal.message("Error: ", error?.responseText || error.toString());
        }
    }
    listarRegistros() {
        this.acumuladores = {
            trabajos: 0, //OK
            unidadesCreadas: 0, //OK
            ingresosExtra: 0, //OK
            egresosExtra: 0, //OK
            reinversionGenerada: 0, //OK
            reinversionEjecutada: 0, //OK
            costoFilamento: 0, //OK
            costoElectrico: 0, // FALTA
            costosVarios: 0, //OK
            montoBrutoVendido: 0, // OK
            montoBrutoVendidoCobrado: 0, // OK
            montoBrutoVendidoPendiente: 0, // OK
        };

        this.acumuladores.trabajos = this.trabajos.length;
        this.acumuladores.reinversionEjecutada = this.reinversiones.reduce((acc, reinversion) => acc + reinversion.monto, 0);

        this.trabajos.forEach(registro => {
            this.acumuladores.unidadesCreadas += registro.cantidad;
            this.acumuladores.reinversionGenerada += ((registro.precioPorUnidad * registro.costos.porcentajeReinversion / 100) * registro.cantidad);
            this.acumuladores.costoFilamento += (registro.costos.filamentoKg * registro.pesoFilamentoUnidad / 1000) * registro.cantidad;

            const costoElectrico = trabajos.obtenerConsumoElectrico(registro);
            this.acumuladores.costoElectrico += costoElectrico.total;

            this.acumuladores.costosVarios += registro.costosVariables.reduce((acc, cv) => {
                return acc + (cv.costoPorUnidad * registro.cantidad);
            }, 0);

            this.acumuladores.montoBrutoVendido += (registro.precioPorUnidad * registro.cantidad);
            this.acumuladores.montoBrutoVendidoCobrado += registro.cobros.reduce((acc, cobro) => acc + cobro.monto, 0);
        });
        this.acumuladores.montoBrutoVendidoPendiente = this.acumuladores.montoBrutoVendido - this.acumuladores.montoBrutoVendidoCobrado;
        this.acumuladores.gananciaNeta = this.acumuladores.montoBrutoVendido - this.acumuladores.costoFilamento - this.acumuladores.costosVarios - this.acumuladores.reinversionGenerada - this.acumuladores.costoElectrico;

        $("[name='trabajos']").html(utils.formatNumber(this.acumuladores.trabajos));
        $("[name='unidadesCreadas']").html(utils.formatNumber(this.acumuladores.unidadesCreadas));
        $("[name='ingresosExtra']").html(utils.formatNumber(this.acumuladores.ingresosExtra));
        $("[name='egresosExtra']").html(utils.formatNumber(this.acumuladores.egresosExtra));
        $("[name='reinversionGenerada']").html(utils.formatNumber(this.acumuladores.reinversionGenerada));
        $("[name='reinversionEjecutada']").html(utils.formatNumber(this.acumuladores.reinversionEjecutada));
        $("[name='costosFilamento']").html(utils.formatNumber(this.acumuladores.costoFilamento));
        $("[name='costoElectrico']").html(utils.formatNumber(this.acumuladores.costoElectrico));
        $("[name='costosVarios']").html(utils.formatNumber(this.acumuladores.costosVarios));
        $("[name='montoBrutoVendido']").html(utils.formatNumber(this.acumuladores.montoBrutoVendido));
        $("[name='montoBrutoVendidoCobrado']").html(utils.formatNumber(this.acumuladores.montoBrutoVendidoCobrado));
        $("[name='montoBrutoVendidoPendiente']").html(utils.formatNumber(this.acumuladores.montoBrutoVendidoPendiente));
        $("[name='gananciaNeta']").html(utils.formatNumber(this.acumuladores.gananciaNeta));
    }
    modalEjecutarReinversion() {
        let fox = $("#modal-ejecutar-reinversion").html();
        modal.show({
            title: "Ejecutar reinversión",
            body: fox,
            buttons: "back"
        })

        $("#modal [name='fecha']").val(fechas.getNow(false));

        $("#modal [name='guardar']").on("click", async ev => {
            let ele = $(ev.currentTarget);
            try {
                let fecha = $("#modal [name='fecha']").val();
                let detalle = $("#modal [name='detalle']").val();
                let monto = parseFloat($("#modal [name='monto']").val());

                if(!fecha) return modal.addPopover({ querySelector: ele, message: "Fecha no válida" });
                if(!detalle || detalle.trim().length < 3) return modal.addPopover({ querySelector: ele, message: "Detalle no válido" });
                if(isNaN(monto) || monto <= 0) return modal.addPopover({ querySelector: ele, message: "Monto no válido" });
                
                await $.post({
                    url: "/resumen/ejecutar-reinversion",
                    data: { fecha, detalle, monto, mesAnio: this.anioMes }
                });

                this.cargarRegistros();
                modal.hide(false, () => {
                    modal.message("Reinversión ejecutada", "La reinversión se ha registrado correctamente.");
                });
            } catch (error) {
                console.error("Error al ejecutar la reinversión:", error);
                modal.addPopover({ querySelector: ele, message: "Error al ejecutar la reinversión" });
            }
        });
    }
    modalVerReinversiones() {
        let fox = $("#modal-ver-reinversiones").html();
        modal.show({
            title: "Reinversiones del mes",
            body: fox,
            size: "lg",
            buttons: "back"
        });

        let tbody = "";
        this.reinversiones.forEach(reinversion => {
            let fecha = fechas.parse2(reinversion.fecha, "USA_FECHA");
            let row = `<tr>
                <td>${fecha}</td>
                <td>${reinversion.detalle}</td>
                <td class="text-right font-weight-bold">${utils.formatNumber(reinversion.monto)}</td>
            </tr>`;
            tbody += row;
        });
        $("#modal tbody").html(tbody);
    };

}