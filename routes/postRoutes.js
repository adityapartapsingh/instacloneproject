const express = require('express');
const router = express.Router(); 
const Post = require('../models/post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;
        const sortParam = req.query.sort || 'newest';
        const sortOrder = sortParam === 'oldest' ? 1 : -1;

        const posts = await Post.find({ user: req.user.id })
            .sort({ createdAt: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPosts = await Post.countDocuments({ user: req.user.id });
        const totalPages = Math.ceil(totalPosts / limit);

        res.render('index', { posts, user: req.user, currentPage: page, totalPages });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching posts');
    }
});


router.post('/create', auth, upload.single('postImage'), async (req, res) => {
    try {
        const { caption } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        
        const newPost = new Post({
            caption,
            imagePath,
            user: req.user.id  
        });
        
        await newPost.save();
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating post');
    }
});

router.post('/delete/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');

        if (post.user.toString() !== req.user.id) {
            return res.status(403).send('Unauthorized: You can only delete your own posts');
        }

        await Post.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting post');
    }
});

router.get('/feed', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;
        
        const posts = await Post.find()
            .populate('user', 'username') 
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);
        
        res.render('feed', { posts, user: req.user, currentPage: page, totalPages });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching feed');
    }   
});

module.exports = router;