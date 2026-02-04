const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config();

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors());
app.use(express.json()); // allows us to parse JSON bodies

// Mongo connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Error: ", error);
        // Exit process if connection fails
        process.exit(1)
    }
};

connectDB();

app.get('/', (req, res) => {
    res.send('API is running...');
})


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});