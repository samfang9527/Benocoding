
import { User } from "./database.js";
import { UserClassInfo } from "./database.js";

async function getUserClassData(classId, userId) {
    try {
        const data = await UserClassInfo.find({
            classId: classId,
            userId: userId
        })
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