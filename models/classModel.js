
import { Class } from "./database.js";

async function getClass(classId) {
    const data = await Class.findById(classId);
    return data;
}

export {
    getClass
}