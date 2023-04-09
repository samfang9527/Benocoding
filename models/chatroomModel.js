
import { Chatroom } from "./database.js";

async function createChatroom(data) {
    try {
        const result = await Chatroom.create(data);
        return result;
    } catch (err) {
        console.error(err);
    }
}

async function addUserToChatroom(chatroomId, userInfo) {
    try {
        const result = Chatroom.findByIdAndUpdate(chatroomId, {
            $push: {"members": userInfo}
        }, {new: true})
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    createChatroom,
    addUserToChatroom
}