const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.get('/login', (req, res) => {
  res.render('login', { errors: [], success: [] });
});

router.get('/register', (req, res) => {
  res.render('register', { errors: [], success: [] });
});

router.post('/register', async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password || !name) {
    return res.render('register', { errors: ['Missing username, password, or name'], success: [] });
  }
  try{
    const exists = await User.findOne({username});
    if(exists){
      return res.render('register', { errors: ['Username already exists'], success: [] });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({username, name, password: hash});
    await user.save();
    res.render('login', { errors: [], success: ['Account created successfully. Please log in.'] });
  } catch (err) {
    console.error('Registration error', err);
    res.render('register', { errors: ['An error occurred during registration'], success: [] });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;  
  if (!username || !password) {
    return res.render('login', { errors: ['Missing username or password'], success: [] });
  }
  try {
    const user = await User.findOne({username});
    if(!user){
      return res.render('login', { errors: ['Invalid username or password'], success: [] });
    }
    const ok = await bcrypt.compare(password, user.password);
    if(!ok){
      return res.render('login', { errors: ['Invalid username or password'], success: [] });
    }
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    res.render('login', { errors: ['An error occurred during login'], success: [] });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

// Profile route - shows user's own posts
router.get('/profile', async (req, res) => {
  const auth = require('../middleware/auth');
  // This will be called with auth, so we need to wrap it
  auth(req, res, async () => {
    try {
      const Post = require('../models/post');
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;
      
      const posts = await Post.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPosts = await Post.countDocuments({ user: req.user.id });
      const totalPages = Math.ceil(totalPosts / limit);
      
      res.render('profile', { user: req.user, posts, currentPage: page, totalPages });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching profile');
    }
  });
});

module.exports = router;