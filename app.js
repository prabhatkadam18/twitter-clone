require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const crypto = require('crypto');
const passport = require('passport');
const findOrCreate = require('mongoose-find-or-create');
const { nextTick } = require('process');
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
  type: {type: String, default: "User"},
  followers : [{type: mongoose.Types.ObjectId, ref: 'users'}],
  tweets: [{type: mongoose.Types.ObjectId, ref: 'tweets'}],
  completed: {type: Boolean, default: false},
  resetPasswordToken: String,
  resetPasswordExpires: Number

});
userSchema.plugin(findOrCreate);
const User = mongoose.model("users", userSchema);

const tweetSchema = new mongoose.Schema({
  from: {type: mongoose.Types.ObjectId, ref: 'users'},
  post: String,
  dateCreated: Date,
  tags: [String]
})


const Tweet = mongoose.model('tweets', tweetSchema);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/return"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id, email: profile._json.email }, function (err, user) {
      return cb(err, user);
    });
  }
));

const isCompletedMiddleware = (req, res, next)=>{
  if(req.user) {
    if(req.user.name){
      next();
    } else {
      res.render('getname');
    }
  } else {
    next();
  }
}

/////////
app.get('/getname', (req, res)=>{
  res.render('getname');
})
////////

app.get('/', (req, res)=>{
  res.render('landing');
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/return', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/home');
  });

// app.get('/user', (req, res)=>{
//   res.send(req.user)
// });

var genRandomString = function(length){
  return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
};
var sha512 = function(password, salt){
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var value = hash.digest('hex');
  return {
    salt:salt,
    passwordHash:value
  };
}
function saltHashPassword(userpassword) {
  var salt = genRandomString(16); /** Gives us salt of length 16 */
  var passwordData = sha512(userpassword, salt);
  return passwordData;
}

app.get('/home', isCompletedMiddleware, (req, res)=>{

/*
  var followers = ;

  followers.map()

*/
  Tweet.find()
  .populate('from')
  .catch( (err)=>{
    console.log(err);
    throw err;
  })
  .then((data)=> {
    console.log(data);
    res.render('home', {user: req.user, tweets: data})
  })
});

app.post('/posttweet', (req, res)=>{
  var tweet = {
    from: "Admin",
    post: `You are the first one here.\nThis is a tweet. Here you would see tweets of other users.`
  }
});

app.post('/setname', (req, res)=>{
  User.findOneAndUpdate({email: req.user.email}, {name: req.body.name, completed: true}, (err, done)=>{
    if(err){
      console.log(err);
    } else {
      req.user.name = req.body.name;
      res.redirect('home');
    }
  })
});

app.get('/logout', (req, res)=>{
  req.logOut();
  res.redirect('/home');
})


app.listen(process.env.port || PORT, ()=>{
    console.log("Server started on Port "+ PORT);
});
