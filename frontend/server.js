const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
    secret: 'course-secret-key-2026',
    resave: false,
    saveUninitialized: false
}));

// User database
const users = [
    { email: 'student@college.edu', password: 'student123', name: 'Demo Student' },
    { email: 'admin@college.edu', password: 'admin123', name: 'Admin' }
];

// Course catalog with INR
const courses = [
    { id: 1, name: "Machine Learning", priceINR: 4199, difficulty: "Intermediate", org: "Stanford University", rating: 4.9 },
    { id: 2, name: "Deep Learning Specialization", priceINR: 4999, difficulty: "Advanced", org: "DeepLearning.AI", rating: 4.8 },
    { id: 3, name: "Python for Everybody", priceINR: 3399, difficulty: "Beginner", org: "University of Michigan", rating: 4.8 },
    { id: 4, name: "Data Science", priceINR: 4599, difficulty: "Intermediate", org: "IBM", rating: 4.7 },
    { id: 5, name: "Cloud Computing", priceINR: 3799, difficulty: "Beginner", org: "AWS", rating: 4.5 },
    { id: 6, name: "Neural Networks", priceINR: 5499, difficulty: "Advanced", org: "Stanford University", rating: 4.9 },
    { id: 7, name: "Natural Language Processing", priceINR: 4999, difficulty: "Advanced", org: "DeepLearning.AI", rating: 4.6 },
    { id: 8, name: "SQL for Data Analysis", priceINR: 2999, difficulty: "Beginner", org: "UC Davis", rating: 4.7 }
];

let cart = [];

// ===== MIDDLEWARE =====
function checkAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// ===== ROUTES =====

// Login page
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null, user: null });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        req.session.user = user;
        return res.redirect('/');
    }
    res.render('login', { error: 'Invalid email or password!', user: null });
});

// Register page
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { error: null, success: null, user: null });
});

app.post('/register', (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    
    if (!name || !email || !password || !confirmPassword) {
        return res.render('register', { error: 'All fields are required!', success: null, user: null });
    }
    
    if (password !== confirmPassword) {
        return res.render('register', { error: 'Passwords do not match!', success: null, user: null });
    }
    
    if (password.length < 6) {
        return res.render('register', { error: 'Password must be at least 6 characters!', success: null, user: null });
    }
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.render('register', { error: 'Email already registered!', success: null, user: null });
    }
    
    users.push({ name, email, password });
    res.render('register', { error: null, success: 'Registration successful! Please login now.', user: null });
});

// Home page (PROTECTED)
app.get('/', checkAuth, (req, res) => {
    res.render('index', { 
        courses, 
        cartCount: cart.length,
        user: req.session.user
    });
});

// Course detail (PROTECTED)
app.get('/course/:id', checkAuth, async (req, res) => {
    const course = courses.find(c => c.id == req.params.id);
    if (!course) return res.status(404).send('Course not found');
    
    let recommendations = [];
    let mlStatus = 'online';
    
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/recommend`, {
            params: { title: course.name, num: 5 },
            timeout: 5000
        });
        recommendations = response.data.recommendations || [];
    } catch (error) {
        console.error('ML Service Offline, using fallback');
        mlStatus = 'offline';
        recommendations = courses
            .filter(c => c.id !== course.id)
            .slice(0, 5)
            .map(c => ({
                title: c.name,
                similarity_score: Math.floor(Math.random() * 30 + 40),
                difficulty: c.difficulty,
                rating: c.rating
            }));
    }
    
    res.render('course', { 
        course, 
        recommendations, 
        mlStatus,
        cartCount: cart.length,
        user: req.session.user
    });
});

// Cart (PROTECTED)
app.get('/cart', checkAuth, (req, res) => {
    const total = cart.reduce((sum, item) => sum + item.priceINR, 0);
    res.render('cart', { 
        cart, 
        total: total.toLocaleString('en-IN'),
        cartCount: cart.length,
        user: req.session.user
    });
});

// Add to cart (PROTECTED)
app.post('/cart/add', checkAuth, (req, res) => {
    const course = courses.find(c => c.id == parseInt(req.body.courseId));
    if (course) {
        cart.push({...course, addedAt: new Date()});
        return res.json({ success: true, cartCount: cart.length });
    }
    res.json({ success: false });
});

// Checkout (PROTECTED)
app.post('/checkout', checkAuth, (req, res) => {
    if (cart.length === 0) {
        return res.redirect('/cart');
    }
    
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    const total = cart.reduce((sum, item) => sum + item.priceINR, 0);
    const items = [...cart];
    cart = []; // Clear cart
    
    res.render('checkout', { 
        orderId, 
        items, 
        total: total.toLocaleString('en-IN'),
        cartCount: 0,
        user: req.session.user
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        mlService: ML_SERVICE_URL,
        usersRegistered: users.length
    });
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`Server running on port ${PORT}`);
    console.log(`ML Service: ${ML_SERVICE_URL}`);
    console.log(`Demo: student@college.edu / student123`);
    console.log('='.repeat(50));
});