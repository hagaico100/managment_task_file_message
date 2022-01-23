const mongoose = require("mongoose");
const express = require("express");
const Schema  = mongoose.Schema;

const DataSchema = new mongoose.Schema({
    idOfUser: {type: Schema.Types.ObjectId , ref:'user' , unique:true, required: true},
    documents: [{sendAdmin: {type:Number, default:0},sendWork: {type:Number, default:0},sendM: {type:Number, default:0}, documentRequired: {type:String}, expiryDate: {type:String}, statusD: {type:String, default:"0"}, done: {type:String, default:"0"}, document:[{documentFileName: {type:String}, documentPath: {type:String}, documentOriginalName: {type:String}}]}],
    messages: [{sub: {type:String}, date: {type: String}, send:{type: Schema.Types.ObjectId , ref:'user'}, message: {type:String}}],
    newMessage:{type: Number, default: 0},
    personalMessages: [{sub: {type:String}, date: {type: String}, send: {type: Schema.Types.ObjectId , ref:'user'}, message: {type:String}}],
    newMessageP:{type: Number, default: 0},
    numOfDocumentRequired:{type: Number, default: 0},
    numOfDocument:{type: Number, default: 0},
    req:{type:Number, default: 0}
    
});


//מומלץ ששם של סכימה יתחיל באות גדולה
const DataModel = mongoose.model("data", DataSchema) 
module.exports = DataModel; //DataModel זה מה שאנחנו שולחים למסכים אחרים
