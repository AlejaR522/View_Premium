const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true,
    },

    correo: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    resetToken: {
        type: String,
    },

    resetTokenExpire: {
        type: Date,
    },

});