import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const user = process.env.MONGODB_USER;
const host = process.env.MONGODB_HOST;
const pwd = process.env.MONGODB_PWD;
const dbName = process.env.MONGODB_DATABASE;

mongoose.connect(
    `mongodb+srv://${user}:${pwd}@${host}?retryWrites=true&w=majority`, {
        dbName: dbName
    }
)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err))

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
        minLength: [8, 'password can\'t be smaller than 8 characters'],
        maxLength: [20, 'password can\'t be greater than 20 characters']
    },   
}, { collection: 'users' } );

const User = mongoose.model('User', userSchema);


export {
    User
};