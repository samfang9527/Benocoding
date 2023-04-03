import mongoose from "mongoose";
import dotenv from "dotenv";
import { userSchema } from "./schemas/userSchema.js";
import { classInfoSchema } from "./schemas/classInfoSchema.js";
import { userClassInfoSchema } from "./schemas/userClassInfoSchema.js";
import { chatroomSchema } from "./schemas/chatroomSchema.js";

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

const User = mongoose.model('user', userSchema);
const ClassInfo = mongoose.model('classInfo', classInfoSchema);
const UserClassInfo = mongoose.model('userClassInfo', userClassInfoSchema);
const Chatroom = mongoose.model('chatroom', chatroomSchema);

export {
    mongoose as DB,
    User,
    ClassInfo,
    UserClassInfo,
    Chatroom
};
