const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const User = require('./models/user');
const Token = require('./models/token');

const app = express();

app.set('port', 4444);
app.set('view engine', 'ejs')

app.use(morgan('dev'));
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  key: 'user_sid',
  secret: 'adminportal',
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
          console.log(error);
          res.redirect('/signup');
      });
  });

  app.route('/tokens')
  .get((req, res) => {
      res.render('tokens');
  })
  .post((req, res) => {
     let username = req.body.username;
     let name = req.body.name;
     let token = req.body.token;
     Token.findOne({ where: { name : name } }).then(function (user) {
        if (user) {
              Token.destroy({
                where: { name: name }
              })
              .then(()=> {
                Token.create({
                    name: name,
                    username: username,
                    token: token
                })
                .then(() => {
                    res.redirect('/tokens');
                })
                .catch(error => {
                    console.log(error);
                    res.redirect('/tokens');
                });
              });
        } else {
            Token.create({
                name: name,
                username: username,
                token: token
            })
            .then(() => {
                res.redirect('/tokens');
            })
            .catch(error => {
                console.log(error);
                res.redirect('/tokens');
            });
        }
    });
  });


// route for user Login
app.route('/login')
  .get(sessionChecker, (req, res) => {
      res.render('login');
  })
  .post((req, res) => {
      let username = req.body.username,
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
  res.render('pythonanywhere',{data: null, error: null});
})

app.post('/pythonanywhere', function (req, res) {
    let name = 'python';
    let username = '';
    let token = '';
    Token.findOne({ where: { name: 'python'  } }).then(function (user) {
        if (user) {
            console.log('Success');
            console.log(user.dataValues.username);
            console.log(user.dataValues.token);
            username = user.dataValues.username;
            token = user.dataValues.token;
        } else { 
            res.render('pythonanywhere',{data:null,error:"Error in DB"});
        }
    }).then(()=> {
        var clientServerOptions = {
            uri: `https://www.pythonanywhere.com/api/v0/user/${username}/cpu/`,
            method: 'GET',
            headers: {
                'Authorization' : `Token ${token}`,
            }
        }
        request(clientServerOptions, function (err, response, body) {
          if(err){
            res.render('pythonanywhere',  {data: null, error: 'Error, please try again'});
          } else {
            let data = JSON.parse(body);
            console.log(data.daily_cpu_limit_seconds);
            let ans = data.daily_cpu_limit_seconds;
            ans = `Daily Cpu Limit is ${ans}`;
            res.render('pythonanywhere', {data:ans, error: null});
          }
        });
    })
  })

  app.get('/heroku', function (req, res) {
    res.render('heroku',{count:null,error:null});
  })

  app.post('/heroku', function (req, res) {
    let token = '';
    Token.findOne({ where: { name: 'heroku'  } }).then(function (user) {
        if (user){
            token = user.dataValues.token;
        } else { 
            res.render('pythonanywhere',{data:null,error:"Error in DB"});
        }
    }).then(()=> {
        var clientServerOptions = {
            uri: `https://api.heroku.com/apps`,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.heroku+json; version=3',
                'Authorization' : `Bearer ${token}`,
            }
        }
        request(clientServerOptions, function (err, response, body) {
          if(err){
            res.render('heroku',{count:null,error:err});
          } else {
            let weather = JSON.parse(body);
            let count  = Object.keys(weather).length;
            console.log(weather);
            console.log(count);
            count = `Total Apps Running : ${count}`;
            res.render('heroku',{count:count,error:null});
          }
        });
     });
  })

  app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));