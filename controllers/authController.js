const User = require("../models/users");
const Log = require("../models/logs");
const Record = require("../models/records");
const Account = require("../models/accounts")
const jwt = require("jsonwebtoken");
require('dotenv').config();

// handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = {
        username: '',
        password: ''
    };

    // incorrect username
    if (err.message === "Incorrect username") {
        errors.username = "That username is not registered";
    }

    // incorrect password
    if (err.message === "Incorrect password") {
        errors.password = "That password is incorrect";
    }

    // duplicate username error
    if (err.code === 11000) {
        errors.username = 'that username is already registered';
        return errors;
    }

    // validation errors
    if (err.message.includes('account validation failed')) {
        // console.log(err);
        Object.values(err.errors).forEach(({
            properties
        }) => {
            // console.log(val);
            // console.log(properties);
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

// create json web token
const expiry_age = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({
        id
    }, 'ams-qrcode', {
        expiresIn: expiry_age
    });
};

module.exports.login_get = (req, res) => {
    res.render("index");
}
module.exports.register_get = (req, res) => {
    res.render("registeruser");
}
module.exports.qrcodegenerator_get = (req, res) => {
    res.render("qrcodegenerator");
}

// Logging out Administrator Account
module.exports.logout_get = (req, res) => {
    console.log("Logged out");
    res.cookie("jwt", "", {
        expiry_age: 1
    })
    res.redirect("/");
}

module.exports.qrcode_get = async (req, res) => {
    const id = req.params.id;
    console.log(id)

    User.findById(id)
        .then(result => {
            res.render("qrcodegenerator", {
                user: result
            })
        })
        .catch(err => {
            console.log(err);
        })
}

// Logging in Administrator Account
module.exports.loginadmin_post = async (req, res) => {
    const {
        username,
        password
    } = req.body;

    try {
        const account = await Account.login(username, password);
        const token = createToken(account._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            expiry_age: expiry_age * 1000
        });
        res.status(200).json({
            account: account._id
        })
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({
            errors
        });
    }
}

// Logging in User Account
module.exports.loginuser_post = async (req, res) => {
    const {idnumber,time, date} = req.body;
    console.log(`Scanned user ID number: ${idnumber}`);
    console.log(`Time today: ${time}`);
    console.log(`Date today: ${date}`);

    try {
        const userCheck = await User.findOne({idnumber})
        const logCheck = await Log.findOne({idnumber})
        const recordCheck = await Record.findOne({idnumber})
        // id = userCheck._id;
        
        // If USER is NOT registered
        if(userCheck == null)
        {
            return res.status(404).json({error: "This user is not registered"})
        }

        // If USER is registered and USER did not logged out last session then USER cannot enter again
        if (userCheck && logCheck && logCheck.date != date && logCheck.time_in != "" && logCheck.time_out == ""){
            return res.status(400).json({error: "You did not logged out last session. Please contact your admin."})
        }

        // If USER is registered and USER has logged out today's date then USER cannot enter again
        if (userCheck && logCheck && logCheck.date == date && logCheck.status == "logged out" && logCheck.time_in != "" && logCheck.time_out != ""){
            return res.status(400).json({error: "You cannot enter twice a day. Please contact your admin"})
        }

        // If USER is registered and USER has logged in then update log status to logged out and time out
        if (userCheck && logCheck && logCheck.date == date && logCheck.time_in != "" && logCheck.time_out == ""){
            const id = logCheck._id;
            console.log(id);

            const log =  await Log.findByIdAndUpdate(id, {status: "logged out", time_out: time}, {new: true});

            // const log = await Log.findOneAndUpdate({user_id: userCheck._id }, { status: "done", time_out: time }, {new: true});

            console.log("Uses log is now logged out")

            const record =  new Record({user_id: log.user_id, idnumber: log.idnumber, name: log.name, shift: log.shift, status: "done", date: log.date, time_in: log.time_in, time_out: log.time_out});
            record.save();
            console.log("User done log has been put to Record")

            await Log.findByIdAndUpdate(id, {time_in: log.time_in, time_out: log.time_out});
            console.log("User log time in and time out has been updated to blank")

            const timeOutLog = {
                userName: `${userCheck.firstname} ${userCheck.lastname}`,
                time_out: log.time_out,
            }
            return res.status(200).json({userOut: timeOutLog})
        }

        // If USER is registered and USER doesn't have logs then create a log
        if (userCheck && logCheck == null){
            const log = new Log({user_id: userCheck._id, idnumber: userCheck.idnumber, name: `${userCheck.firstname} ${userCheck.lastname}`, shift: userCheck.shift, status: "active", date: date, time_in: time, time_out: ""});
            log.save();

            console.log("New user has been added to logs and now active")

            const timeInLog = {
                userName: `${userCheck.firstname} ${userCheck.lastname}`,
                time_in: time,
            }

            return res.status(200).json({userFoundandRecord: timeInLog})
        }

        // If USER is registered and USER has logs and then create another log (different date)
        if (userCheck && logCheck &&  logCheck.date != date && logCheck.time_in != "" && logCheck.time_out != ""){
            const id = logCheck._id;
            await Log.findByIdAndUpdate(id, {status: "active", date: date, time_in: time, time_out: ""});

            console.log("Old User log has been updated and now active")

            const timeInLog = {
                userName: `${userCheck.firstname} ${userCheck.lastname}`,
                time_in: time,
            }

            return res.status(200).json({userFoundandRecord: timeInLog})
        }

    } catch (err) {
        console.log(err);
        res.status(400).json({error: '400'});
    }
}

module.exports.register_post = async (req, res) => {
    const newUser = req.body;
    console.log(newUser);

    const newUserID = newUser.idnumber;
    console.log(newUserID);

    const findID = await User.findOne({idnumber: newUserID})

    if (findID) {
        res.status(400).json({
            errors: "The ID number is already taken"
        });
    } else {
        const user = new User(req.body);
        user.save();
        res.status(200).json({
            user
        });
    }
}