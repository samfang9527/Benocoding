
import { UserClassInfo } from "./database.js";

async function createUserClassInfo(data) {
    try {
        const result = await UserClassInfo.create(data);
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    createUserClassInfo
};