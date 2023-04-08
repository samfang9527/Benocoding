
import { User } from "./database.js";
import { UserClassInfo } from "./database.js";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

async function getUserClassData(userClassId, userId) {
    try {
        const data = await UserClassInfo.find({
            classId: userClassId,
            userId: userId
        })
        console.log('data', data);
        return data;
    } catch (err) {
        console.error(err);
    }
}

async function createUserClassInfo(data) {
    try {
        const userData = await User.findById(data.userId);
        const obj = {
            userId: userData._id,
            username: userData.username,
            email: userData.email
        }

        const result = await UserClassInfo.create({...data, classMembers: obj});
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    createUserClassInfo,
    getUserClassData
};