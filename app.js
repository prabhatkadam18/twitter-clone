require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const crypto = require('crypto');

const PORT = 3001;

app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: true}));
app.set('view engine', 'ejs');
app.set("views", __dirname + '/views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));



mongoose.connect("mongodb://localhost/twitter", {useNewUrlParser: true, useCreateIndex: true , useUnifiedTopology: true, useFindAndModify: false}, (err)=>{
  if(err){
    console.log("DB Connection Error");
  } else {
    console.log("DB Connected");
  }
});


app.get('/', (req, res)=>{

})


app.listen(PORT, ()=>{
    console.log("Server started on Port "+ PORT);
});
