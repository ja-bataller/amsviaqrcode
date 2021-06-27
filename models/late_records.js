const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// LOGS SCHEMA IN MONGO DB
const LateSchema = new Schema({
    user_id: {
        type: String,
    },
    idnumber: {
        type: String,
    },
    name: {
        type: String,
    },
    shift: {
        type: String,
    },
    late: {
        type: String,
    },
    late_reason: {
        type: String,
    },
    date: {
        type: String,
    },
    month: {
        type: Number,
    },
    late_count: {
        type: Number,
    },
    
}, {
    timestamps: true
});

const Late = mongoose.model("Late", LateSchema);

module.exports = Late;
