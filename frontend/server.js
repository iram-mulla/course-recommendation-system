const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const courses = [
    { id: 1, name: "Machine Learning", price: 49.99, difficulty: "Intermediate", org: "Stanford University", rating: 4.9 },
    { id: 2, name: "Deep Learning Specialization", price: 59.99, difficulty: "Advanced", org: "DeepLearning.AI", rating: 4.8 },
    { id: 3, name: "Python for Everybody", price: 39.99, difficulty: "Beginner", org: "University of Michigan", rating: 4.8 },
    { id: 4, name: "Data Science", price: 54.99, difficulty: "Intermediate", org: "IBM", rating: 4.7 },
    { id: 5, name: "Cloud Computing", price: 44.99, difficulty: "Beginner", org: "AWS", rating: 4.5 },
    { id: 6, name: "Neural Networks", price: 64.99, difficulty: "Advanced", org: "Stanford University", rating: 4.9 },
    { id: 7, name: "Natural Language Processing", price: 59.99, difficulty: "Advanced", org: "DeepLearning.AI", rating: 4.6 },
    { id: 8, name: "SQL for Data Analysis", price: 34.99, difficulty: "Beginner", org: "UC Davis", rating: 4.7 }
];

let cart = [];

app.get('/', (req, res) => {
    res.render('index', { courses, cartCount: cart.length });
});

app.get('/course/:id', async (req, res) => {
    const course = courses.find(c => c.id == req.params.id);
    if (!course) return res.status(404).send('Course not found');
    
    let recommendations = [];
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/recommend`, {
            params: { title: course.name, num: 5 },
            timeout: 5000
        });
        recommendations = response.data.recommendations || [];
    } catch (error) {
        console.error('ML Service Error:', error.message);
    }
    
    res.render('course', { course, recommendations, cartCount: cart.length });
});

app.post('/cart/add', (req, res) => {
    const course = courses.find(c => c.id == parseInt(req.body.courseId));
    if (course) {
        cart.push(course);
        return res.json({ success: true, cartCount: cart.length });
    }
    res.json({ success: false });
});

app.get('/cart', (req, res) => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    res.render('cart', { cart, total: total.toFixed(2), cartCount: cart.length });
});

app.post('/checkout', (req, res) => {
    const orderId = 'ORD-' + Date.now();
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const items = [...cart];
    cart = [];
    res.render('checkout', { orderId, items, total: total.toFixed(2), cartCount: 0 });
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🎓 Course Registration System running on http://localhost:${PORT}`);
    console.log(`🔗 Connected to ML Service at: ${ML_SERVICE_URL}`);
    console.log('='.repeat(50));
});