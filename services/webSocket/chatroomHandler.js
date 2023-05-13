
import { Chatroom, User } from "../../models/database.js";

const registerChatroomHandlers = (io, socket, redisPub, redisSub) => {

    const subscribeChannel = async (chatroomId) => {
        try {
             // join room
            socket.join(chatroomId);

            // check if already subscribe chatroom on redis
            const [ isSubscribed ] = await redisPub.pubsub("CHANNELS", chatroomId)
            if ( !isSubscribed ) {
                await redisSub.subscribe(chatroomId);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const unsubscribeChannel = async (chatroomId) => {
        try {
            // leave room
            socket.leave(chatroomId);

            // unsubscribe if no members in room
            if ( !io.sockets.adapter.rooms.has(chatroomId) ) {
                await redisSub.unsubscribe(chatroomId);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const sendMessage = async (chatroomId, msgData) => {
        try {
            // store message to db
            await Chatroom.findByIdAndUpdate(chatroomId, {
                $push: { messages: JSON.parse(msgData) }
            })
            await redisPub.publish(chatroomId, msgData);
        } catch (err) {
            console.error(err)
        }
    }

    const updateUserLastConnectionTime = async (userId) => {
        await User.findByIdAndUpdate(userId, {lastChatroomConnectTime: new Date()})
    }

    socket.on("subscribe", subscribeChannel);
    socket.on("unsubscribe", unsubscribeChannel);
    socket.on("sendMessage", sendMessage);
    socket.on("chatroomConnect", updateUserLastConnectionTime);
}

export default registerChatroomHandlers;
