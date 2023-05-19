const mongoose = require('mongoose');
const bodyParse = require('body-parser');
const app = require('express')();
const moment = require('moment');

// Fontend route
const FrontRouter = require('./routes/front');

// Set ejs template engine
app.set('view engine', 'ejs');

app.use(bodyParse.urlencoded({ extended: false }));
app.locals.moment = moment;

// Database connection
const db = require('./config/keys').mongoProdURI;
mongoose
    .connect(db, { useNewUrlParser: true })
    .then(() => console.log(`Mongodb Connected`))
    .catch(error => console.log(error));


app.use(FrontRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});