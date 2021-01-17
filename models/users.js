const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    idnumber: {
        type: Number,
        required: true,
        unique: true,
    },
    firstname: {
        type: String,
        required: true
    },
    middlename: {
        type: String,
    },
    lastname: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    birthdate: {
        type: String,
        required: true
    },
    contact_number: {
        type: Number,
        required: true
    },
    email_address: {
        type: String,
        required: true
    },
    home_address: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    shift: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});


const User = mongoose.model("User", userSchema);

module.exports = User;