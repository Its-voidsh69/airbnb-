const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review.js')
const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        filename: {
            type: String,
            default: 'defaultimage',
        },
        url: {
            type: String,
            default: 'https://cdn.ebaumsworld.com/mediaFiles/picture/1151541/84693449.png',
            set: (v) => v === "" ? 'https://cdn.ebaumsworld.com/mediaFiles/picture/1151541/84693449.png' : v,
        }
    },
    price: {
        type: Number,
        required: false,
    },
    location: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }]
});

listingSchema.post("findOneAndDelete", async(listing_id) =>{
    if(listing_id){
        await Review.deleteMany({_id: {$in: listing_id.reviews}});
    }
})
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
