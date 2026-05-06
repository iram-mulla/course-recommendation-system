const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'course-secret-key-2026',
    resave: false,
    saveUninitialized: false
}));

const users = [
    { email: 'student@college.edu', password: 'student123', name: 'Demo Student', isAdmin: false },
    { email: 'admin@college.edu', password: 'admin123', name: 'Admin', isAdmin: true }
];

const courses = [
    { id: 1, name: 'Machine Learning', priceINR: 4199, difficulty: 'Intermediate', org: 'Stanford University', rating: 4.9, description: 'Learn how to build predictive models, classification systems, and real-world ML applications.', videoLink: 'https://www.youtube.com/embed/aircAruvnKk' },
    { id: 2, name: 'Deep Learning', priceINR: 4999, difficulty: 'Advanced', org: 'DeepLearning.AI', rating: 4.8, description: 'Master neural networks, CNNs, RNNs and build deep learning solutions.', videoLink: 'https://www.youtube.com/embed/8rXD5-xhemo' },
    { id: 3, name: 'Python Programming', priceINR: 3399, difficulty: 'Beginner', org: 'University of Michigan', rating: 4.8, description: 'Start programming with Python, data structures and object-oriented design.', videoLink: 'https://www.youtube.com/embed/_uQrJ0TkZlc' },
    { id: 4, name: 'Data Science', priceINR: 4599, difficulty: 'Intermediate', org: 'IBM', rating: 4.7, description: 'Explore data analytics, visualization and model deployment using Python.', videoLink: 'https://www.youtube.com/embed/ua-CiDNNj30' },
    { id: 5, name: 'Cloud Computing', priceINR: 3799, difficulty: 'Beginner', org: 'AWS', rating: 4.5, description: 'Understand cloud services, architecture, and building scalable cloud apps.', videoLink: 'https://www.youtube.com/embed/eB0nUzAIe9k' },
    { id: 6, name: 'Neural Networks', priceINR: 5499, difficulty: 'Advanced', org: 'Stanford University', rating: 4.9, description: 'Deep dive into neural network architectures and optimization techniques.', videoLink: 'https://www.youtube.com/embed/GwIo3gDZCVQ' },
    { id: 7, name: 'Natural Language Processing', priceINR: 4999, difficulty: 'Advanced', org: 'DeepLearning.AI', rating: 4.6, description: 'Build NLP pipelines, sentiment analysis, and chatbots using state-of-the-art methods.', videoLink: 'https://www.youtube.com/embed/OQQ-W_63UgQ' },
    { id: 8, name: 'SQL', priceINR: 2999, difficulty: 'Beginner', org: 'UC Davis', rating: 4.7, description: 'Learn SQL queries, joins and database concepts for real-world analytics.', videoLink: 'https://www.youtube.com/embed/7S_tz1z_5bA' },
    { id: 9, name: 'Business Strategy', priceINR: 3599, difficulty: 'Intermediate', org: 'Coursera Project Network', rating: 4.8, description: 'Study competitive strategy, innovation and leadership for business success.', videoLink: 'https://www.youtube.com/embed/awn44P5uLrE' },
    { id: 10, name: 'Solar Energy', priceINR: 4299, difficulty: 'Advanced', org: 'École Polytechnique', rating: 4.1, description: 'Explore renewable energy systems, solar technology and sustainability design.', videoLink: 'https://www.youtube.com/embed/fJ3QK0hzmXI' },
    { id: 11, name: 'Finance for Managers', priceINR: 4499, difficulty: 'Intermediate', org: 'IESE Business School', rating: 4.8, description: 'Understand corporate finance, budgeting, and strategic decision-making.', videoLink: 'https://www.youtube.com/embed/ArtwQhTjTWw' },
    { id: 12, name: 'Programming Languages', priceINR: 3999, difficulty: 'Intermediate', org: 'University of Washington', rating: 4.9, description: 'Learn the foundations of programming languages and how they are designed.', videoLink: 'https://www.youtube.com/embed/hE755xvxC2E' },
    { id: 13, name: 'Business Russian Communication', priceINR: 2899, difficulty: 'Intermediate', org: 'Saint Petersburg State University', rating: 4.5, description: 'Develop Russian language skills for business and professional settings.', videoLink: 'https://www.youtube.com/embed/5v0x7S3UO1Q' },
    { id: 14, name: 'Agile Projects', priceINR: 3499, difficulty: 'Beginner', org: 'Coursera Project Network', rating: 4.0, description: 'Learn agile planning, sprint management, and project delivery best practices.', videoLink: 'https://www.youtube.com/embed/Z9QbYZh1YXY' },
    { id: 15, name: 'Cybersecurity', priceINR: 4999, difficulty: 'Beginner', org: 'IBM', rating: 4.3, description: 'Build a strong cybersecurity foundation for networks, systems, and data protection.', videoLink: 'https://www.youtube.com/embed/US8XN7FoiZ0' },
    { id: 16, name: 'Blockchain', priceINR: 5499, difficulty: 'Advanced', org: 'INSEAD', rating: 4.7, description: 'Understand distributed ledger technology, smart contracts, and blockchain use cases.', videoLink: 'https://www.youtube.com/embed/SSo_EIwHSd4' },
    { id: 17, name: 'TensorFlow', priceINR: 4799, difficulty: 'Advanced', org: 'DeepLearning.AI', rating: 4.6, description: 'Learn TensorFlow libraries for building deep learning models and pipelines.', videoLink: 'https://www.youtube.com/embed/tPYj3fFJGjk' },
    { id: 18, name: 'Data Visualization', priceINR: 3699, difficulty: 'Intermediate', org: 'University of California, Davis', rating: 4.6, description: 'Visualize data using charts, dashboards and storytelling techniques.', videoLink: 'https://www.youtube.com/embed/zN48R7z4Y_w' },
    { id: 19, name: 'Digital Marketing', priceINR: 3299, difficulty: 'Beginner', org: 'University of Illinois', rating: 4.6, description: 'Master digital marketing strategies, SEO, and social media campaigns.', videoLink: 'https://www.youtube.com/embed/YqcguI7VzJY' },
    { id: 20, name: 'Project Management', priceINR: 3999, difficulty: 'Intermediate', org: 'University of California, Irvine', rating: 4.5, description: 'Learn project planning, risk management, and stakeholder communication skills.', videoLink: 'https://www.youtube.com/embed/Ga7S8FWnY4M' },
    { id: 21, name: 'Android App Development', priceINR: 4499, difficulty: 'Advanced', org: 'Vanderbilt University', rating: 4.0, description: 'Build Android apps, UIs and backend integration using Java/Kotlin.', videoLink: 'https://www.youtube.com/embed/fis26HvvDII' },
    { id: 22, name: 'iOS Development', priceINR: 4799, difficulty: 'Advanced', org: 'University of Toronto', rating: 4.0, description: 'Create iOS apps, Swift UI layouts, and deploy to the App Store.', videoLink: 'https://www.youtube.com/embed/BUkMdkZ6hZ4' },
    { id: 23, name: 'Web Development', priceINR: 3499, difficulty: 'Beginner', org: 'University of London', rating: 4.5, description: 'Learn HTML, CSS and JavaScript to build modern responsive websites.', videoLink: 'https://www.youtube.com/embed/qz0aGYrrlhU' },
    { id: 24, name: 'JavaScript', priceINR: 2999, difficulty: 'Beginner', org: 'Coursera Project Network', rating: 4.2, description: 'Master core JavaScript, DOM interaction and web programming fundamentals.', videoLink: 'https://www.youtube.com/embed/hdI2bqOjy3c' },
    { id: 25, name: 'HTML', priceINR: 1999, difficulty: 'Beginner', org: 'Coursera Project Network', rating: 4.7, description: 'Learn HTML structure, tags, and accessible web page design.', videoLink: 'https://www.youtube.com/embed/pQN-pnXPaVg' },
    { id: 26, name: 'CSS', priceINR: 1999, difficulty: 'Beginner', org: 'Coursera Project Network', rating: 4.7, description: 'Style websites with CSS, layouts, responsive design and animations.', videoLink: 'https://www.youtube.com/embed/yfoY53QXEnI' },
    { id: 27, name: 'React', priceINR: 4299, difficulty: 'Advanced', org: 'The Hong Kong University of Science and Technology', rating: 4.6, description: 'Build single-page apps and reusable components using React.', videoLink: 'https://www.youtube.com/embed/dGcsHMXbSOA' },
    { id: 28, name: 'Node.js', priceINR: 3999, difficulty: 'Intermediate', org: 'Coursera Project Network', rating: 4.2, description: 'Build server-side apps and APIs using Node.js and Express.', videoLink: 'https://www.youtube.com/embed/TlB_eWDSMt4' },
    { id: 29, name: 'MongoDB', priceINR: 3699, difficulty: 'Intermediate', org: 'University of London', rating: 4.5, description: 'Learn MongoDB data modeling, queries and cloud database integration.', videoLink: 'https://www.youtube.com/embed/pWbMrx5rVBE' },
    { id: 30, name: 'Django', priceINR: 4299, difficulty: 'Advanced', org: 'University of Michigan', rating: 4.6, description: 'Create web applications with Django, Python, and database integration.', videoLink: 'https://www.youtube.com/embed/F5mRW0jo-U4' },
    { id: 31, name: 'Flask', priceINR: 3499, difficulty: 'Intermediate', org: 'Coursera Project Network', rating: 4.5, description: 'Build lightweight Python web APIs using Flask and deployment practices.', videoLink: 'https://www.youtube.com/embed/Z1RJmh_OqeA' },
    { id: 32, name: 'AWS', priceINR: 4999, difficulty: 'Advanced', org: 'Amazon Web Services', rating: 4.0, description: 'Learn AWS cloud services, deployment, and infrastructure automation.', videoLink: 'https://www.youtube.com/embed/ulprqHHWlng' },
    { id: 33, name: 'Google Cloud Platform', priceINR: 5299, difficulty: 'Advanced', org: 'Google Cloud', rating: 4.7, description: 'Explore GCP compute, storage, machine learning and cloud architecture.', videoLink: 'https://www.youtube.com/embed/1g8EZV6bK8I' },
    { id: 34, name: 'Microsoft Azure', priceINR: 4999, difficulty: 'Advanced', org: 'LearnQuest', rating: 4.3, description: 'Build and deploy cloud solutions using Microsoft Azure services.', videoLink: 'https://www.youtube.com/embed/Ht6kFsWdEfc' },
    { id: 35, name: 'Docker', priceINR: 3999, difficulty: 'Intermediate', org: 'Amazon Web Services', rating: 4.0, description: 'Containerize apps and workflows using Docker and images.', videoLink: 'https://www.youtube.com/embed/3c-iBn73dDE' },
    { id: 36, name: 'Kubernetes', priceINR: 4799, difficulty: 'Advanced', org: 'Google Cloud', rating: 4.8, description: 'Manage containerized applications with Kubernetes clusters and services.', videoLink: 'https://www.youtube.com/embed/X48VuDVv0do' },
    { id: 37, name: 'DevOps', priceINR: 4499, difficulty: 'Advanced', org: 'Google Cloud', rating: 4.8, description: 'Learn DevOps culture, CI/CD, automation, and cloud delivery.', videoLink: 'https://www.youtube.com/embed/0Y2afkJ7aNM' },
    { id: 38, name: 'Linux', priceINR: 2999, difficulty: 'Beginner', org: 'The Linux Foundation', rating: 4.5, description: 'Master Linux commands, shell scripting, and system administration.', videoLink: 'https://www.youtube.com/embed/wBp0Rb-ZJak' },
    { id: 39, name: 'Git', priceINR: 2499, difficulty: 'Beginner', org: 'Google', rating: 4.8, description: 'Version control with Git, branching workflows, and collaboration best practices.', videoLink: 'https://www.youtube.com/embed/8JJ101D3knE' },
    { id: 40, name: 'Agile Software Development', priceINR: 3799, difficulty: 'Intermediate', org: 'University of Alberta', rating: 4.7, description: 'Learn Agile planning, Scrum, and iterative delivery for software teams.', videoLink: 'https://www.youtube.com/embed/9TycLR0TqFA' },
    { id: 41, name: 'Scrum', priceINR: 3499, difficulty: 'Intermediate', org: 'University of Alberta', rating: 4.7, description: 'Understand Scrum roles, ceremonies, and agile product delivery.', videoLink: 'https://www.youtube.com/embed/P01OZ8NIi0M' },
    { id: 42, name: 'Software Engineering', priceINR: 4299, difficulty: 'Advanced', org: 'University of Alberta', rating: 4.3, description: 'Learn software design, development life cycles, and quality assurance.', videoLink: 'https://www.youtube.com/embed/3aISQJ2nDDs' },
    { id: 43, name: 'Algorithms', priceINR: 4799, difficulty: 'Advanced', org: 'Stanford University', rating: 4.7, description: 'Study algorithms, data structures, and efficient problem-solving techniques.', videoLink: 'https://www.youtube.com/embed/rL8X2mlNHPM' },
    { id: 44, name: 'Data Structures', priceINR: 4599, difficulty: 'Advanced', org: 'University of California San Diego', rating: 4.7, description: 'Explore data structures and their applications in software systems.', videoLink: 'https://www.youtube.com/embed/sVxBVvlnJsM' },
    { id: 45, name: 'Computer Programming', priceINR: 2999, difficulty: 'Beginner', org: 'University of Edinburgh', rating: 4.7, description: 'Build foundational coding skills and programming logic for beginners.', videoLink: 'https://www.youtube.com/embed/8mAITcNt710' },
    { id: 46, name: 'C++', priceINR: 3499, difficulty: 'Intermediate', org: 'University of Illinois', rating: 4.5, description: 'Learn C++ syntax, object-oriented design, and systems programming.', videoLink: 'https://www.youtube.com/embed/vLnPwxZdW4Y' },
    { id: 47, name: 'Java Programming', priceINR: 3799, difficulty: 'Intermediate', org: 'University of California San Diego', rating: 4.7, description: 'Develop Java applications using core APIs and object-oriented design.', videoLink: 'https://www.youtube.com/embed/grEKMHGYyns' },
    { id: 48, name: 'Python for Everybody', priceINR: 3399, difficulty: 'Beginner', org: 'University of Michigan', rating: 4.8, description: 'Learn Python programming basics, data handling, and web access.', videoLink: 'https://www.youtube.com/embed/8DvywoWv6fI' },
    { id: 49, name: 'R Programming', priceINR: 3299, difficulty: 'Beginner', org: 'Johns Hopkins University', rating: 4.5, description: 'Analyze data and create visualizations using R programming.', videoLink: 'https://www.youtube.com/embed/_V8eKsto3Ug' },
    { id: 50, name: 'Statistics', priceINR: 3599, difficulty: 'Intermediate', org: 'Duke University', rating: 4.4, description: 'Learn statistics concepts, probability, and data interpretation.', videoLink: 'https://www.youtube.com/embed/ZDL3rWGAkRI' }
];

const orders = [];

function checkAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.isAdmin) {
        return next();
    }
    res.status(403).send('Access denied. Admin login required.');
}

function streamPDF(res, filename, builder) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);
    builder(doc);
    doc.end();
}

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
        req.session.user = {
            name: user.name,
            email: user.email,
            isAdmin: !!user.isAdmin
        };
        req.session.cart = req.session.cart || [];
        return res.redirect('/');
    }

    res.render('login', { error: 'Invalid email or password!', user: null });
});

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

    users.push({ name, email, password, isAdmin: false });
    res.render('register', { error: null, success: 'Registration successful! Please login now.', user: null });
});

app.get('/', checkAuth, (req, res) => {
    if (req.session.user && req.session.user.isAdmin) {
        return res.redirect('/admin');
    }
    const sessionCart = req.session.cart || [];
    res.render('index', {
        courses,
        cartCount: sessionCart.length,
        user: req.session.user
    });
});

app.get('/course/:id', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.redirect('/admin');
    next();
}, async (req, res, next) => {
    try {
        const course = courses.find(c => c.id == req.params.id);
        if (!course) return res.status(404).send('Course not found');

        const sessionCart = req.session.cart || [];
        let recommendations = [];
        let mlStatus = 'online';

        try {
            const response = await axios.get(`${ML_SERVICE_URL}/recommend`, {
                params: { title: course.name, num: 5 },
                timeout: 5000
            });
            recommendations = response.data.recommendations || [];
        } catch (error) {
            console.error('ML Service Offline or unavailable, using fallback', error.message);
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
            cartCount: sessionCart.length,
            user: req.session.user
        });
    } catch (error) {
        next(error);
    }
});

app.get('/cart', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.redirect('/admin');
    next();
}, (req, res) => {
    const sessionCart = req.session.cart || [];
    const total = sessionCart.reduce((sum, item) => sum + item.priceINR, 0);
    res.render('cart', {
        cart: sessionCart,
        total: total.toLocaleString('en-IN'),
        cartCount: sessionCart.length,
        user: req.session.user
    });
});

app.post('/cart/add', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.status(403).json({ success: false, message: 'Admins cannot add courses to cart.' });
    next();
}, (req, res) => {
    const course = courses.find(c => c.id == parseInt(req.body.courseId));
    if (course) {
        req.session.cart = req.session.cart || [];
        req.session.cart.push({ ...course, addedAt: new Date() });
        return res.json({ success: true, cartCount: req.session.cart.length });
    }
    res.json({ success: false });
});

app.post('/cart/remove', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.status(403).json({ success: false, message: 'Admins cannot remove cart items.' });
    next();
}, (req, res) => {
    const courseId = parseInt(req.body.courseId);
    req.session.cart = (req.session.cart || []).filter(item => item.id !== courseId);
    res.json({ success: true, cartCount: req.session.cart.length });
});

app.get('/checkout', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.redirect('/admin');
    next();
}, (req, res) => {
    const sessionCart = req.session.cart || [];
    if (!sessionCart.length) return res.redirect('/cart');
    const total = sessionCart.reduce((sum, item) => sum + item.priceINR, 0);
    res.render('checkout', {
        cart: sessionCart,
        total: total.toLocaleString('en-IN'),
        cartCount: sessionCart.length,
        user: req.session.user,
        error: null
    });
});

app.post('/checkout', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.redirect('/admin');
    next();
}, (req, res) => {
    const sessionCart = req.session.cart || [];
    if (!sessionCart.length) return res.redirect('/cart');

    const { paymentMethod, cardNumber, upiId, bankName } = req.body;
    let error = null;

    if (!paymentMethod) {
        error = 'Please select a payment method.';
    } else if (paymentMethod === 'card' && (!cardNumber || cardNumber.replace(/\D/g, '').length !== 16)) {
        error = 'Please enter a valid 16-digit card number.';
    } else if (paymentMethod === 'upi' && (!upiId || !upiId.includes('@'))) {
        error = 'Please enter a valid UPI ID.';
    } else if (paymentMethod === 'netbanking' && !bankName) {
        error = 'Please select a bank for net banking.';
    }

    if (error) {
        const total = sessionCart.reduce((sum, item) => sum + item.priceINR, 0);
        return res.render('checkout', {
            cart: sessionCart,
            total: total.toLocaleString('en-IN'),
            cartCount: sessionCart.length,
            user: req.session.user,
            error
        });
    }

    const total = sessionCart.reduce((sum, item) => sum + item.priceINR, 0);
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    const transactionId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const paymentLabel = {
        razorpay: 'Razorpay (Dummy)',
        stripe: 'Stripe (Dummy)',
        card: 'Credit/Debit Card',
        upi: 'UPI',
        netbanking: 'NetBanking'
    }[paymentMethod] || 'Online Payment';

    const order = {
        id: orderId,
        transactionId,
        userEmail: req.session.user.email,
        items: [...sessionCart],
        total,
        paymentMethod: paymentLabel,
        status: 'Success',
        createdAt: new Date(),
        invoiceNumber: 'INV-' + Date.now().toString(36).toUpperCase()
    };

    orders.push(order);
    req.session.cart = [];

    res.render('order-confirmation', {
        order,
        cartCount: 0,
        user: req.session.user
    });
});

app.get('/invoice/:orderId', checkAuth, (req, res) => {
    const order = orders.find(o => o.id === req.params.orderId);
    if (!order) return res.status(404).send('Order not found');
    if (order.userEmail !== req.session.user.email && !req.session.user.isAdmin) {
        return res.status(403).send('Access denied');
    }
    res.render('invoice', {
        order,
        cartCount: (req.session.cart || []).length,
        user: req.session.user
    });
});

app.get('/invoice/:orderId/pdf', checkAuth, (req, res) => {
    const order = orders.find(o => o.id === req.params.orderId);
    if (!order) return res.status(404).send('Order not found');
    if (order.userEmail !== req.session.user.email && !req.session.user.isAdmin) {
        return res.status(403).send('Access denied');
    }

    streamPDF(res, `${order.id}-invoice.pdf`, doc => {
        doc.fontSize(22).text('Course Registration Invoice', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice ID: ${order.invoiceNumber}`);
        doc.text(`Order ID: ${order.id}`);
        doc.text(`Transaction ID: ${order.transactionId}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Order Date: ${order.createdAt.toLocaleString()}`);
        doc.text(`Customer: ${order.userEmail}`);
        doc.moveDown();
        doc.fontSize(14).text('Courses Purchased:', { underline: true });
        doc.moveDown(0.5);
        order.items.forEach(item => {
            doc.text(`• ${item.name} | ₹${item.priceINR.toLocaleString('en-IN')} | ${item.org}`);
        });
        doc.moveDown();
        doc.fontSize(14).text(`Total Paid: ₹${order.total.toLocaleString('en-IN')}`);
    });
});

app.get('/transactions', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.redirect('/admin');
    next();
}, (req, res) => {
    const userOrders = orders.filter(o => o.userEmail === req.session.user.email);
    res.render('transactions', {
        orders: userOrders,
        cartCount: (req.session.cart || []).length,
        user: req.session.user
    });
});

app.get('/recommendation-report/:id/pdf', checkAuth, (req, res, next) => {
    if (req.session.user.isAdmin) return res.redirect('/admin');
    next();
}, async (req, res) => {
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
        recommendations = courses
            .filter(c => c.id !== course.id)
            .slice(0, 5)
            .map(c => ({ title: c.name, similarity_score: Math.floor(Math.random() * 30 + 40), difficulty: c.difficulty, rating: c.rating }));
    }

    streamPDF(res, `${course.name.replace(/\s+/g, '_')}-recommendations.pdf`, doc => {
        doc.fontSize(22).text('Course Recommendation Report', { underline: true });
        doc.moveDown();
        doc.fontSize(14).text(`Course: ${course.name}`);
        doc.text(`Organization: ${course.org}`);
        doc.text(`Difficulty: ${course.difficulty}`);
        doc.text(`Rating: ★ ${course.rating}`);
        doc.moveDown();
        doc.text('Recommended Courses:', { underline: true });
        doc.moveDown(0.5);
        recommendations.forEach(rec => {
            doc.text(`• ${rec.title} | Match: ${rec.similarity_score}% | Difficulty: ${rec.difficulty} | Rating: ★ ${rec.rating}`);
        });
    });
});

app.get('/admin', checkAuth, checkAdmin, (req, res) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalUsers = users.length;
    const totalCourses = courses.length;
    const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    const courseSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            courseSales[item.name] = (courseSales[item.name] || 0) + 1;
        });
    });
    const topCourses = Object.entries(courseSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    res.render('admin-dashboard', {
        user: req.session.user,
        cartCount: (req.session.cart || []).length,
        stats: { totalUsers, totalCourses, totalOrders, totalRevenue },
        topCourses,
        recentOrders
    });
});

app.get('/admin/users', checkAuth, checkAdmin, (req, res) => {
    res.render('admin-users', {
        user: req.session.user,
        cartCount: (req.session.cart || []).length,
        users
    });
});

app.post('/admin/users/delete', checkAuth, checkAdmin, (req, res) => {
    const { email } = req.body;
    if (email === 'admin@college.edu') return res.redirect('/admin/users');
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
        users.splice(index, 1);
    }
    res.redirect('/admin/users');
});

app.get('/admin/orders', checkAuth, checkAdmin, (req, res) => {
    res.render('admin-orders', {
        user: req.session.user,
        cartCount: (req.session.cart || []).length,
        orders
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        mlService: ML_SERVICE_URL,
        usersRegistered: users.length,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0)
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack || err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).send(`<pre style="white-space: pre-wrap; word-break: break-word;">${err.stack || err}</pre>`);
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`Server running on port ${PORT}`);
    console.log(`ML Service: ${ML_SERVICE_URL}`);
    console.log('Demo Student: student@college.edu / student123');
    console.log('Demo Admin: admin@college.edu / admin123');
    console.log('='.repeat(50));
});