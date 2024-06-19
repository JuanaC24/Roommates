let roommates = [];
let gastos = [];
let gastoEditing = null;

const getRoommates = async () => {
    const res = await fetch("http://localhost:3000/roommates");
    const data = await res.json();
    roommates = data.roommates;
};

const getGastos = async () => {
    const res = await fetch("http://localhost:3000/gastos");
    const data = await res.json();
    gastos = data.gastos;
};

const imprimir = async () => {
    try {
        await getRoommates();
        await getGastos();
        $("#roommates").html("");
        $("#roommatesSelect").html("");
        $("#roommatesSelectModal").html("");
        roommates.forEach((r) => {
            $("#roommatesSelect").append(`<option value="${r.nombre}">${r.nombre}</option>`);
            $("#roommatesSelectModal").append(`<option value="${r.nombre}">${r.nombre}</option>`);
            $("#roommates").append(`
                  <tr>
                    <td>${r.nombre}</td>
                    <td class="text-danger">${r.debe ? r.debe : "-"}</td>
                    <td class="text-success">${r.recibe ? r.recibe : "-"}</td>
                  </tr>
              `);
        });
        $("#gastosHistorial").html("");
        gastos.forEach((g) => {
            $("#gastosHistorial").append(`
                <tr>
                  <td>${g.roommate}</td>
                  <td>${g.descripcion}</td>
                  <td>${g.monto}</td>
                  <td class="d-flex align-items-center justify-content-between">
                    <i class="fas fa-edit text-warning" onclick="editGasto('${g.id}')" data-toggle="modal" data-target="#exampleModal"></i>
                    <i class="fas fa-trash-alt text-danger" onclick="deleteGasto('${g.id}')" ></i>
                  </td>
                </tr>
              `);
        });
    } catch (e) {
        console.error("Error durante la inicialización de la aplicación:", e);
    }
};

const nuevoRoommate = async () => {
    try {
        const res = await fetch("http://localhost:3000/roommate", { method: "POST" });
        const data = await res.json();

        if (res.ok) {
            $("#resultMessage").html(`<div class="alert alert-success">Roommate añadido correctamente.</div>`);
        } else {
            $("#resultMessage").html(`<div class="alert alert-danger">Error al añadir roommate. ${data.message}</div>`);
        }

        imprimir();
    } catch (error) {
        console.error('Error al añadir roommate:', error);
        $("#resultMessage").html(`<div class="alert alert-danger">Error al añadir roommate. ${error.message}</div>`);
    }
};

const agregarGasto = async () => {
    const roommateSelected = $("#roommatesSelect").val();
    const descripcion = $("#descripcion").val();
    const monto = Number($("#monto").val());

    try {
        const res = await fetch("http://localhost:3000/gasto", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roommate: roommateSelected,
                descripcion,
                monto,
            }),
        });
        const data = await res.json();

        if (res.ok) {
            $("#resultMessage").html(`<div class="alert alert-success">Gasto añadido correctamente. ${data.correoResultado.message}</div>`);
        } else {
            $("#resultMessage").html(`<div class="alert alert-danger">Error al añadir gasto. ${data.message}</div>`);
        }

        imprimir();
    } catch (error) {
        console.error('Error al añadir gasto:', error);
        $("#resultMessage").html(`<div class="alert alert-danger">Error al añadir gasto. ${error.message}</div>`);
    }
};

const deleteGasto = async (id) => {
    try {
        const res = await fetch(`http://localhost:3000/gasto?id=${id}`, { method: "DELETE" });
        const data = await res.json();

        if (res.ok) {
            $("#resultMessage").html(`<div class="alert alert-success">Gasto eliminado correctamente.</div>`);
        } else {
            $("#resultMessage").html(`<div class="alert alert-danger">Error al eliminar gasto. ${data.message}</div>`);
        }

        imprimir();
    } catch (error) {
        console.error('Error al eliminar gasto:', error);
        $("#resultMessage").html(`<div class="alert alert-danger">Error al eliminar gasto. ${error.message}</div>`);
    }
};

const updateGasto = async () => {
    const roommateSelected = $("#roommatesSelectModal").val();
    const descripcion = $("#descripcionModal").val();
    const monto = Number($("#montoModal").val());

    try {
        const res = await fetch(`http://localhost:3000/gasto/${gastoEditing}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roommate: roommateSelected,
                descripcion,
                monto,
            }),
        });
        const data = await res.json();

        if (res.ok) {
            $("#resultMessage").html(`<div class="alert alert-success">Gasto actualizado correctamente.</div>`);
        } else {
            $("#resultMessage").html(`<div class="alert alert-danger">Error al actualizar gasto. ${data.message}</div>`);
        }

        $("#exampleModal").modal("hide");
        imprimir();
    } catch (error) {
        console.error('Error al actualizar gasto:', error);
        $("#resultMessage").html(`<div class="alert alert-danger">Error al actualizar gasto. ${error.message}</div>`);
    }
};

const editGasto = (id) => {
    gastoEditing = id;
    const { roommate, descripcion, monto } = gastos.find((g) => g.id == id);
    $("#roommatesSelectModal").val(roommate);
    $("#descripcionModal").val(descripcion);
    $("#montoModal").val(monto);
};

$(document).ready(function() {
    imprimir();
});
