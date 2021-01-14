const { db } = require('../models/users');
const User = require('../models/users');

module.exports.admin_get = (req,res) => {res.render("admin");}
module.exports.logs_get = (req,res) => {res.render("logs");}

module.exports.users_get = (req,res) => {

    User.find()
    .then((result) => {
        res.render("users", {users: result})
    })
    .catch((err) => {
        console.log(err);
    })
}


module.exports.qrcodetester_get = (req,res) => {res.render("qrcodetester");}
module.exports.about_get = (req,res) => {res.render("about");}