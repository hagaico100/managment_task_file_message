const express = require("express");
const nodemailer = require('nodemailer');

//מנהל של כל הנתיבים. הפירוט של כל נתיב מופיע בקובץ האישי שלו

//להוסיף כאן כל נתיב חדש
const managerR = require("./manager");
const usersR = require("./users");
const messagesR = require("./messages");
//יבוא של כל הנתיבים
exports.routesInit = (app)=> {
    app.use("/", managerR, messagesR);
    app.use("/users", usersR);
}