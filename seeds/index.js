const mongoose = require('mongoose');
const Campground = require('../models/campground'); // Back out one directory.
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

// Logic to check if there is an error.
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
})

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000); // 1000 cities in cities.js
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            // Your user id
            author: '62c5ce39c6ea7e669729e4bb',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            price: price,
            geometry: {
                type : "Point", 
                coordinates : [cities[random1000].longitude, cities[random1000].latitude]
            },
            description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Blanditiis architecto ipsum veniam veritatis eveniet cupiditate perspiciatis obcaecati excepturi qui, ex totam, incidunt dicta saepe commodi quis rerum, quidem voluptatibus animi.",
            images: [
                { 
                    url: "https://res.cloudinary.com/dkihj5ge1/image/upload/v1657391577/YelpCamp/zgoueu6cv8whdxxxhe9p.jpg", 
                    filename: "YelpCamp/zgoueu6cv8whdxxxhe9p" 
                },
                {
                    url: "https://res.cloudinary.com/dkihj5ge1/image/upload/v1657391580/YelpCamp/zstuuuuy26wdo7ejqtzi.jpg",
                    filename: "YelpCamp/zstuuuuy26wdo7ejqtzi"
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})