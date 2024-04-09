var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/authHelper')
var courceHelper = require('../helpers/courceHelper')
const mongoose = require('mongoose');
const db = require('../db.js'); // Importing db connection
const { ObjectId } = require('mongodb');

const verifylogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}




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

router.get('/login',function (req,res) {
  if(req.session.loggedIn){
    res.redirect('/')

  }else{

    res.render('login',{"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }
});


router.post('/login', function(req, res) {
  const { email, password } = req.body;
  
  authHelper.login(email, password, (user) => {
    if (user) {
      req.session.loggedIn=true
      req.session.user=user
      // Check the role of the user and redirect accordingly
      switch (user.role) {
        case 'creator':
          res.redirect('/creatorHome');
          break;
        case 'user':
          res.redirect('/userHome');
          break;
        case 'admin':
          res.redirect('/adminHome');
          break;
        default:
          res.redirect('/login'); // Redirect to login page if the role is not recognized
      }
    } else {
      // Handle unsuccessful login
      req.session.loginErr="invalid credentials"
      res.render('login', { error: 'Invalid email or password' });
    }
  });
});

router.get('/logout', function(req, res) {
  // Clear the session variables related to authentication
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Error logging out');
    } else {
      // Redirect the user to the login page after logging out
      res.redirect('/login');
    }
  });
});












router.get('/creatorHome', function(req, res, next) {
  res.render('creator/home',{ title: 'Express' });
});

router.post('/create-course', (req, res) => {
  // Handle form submission to create a course
  const { coursename } = req.body;
  const {pricing} = req.body;
  const {duration} = req.body;
  const userId = req.session.user._id; // Assuming you've stored userId in the session after login

  db.get().collection('courses').insertOne({ name: coursename, creatorId: userId, pricing:pricing,duration:duration }, (err, result) => {
      if (err) {
          console.error('Error creating course:', err);
          res.send('Error creating course');
      } else {
          res.redirect('/creatorHome');
      }
  });
});

router.get('/created-courses', async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    const courses = await db.get().collection('courses').find({ creatorId: userId }).toArray();

    // Fetch contents for each course
    for (const course of courses) {
      console.log("Processing course:", course);
      const contents = await db.get().collection('contents').find({ courseId: course._id }).toArray();
      console.log("Contents for course:", contents);
      course.contents = contents;
    }

    res.render('creator/my-courses', { courses });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).send('Error fetching courses');
  }
});

// Route to delete a course
router.post('/delete-course/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    await db.get().collection('courses').deleteOne({ _id: new ObjectId(courseId) });
    res.redirect('/created-courses');
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).send('Error deleting course');
  }
});

router.post('/edit-price/:courseId', async (req, res, next) => {
  try {
      const courseId = req.params.courseId;
      const { pricing } = req.body;

      // Update the price in the database
      await db.get().collection('courses').updateOne(
          { _id: new ObjectId(courseId) },
          { $set: { pricing: pricing } }
      );

      res.redirect('/created-courses');
  } catch (err) {
      console.error('Error updating price:', err);
      res.status(500).send('Error updating price');
  }
});

router.post('/add-contents/:courseId', (req, res) => {
  const { title } = req.body;
  const courseId = req.params.courseId;

  // First, add the title to the database using the helper
  courceHelper.addContentTitle(courseId, { title }, (err, contentId) => {
    if (err) {
      console.error('Error adding content title:', err);
      res.send('Error adding content title');
      return;
    }

    // Once the title is added, use the returned contentId to store the video and image
    const videoFile = req.files.video; // Assuming the field name for video file is 'video'


    // Move video file
    const videoFileName = `${contentId}.mp4`;
    videoFile.mv(`./public/videos/${videoFileName}`, (err) => {
      if (err) {
        console.error('Error moving video file:', err);
        res.send('Error moving video file');
        return;
      }
        res.redirect(`/created-courses`);
      });
    });
  });

// Route to delete a content
router.post('/delete-content/:courseId/:contentId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const contentId = req.params.contentId;
    await db.get().collection('contents').deleteOne({ _id: new ObjectId(contentId) });
    res.redirect(`/created-courses#${courseId}`);
  } catch (err) {
    console.error('Error deleting content:', err);
    res.status(500).send('Error deleting content');
  }
});

router.get('/creator-profile', function(req, res) {
  if (req.session.loggedIn) {
    const user=req.session.user
    res.render('creator/profile',{user});
  } else {
    // Redirect to login if user is not logged in
    res.redirect('/login');
  }
});













// USER ROUTES

router.get('/userHome', function(req, res, next) {
  res.render('user/home',{ title: 'Express' });
});

router.get('/user-profile', function(req, res) {
  if (req.session.loggedIn) {
    const user=req.session.user
    res.render('user/profile',{user});
  } else {
    // Redirect to login if user is not logged in
    res.redirect('/login');
  }
});

router.get('/view-courses', async (req, res, next) => {
  try {
    const courses = await db.get().collection('courses').find().toArray();

    res.render('user/view-courses', { courses });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).send('Error fetching courses');
  }
});


router.post('/purchase', verifylogin, function(req, res) {
  // Extract data from the request body
  const { amount, courseId } = req.body;
  const userId = req.session.user._id; // Assuming userId is stored in session

  // Validate courseId format
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid courseId' });
  }

  console.log('Course ID:', courseId);
  console.log('Amount paid:', amount);
  console.log('User ID:', userId);

  // Now, you can save this purchase data into the database

  db.get().collection('purchases').insertOne({
      courseId: new ObjectId(courseId), // Convert courseId to ObjectId
      amount: parseFloat(amount),
      userId: new ObjectId(userId),
      timestamp: new Date()
  }, (err, result) => {
      if (err) {
          console.error('Error saving purchase:', err);
          return res.status(500).json({ error: 'Error saving purchase' });
      } else {
          console.log('Purchase saved successfully');
          return res.status(200).json({ message: 'Purchase successful' });
      }
  });
});




// Route to view purchased courses for the current logged-in user
router.get('/purchased-courses', verifylogin, async (req, res) => {
  try {
    const userId = req.session.user._id;
    console.log('sessionid',userId);
    const userIdObject = new ObjectId(userId);
    // Fetch the purchases made by the user
    const purchases = await db.get().collection('purchases').find({ userId: userIdObject }).toArray();
  
    console.log('Purchases:', purchases);// Debug statement

    // Initialize an empty array to store purchased courses
    const purchasedCourses = [];

    // Iterate through the purchases and fetch course details for each purchase
    for (const purchase of purchases) {
      const courseId = purchase.courseId;

      // Fetch the course details using courseId
      const courseDetails = await db.get().collection('courses').findOne({ _id: new ObjectId(courseId) });

      console.log('Course details fetched successfully:', courseDetails); // Debug statement

      if (courseDetails) {
        // Push the course details along with purchase details into purchasedCourses array
        purchasedCourses.push({
          course: courseDetails,
          purchase: purchase // Fixed typo here, change 'purchases' to 'purchase'
        });
      }
    }

    console.log('Purchased courses:', purchasedCourses); // Debug statement

    // Render the view with purchased courses
    res.render('user/purchased-courses', { purchasedCourses });
  } catch (err) {
    console.error('Error fetching purchased courses:', err);
    res.status(500).send('Error fetching purchased courses');
  }
});













router.get('/adminHome', function(req, res, next) {
  res.render('admin/home',{ title: 'Express' });
});


module.exports = router;
