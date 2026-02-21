const fs = require('fs');
const path = require('path');
require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const { default: mongoose } = require('mongoose');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URL)
.then(()=>{ 
    console.log("✅ Connected to MongoDB");
}).catch((err)=>{
    console.log("Error connecting to MongoDB", err);
})
app.use(cookieParser());

// //routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
app.use('/auth', authRoutes);
app.use('/', postRoutes);




app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
