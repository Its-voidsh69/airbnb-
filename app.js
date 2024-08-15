const { AsyncResource } = require('async_hooks');
const express = require('express');
const Listing = require("./model/listing.js");
const app = express();
const mongoose = require('mongoose');
const port = 8080;
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const wrapAsync = require('./util/wrapAsync.js')
const ExpressError = require('./util/ExpressError.js')
const Review = require("./model/review.js");
const { findByIdAndDelete } = require('./model/review.js');

app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

main().then(() => {
    console.log("connection successful");
}).catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

app.get("/", (req, res) => {
    res.send("root is working");
});

app.get("/listings", wrapAsync(async (req, res, next) => {
    const allChat = await Listing.find({});
    res.render("listings/index.ejs", { allChat });
}));

app.get('/listings/new', (req, res) => {
    res.render('listings/new.ejs');
});

app.post("/listings", wrapAsync(async (req, res, next) => {
    let { title, description, filename, url, price, location, country } = req.body;
    let newListing = new Listing({
        title: title,
        description: description,
        image: {
            filename: filename,
            url: url,
        },
        price: price,
        location: location,
        country: country,
    });
    console.log(newListing);
    await newListing.save();
    res.redirect("/listings");
}));

app.put("/listings/:id", wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, filename, imageUrl, location, price, country } = req.body;

    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        {
            title,
            description,
            image: { filename, url: imageUrl },
            location,
            price,
            country,
        },
        { new: true, runValidators: true }
    );

    console.log("Updated Listing:", updatedListing); // Log the updated listing object
    res.redirect("/listings/" + id); // Redirect to the updated listing page or to listings page
}));

app.post("/listings/:id/edit", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));

app.get("/listings/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let data = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { data });
}));

app.delete("/listings/:id", wrapAsync(async (req, res, next) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect('/listings');
}));

app.post("/listings/:id/review", async(req, res) =>{
   let listing = await Listing.findById(req.params.id);
   let newReview = new Review(req.body.review);

   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();

   console.log("new review saved");
   res.redirect(`/listings/${listing._id}`);
})

app.delete("/listings/:id", wrapAsync( async(req, res)=>{
    let {id} = req.params;
    let deletedlisting = await Listing.findByIdAndDelete(id);
    console.log(deletedlisting);
    res.redirect("/listings");
}))

app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    res.redirect(`/listings/${id}`);
}));

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("listings/error.ejs", {message}); // Send detailed error message
});

app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
});
