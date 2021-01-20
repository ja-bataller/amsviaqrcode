const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

// ADMINISTRATOR ACCOUNT SCHEMA IN MONGO DB
const accountSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});


// BCRYPT ADMINISTRATOR ACCOUNT BEFORE SAVING IT TO MONGO DB
accountSchema.pre("save", async function(next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt)
    next();
});

// CHECKING / VALIDATION IF THE ADMINISTRATOR ACCOUNT IS REGISTERED IN MONGO DB
accountSchema.statics.login = async function(username, password) {
    const account = await this.findOne({
        username
    });
    if (account) {
        const auth = await bcrypt.compare(password, account.password)
        if (auth) {
            return account;
        }
        throw Error("Incorrect password");
    }
    throw Error("Incorrect username")
}

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;