var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/userhome', function(req, res, next) {
  res.render('user/userhome', { title: 'Express' });
});
router.get('/creatorhome', function(req, res, next) {
  res.render('creator/creatorhome', { title: 'Express' });
});
router.get('/adminhome', function(req, res, next) {
  res.render('admin/adminhome', { title: 'Express' });
});
;

module.exports = router;
