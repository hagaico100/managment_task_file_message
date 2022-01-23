const DataModel = require('../../models/dataModel');
 
 
 module.exports.isLoginIn = async(req,res,next)=>{ 
    if(!req.session._idUser){
      req.flash('erorr', "אתה לא מחובר!");
      return res.redirect('/users/login');
    }
    //to update session of datauser:
    const dataReq = await DataModel.findOne({_id: res.locals.dataUserReq._id});
    res.locals.dataUserReq = dataReq;
    next(); 
  }
