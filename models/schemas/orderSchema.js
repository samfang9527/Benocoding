import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    username: String,
    userId: String,
    orderStatus: String,
    orderPrice: Number,
    orderDetail: [{
        classId: String,
        className: String,
        createrId: String,
        teacherName: String,
        price: Number,
    }],
    createdDate: Date,
    payment: String,

}, { collection: 'orders' } );

export { orderSchema };