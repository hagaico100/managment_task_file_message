const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Joi = require('joi');
const UserModel = require('../models/userModel');
const DataModel = require('../models/dataModel');
const bcrypt = require("bcrypt");
const app = express();
const {isLoginIn} = require('../public/js/middleware');


//to show details of all user: /users
router.get("/",isLoginIn, async (req,res)=>{
//to update session of datauser:
res.locals.dataUserReq = await DataModel.findOne({_id: res.locals.dataUserReq});

    if(req.session._role=="מנהל"){
    const datas = await UserModel.find({});
        if(datas.work != ""){
        const work = await UserModel.findById(datas.work);
        res.render('users.ejs', {datas: datas, work: work} );
        }else{
            const work = "";
        res.render('users.ejs', {datas: datas, work: work} );    
        }

   }else{
        const datas = await UserModel.find({work: req.session._idUser});
        if(datas.work != ""){
            const work = await UserModel.findById(datas.work);
            res.render('users.ejs', {datas: datas, work: work} );
            }else{
                const work = "";
            res.render('users.ejs', {datas: datas, work: work} );    
            }
    }//end if of role=admin
});

router.get("/login", async (req,res)=>{
    if((req.session._email=='guest')||req.session._email==undefined){
        req.session._email = 'guest';   
        res.render('login.ejs');
    }
    req.flash('erorr', "אתה כבר מחובר!");
});

router.post("/newPassword", async (req,res)=>{
    const newPass = req.body.newPass;
    const idUser = res.locals.isLogin
    const subject = "סיסמתך שונתה בהצלחה"
const hashpasswordNew = await bcrypt.hash(newPass,10); //10 is a salt.
const datas = await UserModel.findByIdAndUpdate(idUser,{password:hashpasswordNew});
sendMail(datas.email, newPass, subject);
req.flash('success', "הסיסמא שונתה בהצלחה! סיסמתך החדשה נשלחה למייל.");
res.redirect(`/manager/${req.session._dataUser._id}`);
});

router.get("/forgetPassword", async (req,res)=>{
    res.render('forgetPassword.ejs');
    });

//to restart password and send new password to the user mail:
router.put("/forgetPassword", async(req,res)=>{
    const email = req.body.email;
try{
const forgetUser= await UserModel.findOne({email:email});
if(forgetUser!=null){
    const {firstName,lastName,email,password,phone,nameOfComp,numOfComp,role,work} = forgetUser;
    const passwordNew = (Math.floor(1000 + Math.random() * 90000000)).toString();
    const subject ="סיסמתך אופסה בהצלחה";
    const hashpasswordNew = await bcrypt.hash(passwordNew,10); //10 is a salt.
    await UserModel.findByIdAndUpdate(forgetUser._id,{firstName,lastName,email,password:hashpasswordNew,phone,nameOfComp,numOfComp,role,work});
    console.log("passworNew:", passwordNew);
    sendMail(email, passwordNew, subject);
    req.flash('success', "הסיסמא שוחזרה בהצלחה, סיסמא חדשה נשלחה למייל האישי שלך");
    res.redirect('/users/login');
}else{
    req.flash('erorr', "לא הוזן מייל!");
    res.redirect('/users/forgetPassword');
}
}catch(err){
    req.flash('erorr', "האימייל שהוקש לא נמצא במערכת!");
    res.redirect('/users/forgetPassword');
}
    });

router.post("/login", async(req,res)=>{
const{email,password}= req.body;
try{
const loginUser = await UserModel.findOne({email:email});
const dataUser = await DataModel.findOne({idOfUser: loginUser._id});
const passwordOk = await bcrypt.compare(password, loginUser.password);
if(!passwordOk){
    req.flash('erorr', "אימייל או סיסמא שגויים, נסה שוב!");
    res.redirect('/users/login');
}else{
    req.flash('wellcome', `ברוכים השבים ${loginUser.firstName}`);
    req.session._email = loginUser.email;
    req.session._idUser = loginUser._id;
    req.session._role = loginUser.role;
    req.session._user = loginUser;
    req.session._work = loginUser.work;
    req.session._dataUser = dataUser;
    req.session._dataUserReq = dataUser;

    res.redirect(`/users/${loginUser._id}`); //redirect to show details of this user.
    }
}catch{
    req.flash('erorr', "אימייל או סיסמא שגויים, נסה שוב!");
    res.redirect('/users/login');
}
    });
  
router.get("/logout", (req,res)=>{
    req.session._idUser = null;
    req.session._role = null;
    req.session._email = 'guest';
    req.session._dataUser = null;
    req.session._dataUserReq = null;
    req.flash('success', "להתראות!");
    res.redirect('/users/login');
});

router.post("/registar",  async(req,res)=>{
    const joiSchema = Joi.object({
    firstName: Joi.string().min(2).max(20).required(),
    lastName: Joi.string().min(2).max(20).required(),
    email: Joi.string().min(2).required(),
    password: Joi.string().min(2).max(20).required(),
    phone: Joi.string().required(),
    nameOfComp: Joi.string().max(20).required(),
    numOfComp: Joi.string().max(20).required(),
    role: Joi.string().required(),
    work: Joi.string()
    })

    const validData = joiSchema.validate(req.body);
    if(validData.error){
        req.flash('erorr', "אחד או יותר מהדברים נדרש!");
        res.redirect('/users/registar');
    }
    const{firstName,lastName,email,password,phone,nameOfComp,numOfComp,role,work}= req.body;
    const hashpassword = await bcrypt.hash(password,10); //10 is a salt.
    //console.log('bcrypt hash', hashpassword);
    const newUser = new UserModel({firstName,lastName,email,password:hashpassword,phone,nameOfComp,numOfComp,role,work});
    await newUser.save();
    const newMessage = 0;
    const newData = new DataModel({idOfUser:newUser._id, newMessage: newMessage});
    await newData.save();
    req.flash('success', "המשתמש נוצר בהצלחה!");
    res.redirect(`/users/${newUser._id}`); //redirect to show details of this user.
})

router.get("/registar", isLoginIn, async (req,res)=>{
   
    if(req.session._role!='מנהל'||req.session._role==undefined){ 
        req.flash('erorr', "אתה לא מנהל, אין לך גישה לכאן!");
        res.redirect('/users/login');
        }else{
     
            res.render('registar.ejs');
        }
});

router.get("/registarClient", isLoginIn, async (req,res)=>{
      
    if(req.session._role!='מנהל'||req.session._role==undefined){ 
        req.flash('erorr', "אתה לא מנהל, אין לך גישה לכאן!");
        res.redirect('/users/login');
        }else{
    
        const allEmployee= await UserModel.find({role:'עובד'});
        res.render('registarClient.ejs', {allEmployee: allEmployee});
       }
});

router.get("/reg",isLoginIn, async (req,res)=>{
    
    if(req.session._role!='מנהל'||req.session._role==undefined){ 
        req.flash('erorr', "אתה לא מנהל, אין לך גישה לכאן!");
        res.redirect('/users/login');
        }else{
    
            res.render('reg.ejs');
        }
});

router.get("/:id/edit",isLoginIn, async(req,res)=>{
    const datas = await UserModel.findById(req.params.id);
    const allEmployee= await UserModel.find({role:'עובד'});
    res.render('edit.ejs', {datas: datas, allEmployee: allEmployee});            
});

router.put("/:id", async (req,res)=>{
    const datas = await UserModel.findByIdAndUpdate(req.params.id,{...req.body});
    req.flash('success', "פרטי המשתמש עודכנו בהצלחה!");
    res.redirect(`/users/${datas._id}`); //redirect to show details of this user.
});

router.delete("/:id", async (req,res)=>{
    const id = req.params.id;
    const idData = await DataModel.findOne({idOfUser: id});
    await DataModel.findByIdAndDelete(idData._id);
    await UserModel.findByIdAndDelete(id);
    req.flash('success', "המשתמש נמחק בהצלחה!");
    res.redirect('/users'); //redirect to all users.
});

//to show one user by id: /users/id
router.get("/:id",isLoginIn, async (req,res)=>{

    const thisUser = await UserModel.findById(req.params.id);
    if(thisUser.work != "-"){
    const work = await UserModel.findById(thisUser.work)
    res.render('users.ejs', {datas: thisUser, work: work} );
        }else{
        const work = "-";
        res.render('users.ejs', {datas: thisUser, work: work} );    
        }  
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