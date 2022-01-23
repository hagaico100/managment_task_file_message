const express = require("express");
const router = express.Router();
const app = express();
const multer = require('multer');
const upload = multer({dest:'upload/'});
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const UserModel = require('../models/userModel');
const DataModel = require('../models/dataModel');
const {isLoginIn} = require('../public/js/middleware');




 //to show edit of personal message:
 router.get("/manager/:id/editP", isLoginIn, async (req,res)=>{
  
    //to update session of datauser:
    res.locals.dataUserReq = await DataModel.findOne({_id: res.locals.dataUserReq});
          const id = req.params.id;
          const Pmessage = "1";
            const datas = await DataModel.findOne({"personalMessages._id": id});
            res.render('editMessage.ejs', {datas: datas, id:id, Pmessage: Pmessage });
           
});

 //to show edit of message:
 router.get("/manager/:id/edit", isLoginIn, async (req,res)=>{
    //to update session of datauser:
    res.locals.dataUserReq = await DataModel.findOne({_id: res.locals.dataUserReq});
    
        const id = req.params.id;
        const Pmessage = "-";
        const datas = await DataModel.findOne({"messages._id": id});
        res.render('editMessage.ejs', {datas: datas, id:id, Pmessage: Pmessage });
            
});

router.post("/messages/edit", async (req,res)=>{
    const updatePM = req.body;
    const message = updatePM.message;
    const idclient = updatePM.idOfClient;
    const sub = updatePM.sub;
    const send = updatePM.send;
    const idOfMessage = updatePM.idOfMessage;
    const forMe = updatePM.forMe;
    var d = new Date();
    var date= d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
   
    if(forMe=="pm"){
        const datas = await DataModel.findOne({idOfUser: idclient});
    await DataModel.updateOne({_id:datas._id, "personalMessages._id": idOfMessage},{$set: {"personalMessages.$.date": date, "personalMessages.$.message": message, "personalMessages.$.send": send, "personalMessages.$.sub": sub}}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
    //to update cuonter of new messages:
    const newMessage = (datas.newMessageP)+1;
    await DataModel.findByIdAndUpdate(datas._id, {"newMessageP": newMessage});

    }else{
        const datas = await DataModel.findOne({idOfUser: idclient});
        await DataModel.updateOne({_id:datas._id, "messages._id": idOfMessage},{$set: {"messages.$.date": date, "messages.$.message": message, "messages.$.send": send, "messages.$.sub": sub}}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
        //to update cuonter of new messages:
        const newMessage = (datas.newMessage)+1;
        await DataModel.findByIdAndUpdate(datas._id, {"newMessage": newMessage});
    
    }
   
    req.flash('success', "תוכן ההודעה עודכן בהצלחה");
    res.redirect(`/manager/${req.session._dataUser._id}`);
    });
  
    router.delete("/messages/:id/del", isLoginIn, async (req,res)=>{
       
            const idclient = req.body.idOfClient;
            const messageTo = req.body.messageTo;
            const idOfMessage = req.params.id;
            // to personal Messages:
            if(messageTo=="p"){
            await DataModel.updateOne(
                {_id: idclient},
                {$pull: {personalMessages:{_id:idOfMessage}}},
                { multi: true }
              );
            //to privete Messages:
            }else if(messageTo=="m"){
                await DataModel.updateOne(
                    {_id: idclient},
                    {$pull: {messages:{_id:idOfMessage}}},
                    { multi: true }
                  );
            }
            res.redirect(`/manager/${req.session._dataUser._id}`);
    });
    
router.get("/messages/MessageToOneUser", async (req,res)=>{
    //to update session of datauser:
    res.locals.dataUserReq = await DataModel.findOne({_id: res.locals.dataUserReq});

    const link = "שליחת הודעה ללקוח אחד";
    if(req.session._role!='מנהל'){
    
    const client = await UserModel.find({work: req.session._idUser});
    //console.log('all user:', client);
    const to = "MessageToOneUser";
    res.render('messagesBar.ejs', {to: to, link: link, myclient:client});    
    }else{
        const client = await UserModel.find({});
    //console.log('all user:', client);
    const to = "MessageToOneUser";
    res.render('messagesBar.ejs', {to: to, link: link, myclient:client});    
    }
    
    });
    
    router.get("/messages/MessageToAllUsers", async (req,res)=>{
       //to update session of datauser:
    res.locals.dataUserReq = await DataModel.findOne({_id: res.locals.dataUserReq});

        const link = "שליחת הודעה לכל הלקוחות";
        const to = "MessageToAllUsers";
            const all= "-";
            res.render('messagesBar.ejs', {to: to, link: link, myclient:all});
        });
    
    router.post("/MessageToAllUsers", async (req,res)=>{
        const MessageToAllUsers = req.body;
        const usersOfWork = await UserModel.find({ work: MessageToAllUsers.send});
    
            const datas = await DataModel.find({idOfUser: usersOfWork}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
            console.log('datas.new:', datas);
        
    
        const message = MessageToAllUsers.message;
        const send = MessageToAllUsers.send;
        const sub = MessageToAllUsers.sub;
        var d = new Date();
        var date= d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
    
        for (let i = 0; i < datas.length; i++) {
           
            const update = await DataModel.findByIdAndUpdate(datas[i]._id, {$addToSet: {"messages":{date: date, message: message,send: send, sub: sub }}},{safe: true, upsert: true}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
    //to update cuonter of new messages:
    const newMessage = (update.newMessage)+1;
    await DataModel.findByIdAndUpdate(datas[i]._id, {"newMessage": newMessage});
    
            
        }
    
        req.flash('success', "ההודעה נשלחה לכולם בהצלחה");
       res.redirect('/');
        });
    
    
        router.post("/MessageToOneUser", async (req,res)=>{
            const MessageToOneUsers = req.body;
            console.log('req.body', MessageToOneUsers);
            const message = MessageToOneUsers.message;
            const idclient = MessageToOneUsers.clientid;
            const sub = MessageToOneUsers.sub;
            const send = MessageToOneUsers.send;
    
            var d = new Date();
            var date= d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();
            
        const datas = await DataModel.findOne({idOfUser: idclient});
    
        const update = await DataModel.findByIdAndUpdate(datas._id,{$addToSet: {"personalMessages": {date: date, message: message, send: send, sub: sub}}},{safe: true, upsert: true}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
     
            //to update cuonter of new messages:
            const newMessage = (update.newMessageP)+1;
            console.log("update", update);
            await DataModel.findByIdAndUpdate(datas._id, {"newMessageP": newMessage});
            req.flash('success', "ההודעה נשלחה בהצלחה");
            res.redirect(`/manager/${req.session._dataUser._id}`);
            });

            router.get("/messages/:id", async (req,res)=>{
                //to update session of datauser:
    res.locals.dataUserReq = await DataModel.findOne({_id: res.locals.dataUserReq});

                const id = req.params.id;
                var message = "message";
                
                //Counter reset
                const newMessage = 0;
                await DataModel.findByIdAndUpdate(id, {"newMessage": newMessage,"newMessageP": newMessage });

                const datausers = await DataModel.findById(id).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
                const client = await UserModel.findOne({_id: datausers.idOfUser});
                req.session._dataUser = datausers;

                    res.render('manager.ejs', {to: "MessageToOneUser", datas: datausers, users: client, message: message});
                });


                
                //to send mail:
        const sendMail= (userMail, text, subject) =>{
            //details of the send mail:
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                user: process.env.EMAILUSER,
                pass: process.env.EMAILPASS
                }
            });
            //details of the send mail:
            const mailOptions = {
                from: process.env.EMAILUSER,
                to: userMail,
                subject: subject,
                text: text
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                console.log('erorr in send email:', error);
                } else {
                console.log('Email sent: ' + info.response);
                }
            });  
            } // close func of send mail.


    module.exports = router;
