import mongoose from "mongoose";
import dotenv from "dotenv";
import { userSchema } from "./schemas/userSchema.js";
import { classSchema } from "./schemas/classSchema.js";

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

const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);

export {
    mongoose as DB,
    User,
    Class
};