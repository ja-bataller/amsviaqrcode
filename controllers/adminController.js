// Express NPM
const express = require("express");
// Express app
const app = express();

const {db} = require('../models/users');
const User = require('../models/users');
const Log = require('../models/logs');
const Record = require('../models/records');

// OPEN ADMIN PAGE AND SHOW DATA DASHBOARD FROM MONGO DB
module.exports.admin_get = (req, res) => {
    User.countDocuments({}, function(err, count) {
        let employees = count;
        User.countDocuments({
            shift: "day"
        }, function(err, count){
            let day = count;
            User.countDocuments({
                shift: "night"
            }, function(err, count){
                let night = count;
                Log.countDocuments({
                    status: "active"
                }, function(err, count){
                    let active = count;
                    Log.countDocuments({
                        status: "logged out"
                    }, function(err, count){
                        let done = count;
                        Log.countDocuments({
                            late: "yes"
                        }, function(err, count){
                            let late = count;
                            res.render("admin", {employees,day,night,active,done,late})
                        });
                    });
                });
            });
        });
    });

    // User.countDocuments()
    // .then((count) => {
    //     res.render(locals,{employees: count});
    //    console.log(count);
    // })
    // .catch((err) => {
    //     console.log(err);
    // })
}

// OPEN LOGS PAGE AND SHOW ALL LOGS TABLE FROM MONGO DB
module.exports.logs_get = (req, res) => {
    Log.find()
        .then((result) => {
            res.render("logs", {
                logs: result
            })
        })

        .catch((err) => {
            res.render("404page")
            console.log(err);
        })
}

// OPEN USER RECORDS PAGE AND SHOW SINGLE USER RECORDS TABLE FROM MONGO DB
module.exports.userrecords_get = async (req, res) => {
    const id = req.params.id;

    const findUserRecord = await Record.find({user_id: id})
    const findUserName = await Record.findOne({user_id: id})

    if(findUserRecord && findUserName){
        console.log(findUserRecord);
            res.render("user_records", {user_records: findUserRecord, name: findUserName.name})
    } else {
        res.render("404page")
        console.log("Error");
    }

}

// OPEN RECORDS PAGE AND SHOW ALL RECORDS TABLE FROM MONGO DB
module.exports.records_get = (req, res) => {
    Record.find()
        .then((result) => {

            res.render("records", {
                records: result
            })
        })
        .catch((err) => {
            res.render("404page")
            console.log(err);
        })
}

// OPEN USERS PAGE AND SHOW ALL USERS TABLE FROM MONGO DB
module.exports.users_get = (req, res) => {
    User.find()
        .then((result) => {

            result.map(user => {
                user.middlename = user.middlename != '' ? user.middlename : 'N/A';
            });

            res.render("users", {
                users: result
            })
        })
        .catch((err) => {
            res.render("404page")
            console.log(err);
        })
}

// OPEN USER VIEW PAGE AND SHOW SINGLE USER DATA FROM MONGO DB
module.exports.userview_get = async (req, res) => {
    const id = req.params.id;

    const checkUser =  await User.findById(id)

    try{
        if (!checkUser){
            res.render("404page")
        }   
        else {
            res.render("user_view", {user: checkUser})
        }
    }
    catch{
        res.render("404page")
        console.log("Error")
    }

}

// USER VIEW PAGE - EDIT THE CURRENT USER INFORMATION
module.exports.update_post = (req, res) => {
    const id = req.params.id;

    const user = new User(req.body);
    
    User.findByIdAndUpdate(id, {
            firstname: user.firstname,
            middlename: user.middlename,
            lastname: user.lastname,
            gender: user.gender,
            age: user.age,
            birthdate: user.birthdate,
            contact_number: user.contact_number,
            email_address: user.email_address,
            home_address: user.home_address,
            department: user.department,
            shift: user.shift
        })
        .then((result) => {
            res.redirect("/users");
        })
        .catch((err) => {
            res.render("404page")
            console.log(err);
        })
}

// USER VIEW PAGE - PERMANENTLY DELETE THE CURRENT USER
module.exports.users_delete = async (req, res) => {
    const id = req.params.id;
    console.log(id);

    const userCheck = await User.findOne({_id: id})
    const findUserLog = await Log.findOne({user_id: id})

    if (userCheck && findUserLog) {
        // delete User
        await User.findByIdAndDelete(id)

        // delete User Logs
        await Log.deleteOne({user_id: id})
        
    //     // delete User Records
    //     await Record.deleteMany({user_id: userIdLog})
        return res.status(200).json({success: "User has been deleted successfully"})
    }

    if (userCheck) {
        // delete User
        await User.findByIdAndDelete(id)

        return res.status(200).json({success: "User has been deleted successfully"})
    } 

    else {
        res.render("404page")
    }

}

// OPEN QR CODE TESTER PAGE
module.exports.qrcodetester_get = (req, res) => {
    res.render("qrcodetester");
}

// OPEN ABOUT PAGE
module.exports.about_get = (req, res) => {
    res.render("about");
}
