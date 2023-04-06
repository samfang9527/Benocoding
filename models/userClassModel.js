
import { UserClassInfo } from "./database.js";

async function getUserClassData(classId) {
    try {
        const data = await UserClassInfo.findById(classId);
        return data;
    } catch (err) {
        console.error(err);
    }
}

async function createUserClassInfo(data) {
    try {
        const result = await UserClassInfo.create(data);
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    createUserClassInfo,
    getUserClassData
};