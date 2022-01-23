const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcrypt");


const UserSchema = new mongoose.Schema({
    firstName:{type: String},
    lastName: {type:String},
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    phone: {type:String, required:true},
    nameOfComp: {type:String, required:true},
    numOfComp: {type:String, required:true},
    role: {type:String, required:true},
    work: {type:String}
});




//מומלץ ששם של סכימה יתחיל באות גדולה
const UserModel = mongoose.model("user", UserSchema) //"Users" זה השם של המודל שאליו ניגש מהתוכניות שלנו ועליו נפעיל את הפקודות
module.exports = UserModel; //UserModel זה מה שאנחנו שולחים למסכים אחרים
