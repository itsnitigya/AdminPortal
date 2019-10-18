const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index');
})

app.post('/', function (req, res) {
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
          res.render('index', {weather: weatherText, error: null});
        
      }
    });
  })

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});