const db = require("../db/index");

exports.comments=(req,res)=>{
  res.render("comments")
}

exports.addComment=(req,res)=>{}