const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    imei: { type: String, required: true, unique: true },
    deviceName: { type: String, required: false },
    responsible: { type: String, required: false },
    phoneNumber: { type: String, required: false },
}, { minimize: false });

const deviceStatusSchema = new mongoose.Schema({
    imei: { type: String, required: true, unique: true },
    event: {
        number: { type: Number, required: false },
        string: { type: String, required: false }
    },
    fixTime: { type: Date, required: false },
    lat: { type: Number, required: false },
    lon: { type: Number, required: false },
    speed: { type: Number, required: false },
    course: { type: Number, required: false },
    ignition: { type: String, required: false },
    charging: { type: String, required: false },
    gpsTracking: { type: String, required: false },
    relayState: { type: String, required: false }
}, { minimize: false });

module.exports = {
    Device: mongoose.model('Device', deviceSchema),
    DeviceStatus: mongoose.model('DeviceStatus', deviceStatusSchema)
};