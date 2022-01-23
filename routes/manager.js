const express = require("express");
const router = express.Router();
const app = express();
const multer = require('multer');
const {storage} = require('../models/cloudinary/index')
const upload = multer({storage});
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const UserModel = require('../models/userModel');
const DataModel = require('../models/dataModel');
const {isLoginIn} = require('../public/js/middleware');

router.get("/",isLoginIn, async (req,res)=>{
    if(req.session._role!='מנהל'&&req.session._role!='עובד'){ 
        req.flash('erorr', "אתה לא מנהל!");
        res.redirect('/users/login');
        }else{
            if(req.session._role=='מנהל'){
            const users = await UserModel.find({});
            const datas = await DataModel.find({}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
            res.render('managerUser.ejs', {datas: datas, user: users});
        }else if(req.session._role=='עובד'){
            const users = await UserModel.find({work: req.session._idUser});
            const datas = await DataModel.find({idOfUser: users}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
            res.render('managerUser.ejs', {datas: datas, users: users});
            }
        }
  });
  router.get("/manager/:id",isLoginIn, async (req,res)=>{
    const id = req.params.id;
    // data of user:
    const datausers = await DataModel.findById(id).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
    // contact userClient of this worker:
    const allClient = await UserModel.find({work: req.session._idUser});
    console.log("in if datausers.idOfUser.role", (datausers.idOfUser.role));

    if(datausers.idOfUser.role==='לקוח'){
    //user contact:
    const userContact = await UserModel.findOne({_id: datausers.idOfUser}).populate('work');
    //worker contact:
    const workContact = await UserModel.findOne({_id: userContact.work});
    //admin contact:
    const adminContact = await UserModel.findOne({role: "מנהל"});
    
    //worker data:
    const workData = await DataModel.findOne({idOfUser: datausers.idOfUser.work}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');

    //admin data:
    const adminData = await DataModel.findOne({idOfUser: adminContact._id}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
    expiryDate(datausers, workData, adminData);  


}else{
        const workData = "";
        const adminData = "";
        expiryDate(datausers, workData, adminData);  

    }

    const today = todayDate();
    const vprogressbar = ((datausers.numOfDocument/datausers.numOfDocumentRequired)*100);
        
    if(req.session._role!='מנהל'){
        const client = await UserModel.findOne({_id: datausers.idOfUser});
        res.render('manager.ejs', {vpro: vprogressbar, allClient:allClient, min: today,  datas: datausers, users: client, message:""});
    }else{
            const client = await UserModel.find({});
        res.render('manager.ejs', {vpro: vprogressbar, min: today, allClient: client, datas: datausers, users: client, message:""});
    }
    });

router.put("/manager/:id", async (req,res)=>{
    const datas = await DataModel.findByIdAndUpdate(req.params.id,{$addToSet:{...req.body}});
    req.flash('success', "the user updated in success!");
    res.redirect(`/manager/${datas._id}`); //redirect to show details of this data user.
});
       
router.post("/manager/doc", async (req,res)=>{
    const doc = req.body;
    console.log("doc:", req.body);

    const dataUser = await DataModel.findOne({idOfUser: doc.clientid});
    await DataModel.findByIdAndUpdate(dataUser._id, {$addToSet: {"documents": {documentRequired: doc.docRec, expiryDate:doc.dateExp}}, req: 0, numOfDocumentRequired: dataUser.numOfDocumentRequired+1} ,{safe: true, upsert: true});
    
    req.flash('success', "המשימה נוספה בהצלחה!");
    res.redirect(`/manager/${req.session._dataUser._id}`);
    });
                
    router.post("/manager/docUp",(upload.array('docUp')), async (req,res)=>{
        const docUp = req.body;
        const fileUp = req.files.map(f=>({documentFileName:f.filename ,documentPath:f.path ,documentOriginalName:f.originalname}));
        const status = req.body.statusD;

    const dataUser = await DataModel.findOne({_id: docUp.idOfData});
   
    if(fileUp.length!=0){
    await DataModel.updateOne({_id:dataUser._id, "documents._id": docUp.idOfDoc}, {$set: {"documents.$.done":"1", "documents.$.document": fileUp}, numOfDocument: dataUser.numOfDocument+1});
    }else{
        //this if for the employee if he check the doc:
        if(status==1){
            await DataModel.updateOne({_id:dataUser._id, "documents._id": docUp.idOfDoc}, {$set: {"documents.$.statusD":"1"}});
        // if the user do the mission without file:
        }else{
    await DataModel.updateOne({_id:dataUser._id, "documents._id": docUp.idOfDoc}, {$set: {"documents.$.done":"1"}, numOfDocument: dataUser.numOfDocument+1});
        }    
}
        res.redirect(`/manager/${res.locals.dataUser._id}`);
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

    const todayDate = ()=>{ 
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
       dd = '0' + dd;
    }
    if (mm < 10) {
       mm = '0' + mm;
    }  
    today = yyyy+'-'+mm+'-'+dd;    
return today;
    }

const expiryDate = async(datausers, work, admin)=>{
// Set the date we're counting down to
    if(datausers.documents.length){
        console.log("in expiry:");
        //console.log("work data:", work);
        const dataUser = await DataModel.updateOne({_id:datausers._id}, {$set: {"req": 1}});
        for(let doc of datausers.documents){
            if(doc.done==="0"){
                console.log("if done = 0:");
                const dateExp = doc.expiryDate;  

let expiryDate = new Date(dateExp).getTime();
// Get todays date and time
  let now = new Date().getTime();
  // Find the distance between now an the count down date
  let distance = expiryDate - now;
  // Time calculations for days.
  let days = Math.floor(distance / (1000 * 60 * 60 * 24));
  // this time for message:
  var d = new Date();
  var date= d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear();

if(datausers.idOfUser.role==="לקוח"){ 
  if(days<7){
    //console.log("in 7 day:");
        if(doc.sendM<1){
        sendMail(datausers.idOfUser.email,
             "זוהי הודעה מהעובד המטפל בתיק שלך, יש לך מספר קבצים שדורשים את ההתיחסותך, אשמח שתטפל בזה לפני שיהיה מאוחר. יום טוב",
              "הודעה מהעובד שלך");
        
              sendMessase(
            doc,
            datausers, //datausers
            "יש לך משימה" ,  //sub
            "יש לך משימה שעדיין לא בוצעה אנא טפל בזה בהקדם. אם יש בעיה אתה מוזמן לפנות אליי בשמחה. בברכה "
            +work.idOfUser.firstName+" "+ work.idOfUser.lastName+"", //message
            work.idOfUser._id, //from
            datausers._id, //to
            date
        );
        await DataModel.updateOne({_id:datausers._id, "documents._id": doc._id}, {$set: {"documents.$.sendM":doc.sendM+1}});
        const dataUser =  await DataModel.updateOne({_id:datausers._id}, {$set: {"req": 0}});
        }
    }
if(days<5){

    if(doc.sendWork<1){
        sendMail(work.idOfUser.email,
            "יש לך לקוח("
            +datausers.idOfUser.firstName+" "+ datausers.idOfUser.lastName+
            ")שעדיין לא ביצע את המשימה שלו, נשארו לו פחות מחמישה ימים, אנא טפל בזה בהקדם.", "הודעה ממערכת הניהול על לקוח שלא ביצע משימה");
        //console.log("in 5 day:");
        sendMessase(
            doc,
            datausers, //datausers
            "יש לך לקוח שלא ביצע משימה", //sub
            "יש לך לקוח("   //message
            +datausers.idOfUser.firstName+" "+ datausers.idOfUser.lastName+
            ")שעדיין לא ביצע את המשימה שלו, נשארו לו פחות מחמישה ימים, אנא טפל בזה בהקדם.",
            admin.idOfUser._id, //from
            work._id, //to
            date
        );
await DataModel.updateOne({_id:datausers._id, "documents._id": doc._id}, {$set: {"documents.$.sendWork":doc.sendWork+1}});
    }
}
if(days<3){

    if(doc.sendAdmin<1){
        sendMail(admin.idOfUser.email,
            "יש לך לקוח("
            +datausers.idOfUser.firstName+" "+ datausers.idOfUser.lastName+
            ")שעדיין לא ביצע את המשימה שלו, נשארו לו פחות מחמישה ימים, אנא טפל בזה בהקדם.", "הודעה ממערכת הניהול על לקוח שלא ביצע משימה");
        //console.log("in 3 day:");
        
        sendMessase(
            doc,
            datausers, //datausers
            "יש לך לקוח שלא ביצע משימה", //sub
            "יש לך לקוח("   //message
            +datausers.idOfUser.firstName+" "+ datausers.idOfUser.lastName+
            ")שעדיין לא ביצע את המשימה שלו, נשארו לו פחות משלושה ימים, אנא טפל בזה בהקדם.",
            work.idOfUser._id, //from
            admin._id, //to
            date
        );
await DataModel.updateOne({_id:datausers._id, "documents._id": doc._id}, {$set: {"documents.$.sendAdmin":doc.sendAdmin+1}});
            }
        }  
}
        const dataUser = await DataModel.updateOne({_id:datausers._id}, {$set: {"req": 0}});

    } //close if done===0

        }

    }
  
}


const sendMessase = async(doc, datausers, sub, message, send, id, date)=>{
   console.log("send message function");
   console.log("send:", send);
   
   

    const update = await DataModel.findByIdAndUpdate(id ,{$addToSet: {"personalMessages": {date: date, message: message, send: send, sub: sub}}}).populate('idOfUser').populate('messages.send').populate('personalMessages.send');
    const newMessage = (update.newMessageP)+1;
    await DataModel.findByIdAndUpdate(id, {"newMessageP": newMessage});
}

    module.exports = router;
