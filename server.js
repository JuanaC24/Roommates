require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const getRandomUser = require('./getRandomUser');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const transporter = nodemailer.createTransport({
    service: 'hotmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const logFilePath = path.join(__dirname, 'email_logs.txt');

function logEmailStatus(status) {
    const logMessage = `${new Date().toISOString()} - ${status}\n`;
    fs.appendFile(logFilePath, logMessage, 'utf8');
}

// Variables para caché en memoria
let roommatesCache = null;
let gastosCache = null;

// Función para inicializar la caché al iniciar la aplicación
async function initCache() {
    roommatesCache = await readDataFromFile(path.join(__dirname, 'roommates.json'), { roommates: [] });
    gastosCache = await readDataFromFile(path.join(__dirname, 'gastos.json'), { gastos: [] });
}

// Función para actualizar el archivo de roommates
async function updateRoommatesFile() {
    await fs.writeFile(path.join(__dirname, 'roommates.json'), JSON.stringify(roommatesCache, null, 2));
}

// Función para actualizar el archivo de gastos
async function updateGastosFile() {
    await fs.writeFile(path.join(__dirname, 'gastos.json'), JSON.stringify(gastosCache, null, 2));
}

// Función para leer datos de un archivo de manera asíncrona
async function readDataFromFile(filePath, defaultData) {
    try {
        const fileData = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        } else {
            throw error;
        }
    }
}

// Función para enviar correos electrónicos a todos los roommates
async function enviarCorreo(roommates, gasto) {
    const correos = roommates.map(r => r.email).filter(email => email).join(", ");
    if (!correos) {
        const status = 'No hay destinatarios definidos.';
        console.error(status);
        logEmailStatus(status);
        return { success: false, message: status };
    }

    const mensaje = `
        <h1>Notificación de Nuevo Gasto</h1>
        <p>Se ha registrado un nuevo gasto en el sistema:</p>
        <ul>
            <li>Roommate: ${gasto.roommate}</li>
            <li>Descripción: ${gasto.descripcion}</li>
            <li>Monto: ${gasto.monto}</li>
        </ul>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correos,
        subject: 'Nuevo Gasto Registrado',
        html: mensaje
    };

    try {
        await transporter.sendMail(mailOptions);
        const status = 'Correo enviado a: ' + correos;
        console.log(status);
        logEmailStatus(status);
        return { success: true, message: status };
    } catch (error) {
        const status = 'Error al enviar correo: ' + error.message;
        console.error(status);
        logEmailStatus(status);
        return { success: false, message: status };
    }
}

// Función para recalcular y actualizar las cuentas de los roommates
async function updateRoommateBalances() {
    roommatesCache.roommates.forEach(roommate => {
        roommate.debe = 0;
        roommate.recibe = 0;
    });

    gastosCache.gastos.forEach(gasto => {
        const roommate = roommatesCache.roommates.find(r => r.nombre === gasto.roommate);
        if (roommate) {
            roommate.debe += gasto.monto;
        }
    });

    const totalGasto = gastosCache.gastos.reduce((acc, gasto) => acc + gasto.monto, 0);
    const cantidadRoommates = roommatesCache.roommates.length;
    const montoPorRoommate = totalGasto / cantidadRoommates;

    roommatesCache.roommates.forEach(roommate => {
        roommate.recibe = montoPorRoommate - roommate.debe;
    });

    await updateRoommatesFile();
}

// Rutas de la API

app.get('/gastos', async (req, res) => {
    try {
        res.status(200).send(gastosCache);
        console.log('GET /gastos - 200 OK');
    } catch (error) {
        console.error('Failed to read gastos:', error);
        res.status(500).send({ message: "Error al leer gastos" });
        console.log('GET /gastos - 500 Internal Server Error');
    }
});

app.post('/gasto', async (req, res) => {
    try {
        const { roommate, descripcion, monto } = req.body;
        if (!roommate || !descripcion || typeof monto !== 'number') {
            res.status(400).send({ message: "Datos inválidos" });
            console.log('POST /gasto - 400 Bad Request');
            return;
        }
        const newGasto = { id: uuidv4(), roommate, descripcion, monto };

        gastosCache.gastos.push(newGasto);
        await updateGastosFile();

        await updateRoommateBalances(); // Recalcular balances

        const correoResultado = await enviarCorreo(roommatesCache.roommates, newGasto);

        res.status(201).send({ ...newGasto, correoResultado });
        console.log('POST /gasto - 201 Created');
    } catch (error) {
        console.error('Error adding gasto:', error);
        res.status(500).send({ message: "Error al añadir gasto" });
        console.log('POST /gasto - 500 Internal Server Error');
    }
});

app.put('/gasto/:id', async (req, res) => {
    const { id } = req.params;
    const { roommate, descripcion, monto } = req.body;

    try {
        const gastoIndex = gastosCache.gastos.findIndex(gasto => gasto.id === id);
        if (gastoIndex === -1) {
            res.status(404).send({ message: "Gasto no encontrado" });
            console.log('PUT /gasto - 404 Not Found');
            return;
        }

        gastosCache.gastos[gastoIndex] = { ...gastosCache.gastos[gastoIndex], roommate, descripcion, monto };
        await updateGastosFile();

        await updateRoommateBalances(); // Recalcular balances

        res.status(200).send({ message: "Gasto actualizado correctamente", gasto: gastosCache.gastos[gastoIndex] });
        console.log('PUT /gasto - 200 OK');
    } catch (error) {
        console.error('Error updating gasto:', error);
        res.status(500).send({ message: "Error al actualizar el gasto" });
        console.log('PUT /gasto - 500 Internal Server Error');
    }
});

app.delete('/gasto', async (req, res) => {
    const { id } = req.query;

    try {
        const newGastos = gastosCache.gastos.filter(gasto => gasto.id !== id);
        if (newGastos.length === gastosCache.gastos.length) {
            res.status(404).send({ message: "Gasto no encontrado" });
            console.log('DELETE /gasto - 404 Not Found');
            return;
        }

        gastosCache.gastos = newGastos;
        await updateGastosFile();

        await updateRoommateBalances(); // Recalcular balances

        res.status(200).send({ message: "Gasto eliminado correctamente" });
        console.log('DELETE /gasto - 200 OK');
    } catch (error) {
        console.error('Error deleting gasto:', error);
        res.status(500).send({ message: "Error al eliminar el gasto" });
        console.log('DELETE /gasto - 500 Internal Server Error');
    }
});

app.get('/roommates', async (req, res) => {
    try {
        res.status(200).send(roommatesCache);
        console.log('GET /roommates - 200 OK');
    } catch (error) {
        console.error('Failed to read roommates:', error);
        res.status(500).send({ message: "Error al leer roommates" });
        console.log('GET /roommates - 500 Internal Server Error');
    }
});

app.post('/roommate', async (req, res) => {
    try {
        const newRoommate = await getRandomUser();
        newRoommate.id = uuidv4();
        newRoommate.debe = 0;
        newRoommate.recibe = 0;

        if (!newRoommate.email) {
            res.status(400).send({ message: "Falta el campo email en los datos del roommate" });
            console.log('POST /roommate - 400 Bad Request');
            return;
        }

        roommatesCache.roommates.push(newRoommate);
        await updateRoommatesFile();

        res.status(201).send(newRoommate);
        console.log('POST /roommate - 201 Created');
    } catch (error) {
        console.error('Error adding roommate:', error);
        res.status(500).send({ message: "Error al añadir roommate" });
        console.log('POST /roommate - 500 Internal Server Error');
    }
});

app.listen(PORT, () => {
    initCache().then(() => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    }).catch(error => {
        console.error('Error al inicializar la caché:', error);
    });
});
