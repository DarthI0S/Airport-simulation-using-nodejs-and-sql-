const cantTripulacion = document.getElementById('cantTripulacion');
const cantPilotos = document.getElementById('cantPilotos');
const cantSobrecargos = document.getElementById('cantSobrecargos');
const cantCopilotos = document.getElementById('cantCopilotos');


function getCantTripulacion() {
    fetch(`/tripulacion`)
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener vuelos de hoy");
        return res.json();
    })
    .then(data => {
        cantTripulacion.textContent  = data.length;
        cantPilotos.textContent  = data.filter(t => t.puesto === "Piloto").length;
        cantSobrecargos.textContent  = data.filter(t => t.puesto === "Sobrecargo").length;
        cantCopilotos.textContent  = data.filter(t => t.puesto === "Copiloto").length;
    })
    .catch(console.error); 
}

getCantTripulacion();


function renderTripulacion(datos) {
    tablaTripulacion.innerHTML = "";
    if (!datos || datos.length === 0) {
        tablaPasajeros.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:100%;">
            <p>No hay pasajeros disponibles.</p>
        </div>`;
        return;
    }

    datos.forEach(tripulante => {
        tablaTripulacion.innerHTML += `
        <tr>
            <td>${tripulante.Aerolinea}</td>
            <td>${tripulante.licencia}</td>
            <td>${tripulante.nombre} ${tripulante.apellido}</td>
            <td>${tripulante.puesto}</td>
            <td>${new Date(tripulante.fecha_contratacion).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                })}</td>
            <td>${tripulante.horas_vuelo}</td>
            <td>
                <button class="btn-edit" onclick="abrirEditor(
                '${tripulante.licencia}',
                '${tripulante.nombre}',
                '${tripulante.apellido}',
                '${tripulante.puesto}',
                '${tripulante.fecha_contratacion}',
                '${tripulante.horas_vuelo}'
                )">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-delete" onclick="eliminar(${tripulante.licencia})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    });
}

function eliminar(licencia){
    fetch('/eliminarTripulacion', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licencia })
    })
    .then(async res => {
        if (!res.ok) throw await res.json();
        return res.json();
    })
    .then(data => {
        getCantTripulacion();
        getTripulacion();
    })
    .catch(err => {
        alert(err.message);
    });
}

function getTripulacion() {
    fetch(`/tripulacion`)
    .then(res => {
        if (!res.ok) throw new Error("Error al obtener Tripulacion");
        return res.json();
    })
    .then(data => {
        renderTripulacion(data);
    })
    .catch(console.error);
}
getTripulacion();

function abrirEditor(licencia, nombre, apellido, puesto, fecha_contratacion, horas_vuelo) {
    console.log("Horas de vuelo:", horas_vuelo);
    document.getElementById("panelEditar").classList.add("active");
    document.getElementById("licencia").value = licencia;
    document.getElementById("nombre").value = nombre;
    document.getElementById("apellido").value = apellido;
    document.getElementById("puesto").value = puesto;
    document.getElementById("fecha_contratacion").value = fecha_contratacion.split("T")[0];
    document.getElementById("horas_vuelo").value = horas_vuelo;
}

function cerrarEditor() {
    document.getElementById("panelEditar").classList.remove("active");
}


const editarTripulante = document.getElementById("editarTripulante");
editarTripulante.addEventListener("submit", async (e) => {
    e.preventDefault();

    fetch('/editarTripulante', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            licencia: document.getElementById("licencia").value,
            nombre: document.getElementById("nombre").value,
            apellido: document.getElementById("apellido").value,
            puesto: document.getElementById("puesto").value,
            fecha_contratacion: document.getElementById("fecha_contratacion").value,
            horas_vuelo: document.getElementById("horas_vuelo").value,
        })
    })
    .then(async res => {
        if (!res.ok) throw await res.json();
        return res.json();
    })
    .then(data => {
        getCantTripulacion();
        getTripulacion();
        cerrarEditor()
    })
    .catch(err => {
        alert(err.message);
    });

});