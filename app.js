if(process.env.NODE_ENV !=="production"){
require('dotenv').config();
}

const express = require("express"); 
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const joi = require("joi");
const session = require('express-session');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const methodOverride = require("method-override");
const nodemon = require('nodemon');
const{routesInit} = require("./routes/configRoutes");
const { Session } = require("inspector");



//connect to db:
main().catch(err => console.log('erorr in mongo:', err));

async function main() {
  await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
  // 'mongodb://localhost:27017/managment_file_db'
  console.log("mongodb:", "is connected!");
}

const app = express();

app.use(function(req, res, next) {  
  res.header("Access-Control-Allow-Headers","*");
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});  


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));




const sessionConfig = {
secret: process.env.SECRETSESSION,
resave: false,
saveUninitialized: true,
}


app.use(session(sessionConfig))
app.use(flash());
//function for flash:
app.use((req,res,next)=>{
  res.locals.success = req.flash('success');
  res.locals.erorr = req.flash('erorr');
  res.locals.wellcome = req.flash('wellcome');
  res.locals.emailUser = req.session._email;
  res.locals.isLogin = req.session._idUser;
  res.locals.role = req.session._role;
  res.locals.user = req.session._user;
  res.locals.dataUser = req.session._dataUser;
  res.locals.dataUserReq = req.session._dataUserReq;
  res.locals.work = req.session._work;
  next(); 
})





routesInit(app);
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));




const server = http.createServer(app);
let port = process.env.PORT || "3000";
server.listen(port);
app.use(express.json());
console.log("the server is run!!!");



