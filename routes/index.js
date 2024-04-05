var express = require('express');
var router = express.Router();
const session = require('express-session');
var authHelper = require('../helpers/authHelper')
// Add express-session middleware
router.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});






// routes/users.js
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});

router.post('/signup', function(req, res) {
  console.log(req.body);

  // Determine the role
  const role = req.body.role || 'user'; // Default to 'user' if role is not provided

  // Determine the status based on the role
  const status = role === 'user' ? 'approved' : 'not approved';

  // Include role and status in the user object sent to the signup function
  const userData = {
    fullname: req.body.fullname,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    role: role, // Set the role here
    status: status // Set the status here
  };

  if (role !== 'user') {
    // Include additional fields for non-user roles
    userData.designation = req.body.designation;
    userData.company = req.body.company;
    userData.jobproof = req.body.jobproof;
  }

  authHelper.signup(userData, (id) => {
      if (role === 'user') {
          res.render("login");
      } else {
          let file = req.files.jobproof; // Assuming the file field name is 'jobproof'
          console.log(id);
          file.mv('./public/pdf/' + id + '.pdf', (err, done) => {
              if (!err) {
                  res.render("login");
              } else {
                  console.log(err);
              }
          });
      }
  });
});



router.get('/login', function(req, res, next) {
  res.render('login',{ title: 'Express' });
});


router.post('/login', function(req, res) {
  const { email, password } = req.body;
  
  authHelper.login(email, password, (user) => {
    if (user) {
      req.session.user = user;
      // Check the role of the user and redirect accordingly
      switch (user.role) {
        case 'creator':
          res.redirect('/creatorHomePage');
          break;
        case 'user':
          res.redirect('/userHomePage');
          break;
        case 'admin':
          res.redirect('/adminHomePage');
          break;
        default:
          res.redirect('/login'); // Redirect to login page if the role is not recognized
      }
    } else {
      // Handle unsuccessful login
      res.render('login', { error: 'Invalid email or password' });
    }
  });
});



router.get('/adminHome', function(req, res, next) {
  res.render('admin/home',{ title: 'Express' });
});

router.get('/userHome', function(req, res, next) {
  res.render('user/home',{ title: 'Express' });
});
router.get('/creatorHomePage', function(req, res, next) {
  res.render('creator/home',{ title: 'Express' });
});


module.exports = router;
