require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const crypto = require('crypto');
const passport = require('passport');
const findOrCreate = require('mongoose-find-or-create');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const PORT = 3001;

app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: true}));
app.set('view engine', 'ejs');
app.set("views", __dirname + '/views');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

mongoose.connect("mongodb://localhost/twitter", {useNewUrlParser: true, useCreateIndex: true , useUnifiedTopology: true, useFindAndModify: false}, (err)=>{
  if(err){
    console.log("DB Connection Error");
  } else {
    console.log("DB Connected");
  }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  googleId: String,
  password: String,
  verified: Boolean,
  dateCreated: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Number

});
userSchema.plugin(findOrCreate);

const User = mongoose.model("users", userSchema);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/return"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, email: profile._json.email }, function (err, user) {
      return cb(err, user);
    });
  }
));




app.get('/', (req, res)=>{
    res.render('home');
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/return', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/user');
  });

app.get('/user', (req, res)=>{
  res.send(req.user)
})


app.listen(PORT, ()=>{
    console.log("Server started on Port "+ PORT);
});
