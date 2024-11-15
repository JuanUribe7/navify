const express = require('express');
const router = express.Router();
const { Device, DeviceStatus } = require('../models/Device'); // Asegúrate de importar DeviceStatus

// Endpoint para obtener todos los dispositivos
router.get('/', async (req, res) => {
    try {
        const dispositivos = await Device.find();
        res.json(dispositivos);
    } catch (error) {
        console.error('Error al obtener dispositivos:', error.message);
        res.status(500).json({ error: 'Error al obtener dispositivos: ' + error.message });
    }
});

// Endpoint para actualizar la ubicación del dispositivo desde el GPS
router.post('/update-from-gps', async (req, res) => {
    try {
        const { imei, Lat, Lon, speed, course, time } = req.body;

        // Verificar que todos los datos requeridos estén presentes
        if (!imei || Lat === undefined || Lon === undefined) {
            return res.status(400).json({ error: 'IMEI, latitud y longitud son obligatorios.' });
        }

        // Encontrar el dispositivo por IMEI
        const dispositivo = await Device.findOne({ imei });
        if (!dispositivo) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }

        // Crear o actualizar el estado del dispositivo
        await DeviceStatus.findOneAndUpdate(
            { imei },
            {
                imei,
                fixTime: time,
                lat: Lat,
                lon: Lon,
                speed,
                course,
                event: { string: 'location' }
            },
            { upsert: true, new: true }
        );

        console.log(`Ubicación actualizada para IMEI: ${imei} - Latitud: ${Lat}, Longitud: ${Lon}`);
        res.json({ message: 'Ubicación actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar la ubicación:', error.message);
        res.status(500).json({ error: 'Error al actualizar la ubicación: ' + error.message });
    }
});

// Endpoint para agregar un nuevo dispositivo
router.post('/', async (req, res) => {
    try {
        const { deviceName, responsible, imei, phoneNumber } = req.body;

        if (!deviceName || !responsible || !imei) {
            return res.status(400).json({ error: 'Los campos deviceName, responsible e imei son obligatorios.' });
        }

        const nuevoDispositivo = new Device({
            deviceName,
            responsible,
            imei,
            phoneNumber,
        });

        const dispositivoGuardado = await nuevoDispositivo.save();
        res.status(201).json(dispositivoGuardado);
    } catch (error) {
        console.error('Error al agregar dispositivo:', error.message);
        res.status(500).json({ error: 'Error al agregar dispositivo: ' + error.message });
    }
});

// Endpoint para actualizar un dispositivo existente
router.put('/:id', async (req, res) => {
    try {
        const { deviceName, responsible, imei, phoneNumber } = req.body;

        if (!deviceName || !responsible || !imei) {
            return res.status(400).json({ error: 'Los campos deviceName, responsible e imei son obligatorios.' });
        }

        const dispositivoActualizado = await Device.findByIdAndUpdate(
            req.params.id,
            { deviceName, responsible, imei, phoneNumber },
            { new: true }
        );

        if (!dispositivoActualizado) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }

        res.json(dispositivoActualizado);
    } catch (error) {
        console.error('Error al actualizar dispositivo:', error.message);
        res.status(500).json({ error: 'Error al actualizar dispositivo: ' + error.message });
    }
});
// En devices.js
router.get('/status/:imei', async (req, res) => {
    try {
        const { imei } = req.params;
        const deviceStatus = await DeviceStatus.findOne({ imei });
        if (!deviceStatus) {
            return res.status(404).json({ message: 'Estado del dispositivo no encontrado' });
        }
        res.json(deviceStatus);
    } catch (error) {
        console.error('Error al obtener el estado del dispositivo:', error.message);
        res.status(500).json({ error: 'Error al obtener el estado del dispositivo: ' + error.message });
    }
});

// Endpoint para eliminar un dispositivo
router.delete('/:id', async (req, res) => {
    try {
        const dispositivoEliminado = await Device.findByIdAndDelete(req.params.id);

        if (!dispositivoEliminado) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }

        res.json({ message: 'Dispositivo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar dispositivo:', error.message);
        res.status(500).json({ error: 'Error al eliminar dispositivo: ' + error.message });
    }
});

module.exports = router;