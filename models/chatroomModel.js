
import { Chatroom } from "./database.js";

async function createChatroom(data) {
    try {
        const result = await Chatroom.create(data);
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    createChatroom
}