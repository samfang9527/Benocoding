
import { Class } from "./database.js";

async function getClassList() {
    const data = await Class.find();
    return data;
}

export {
    getClassList
}