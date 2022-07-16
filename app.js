if (process.env.NODE_ENV !== "production") { // When deployed, the code is in production else in development
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// Use all the three for extra functionalities.
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const Campground = require('./models/campground');
const { schema } = require('./models/campground');
const Review = require('./models/review');

const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const MongoDBStore = require('connect-mongo')(session);

const ExpressError = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./schemas.js');

const app = express();
const port = process.env.PORT || 3000;
const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
mongoose.connect(dbURL);
// 'mongodb://localhost:27017/yelp-camp'

// Logic to check if there is an error.
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate); // Instead of the default ejs use the ejs-mate.
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisisshouldbebettersecret!';
const store = new MongoDBStore({
    // To store the session in mongo, not in memory.
    url: dbURL,
    secret: secret,
    touchAfter: 24 * 60 * 60 // 1 day
})

store.on("error", function() {
    console.log("Session Store Error", e);
})

const sessionConfig = {
    // Basically for how long can a user be signed in.
    store: store,
    name: 'session',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // Date.now() is in ms, so 1 week is converted to ms.
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

const scriptSrcUrls = [

    'https://stackpath.bootstrapcdn.com/',
    'https://api.tiles.mapbox.com/',
    'https://api.mapbox.com/',
    'https://kit.fontawesome.com/',
    'https://cdnjs.cloudflare.com/',
    'https://cdn.jsdelivr.net/'
];
const styleSrcUrls = [
    'https://kit-free.fontawesome.com/',
    'https://stackpath.bootstrapcdn.com/',
    'https://api.mapbox.com/',
    'https://api.tiles.mapbox.com/',
    'https://fonts.googleapis.com/',
    'https://use.fontawesome.com/',
    'https://cdn.jsdelivr.net/'  // I had to add this item to the array 
];
const connectSrcUrls = [
    'https://api.mapbox.com/',
    'https://a.tiles.mapbox.com/',
    'https://b.tiles.mapbox.com/',
    'https://events.mapbox.com/'
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: [],
            imgSrc: [
                "'self'",
                'blob:',
                'data:',
                'https://res.cloudinary.com/dkihj5ge1/', //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
                'https://images.unsplash.com/'
            ],
            fontSrc: ["'self'", ...fontSrcUrls]
        }
    })
);


app.use(passport.initialize());
// After app.use(session(sessionConfig));
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); // serialization: how do we store in a session
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // res.locals.nameofVar will be available in every template.
    if (!['/login', '/'].includes(req.originalUrl)) {
        req.session.returnTo = req.originalUrl;
    }

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// CRUD
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.render('home');
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})

app.use((err, req, res, next) => { // Error Handler
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh No! Something went wrong";
    console.log("ERROR!!!: ", err.message);
    res.status(statusCode).render('error', { err });
})

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
})