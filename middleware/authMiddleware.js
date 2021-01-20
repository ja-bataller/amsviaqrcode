const jwt = require("jsonwebtoken");
const Account = require("../models/accounts")
require('dotenv').config();

const secret = process.env.JWT_SECRET;

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // CHECK JSON WEB TOKEN (JWT) EXIST AND VERIFIED
    if (token) {
        jwt.verify(token, secret, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect("/");
            } else {
                console.log(decodedToken);
                next();
            }
        })
    } else {
        res.redirect("/");
    }
}

// CHECK CURRENT ADMINISTRATOR ACCOUNT
const checkAccount = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, secret, async (err, decodedToken) => {
            if (err) {
                res.locals.account = null;
                next();
            } else {
                let account = await Account.findById(decodedToken.id);
                res.locals.account = account;
                next();
            }
        });
    } else {
        res.locals.account = null;
        next();
    }
};

module.exports = {
    requireAuth,
    checkAccount
};