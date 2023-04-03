import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'username is required'],
        minLength: [2, 'username can\'t be smaller than 2 characters'],
        maxLength: [16, 'username can\'t be greater than 16 characters']
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        lowercase: true,
        maxLength: [128, 'email can\'t be greater than 128 characters'],
    },
    password: {
        type: String,
        require: [true, 'password is required'],
    },
    class: [{
        classId: String,
        className: String,
        role: String,
        githubAccessToken: String
    }],
    tags: [String]
}, { collection: 'users' } );

export { userSchema };