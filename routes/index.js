var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/signupuser', function(req, res, next) {
  res.render('user/signupuser', { title: 'Express' });
});


router.get('/signupcreator', function(req, res, next) {
  res.render('user/signupcreator', { title: 'Express' });
});


router.get('/login', function(req, res, next) {
  res.render('user/login',{ title: 'Express' });
});


 



module.exports = router;
