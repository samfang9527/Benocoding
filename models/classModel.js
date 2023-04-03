
import { ClassInfo } from "./database.js";

async function getClass(classId) {
    const data = await ClassInfo.findById(classId);
    return data;
}

export {
    getClass
}