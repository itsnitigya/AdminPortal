const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const User = require('./models/user');

const app = express();

app.set('port', 4444);
app.set('view engine', 'ejs')

app.use(morgan('dev'));
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  key: 'user_sid',
  secret: 'somerandonstuffs',
  resave: false,
  saveUninitialized: false,
  cookie: {
      expires: 600000
  }
}));

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');        
  }
  next();
});


// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
      res.redirect('/dashboard');
  } else {
      next();
  }    
};


// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
  res.redirect('/login');
});


// route for user signup
app.route('/signup')
  .get(sessionChecker, (req, res) => {
      res.render('signup');
  })
  .post((req, res) => {
      User.create({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password
      })
      .then(user => {
          req.session.user = user.dataValues;
          res.redirect('/dashboard');
      })
      .catch(error => {
          res.redirect('/signup');
      });
  });


// route for user Login
app.route('/login')
  .get(sessionChecker, (req, res) => {
      res.render('login');
  })
  .post((req, res) => {
      var username = req.body.username,
          password = req.body.password;

      User.findOne({ where: { username: username } }).then(function (user) {
          if (!user) {
              res.redirect('/login');
          } else if (!user.validPassword(password)) {
              res.redirect('/login');
          } else {
              req.session.user = user.dataValues;
              res.redirect('/dashboard');
          }
      });
  });


// route for user's dashboard
app.get('/dashboard', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
     res.render('dashboard');
  } else {
      res.redirect('/login');
  }
});


// route for user logout
app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      res.redirect('/');
  } else {
      res.redirect('/login');
  }
});

app.get('/pythonanywhere', function (req, res) {
  res.render('pythonanywhere',{weather: null, error: null});
})

app.post('/pythonanywhere', function (req, res) {
    let city = req.body.city;
    let apkey ='f0ef50b71dbbe9caef0d7a13eddbbef8';
    let token = '';
    var clientServerOptions = {
        uri: 'https://www.pythonanywhere.com/api/v0/user/itsnitigya/cpu/',
        method: 'GET',
        headers: {
            'Authorization' : 'Token a848520114dcfe502198306cf816590b4e99f585',
        }
    }
    request(clientServerOptions, function (err, response, body) {
      if(err){
        res.render('index', {weather: null, error: 'Error, please try again'});
      } else {
        let weather = JSON.parse(body);
        console.log(weather.daily_cpu_limit_seconds);
        let ans = weather.daily_cpu_limit_seconds;
          let weatherText = `Its ${ans}`;
          res.render('pythonanywhere', {weather: weatherText, error: null});
        
      }
    });
  })

  app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));