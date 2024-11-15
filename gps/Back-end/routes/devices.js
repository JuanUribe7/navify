const express = require('express');
const router = express.Router();
const { Device, DeviceStatus } = require('../models/Device').Device; // Asegúrate de importar 
const { getImei, setImei } = require('../config');DeviceStatus

// Endpoint para actualizar la ubicación del dispositivo desde el GPS
router.get('/', async (req, res) => {
    try {
        const devices = await Device.find({}, 'deviceName responsible imei phoneNumber');
        res.json(devices);
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
        res.status(500).json({ message: error.message });
    }
});

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
        setImei(dispositivoGuardado._id.toString(), imei);
        console.log('IMEI guardado para dispositivo:', dispositivoGuardado._id, getImei(dispositivoGuardado._id.toString()));

        res.status(201).json(dispositivoGuardado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al agregar el dispositivo: ' + error.message });
    }
});
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

router.put('/:id', async (req, res) => {
    try {
        const updatedDevice = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedDevice) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }
        res.json(updatedDevice);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error al actualizar el dispositivo: ' + error.message });
    }
});

// Eliminar un dispositivo
router.delete('/:id', async (req, res) => {
    try {
        const deletedDevice = await Device.findByIdAndDelete(req.params.id);
        if (!deletedDevice) {
            return res.status(404).json({ message: 'Dispositivo no encontrado' });
        }
        res.json({ message: 'Dispositivo eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el dispositivo: ' + error.message });
    }
});

module.exports = router;