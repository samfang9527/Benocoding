
import { ClassInfo } from "./database.js";

async function getClassInfo(classId) {
    const data = await ClassInfo.findById(classId);
    return data;
}

async function createClassInfo(data) {
    try {
        const result = await ClassInfo.create(data);
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    getClassInfo,
    createClassInfo
}