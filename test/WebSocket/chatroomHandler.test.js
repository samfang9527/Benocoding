
import { Chatroom, User } from "../../models/database";
import registerChatroomHandlers from "../../services/WebSocket/chatroomHandler";

const mockedRedisPub = {
    pubsub: jest.fn().mockResolvedValue([true]),
    publish: jest.fn().mockResolvedValue(true)
};

const mockedRedisSub = {
    subscribe: jest.fn().mockResolvedValue(true),
    unsubscribe: jest.fn().mockResolvedValue(true)
};

const mockedIO = {
    sockets: {
        adapter: {
            rooms: new Map(),
            roomExists: jest.fn().mockImplementation((roomId) => {
                return mockedIO.sockets.adapter.rooms.has(roomId);
            })
        }
    }
};

const mockedSocket = {
    join: jest.fn().mockImplementation(chatroomId => {
        const rooms = mockedIO.sockets.adapter.rooms;
        rooms.set(chatroomId, rooms.get(chatroomId) + 1)
    }),
    leave: jest.fn().mockImplementation(chatroomId => {
        const rooms = mockedIO.sockets.adapter.rooms;
        rooms.set(chatroomId, rooms.get(chatroomId) - 1)
        if (rooms.get(chatroomId) === 0 ) {
            rooms.delete(chatroomId);
        }
    }),
    on: jest.fn()
};



jest.mock("../../models/database.js", () => ({
    Chatroom: {
        findByIdAndUpdate: jest.fn().mockResolvedValue(true)
    },
    User: {
        findByIdAndUpdate: jest.fn().mockResolvedValue(true)
    }
}));

describe("redisterChatroomHandlers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("subscribeChannel should join room and subscribe if not already subscribed", async () => {
        const chatroomId = "6445f2575f83dcc8f06b37b7";
        const socket = {...mockedSocket};
        const redisPub = {...mockedRedisPub};
        const redisSub = {...mockedRedisSub};

        registerChatroomHandlers(mockedIO, socket, redisPub, redisSub);
        expect(socket.on).toHaveBeenCalledTimes(4);

        // init socket.io room
        mockedIO.sockets.adapter.rooms.set(chatroomId, 0);

        // 模擬訂閱 Redis 頻道時返回未訂閱的情況
        redisPub.pubsub.mockResolvedValueOnce([false]);

        await socket.on.mock.calls[0][1](chatroomId);   // 呼叫 subscribeChannel
        expect(socket.join).toHaveBeenCalledWith(chatroomId);
        expect(redisPub.pubsub).toHaveBeenCalledWith("CHANNELS", chatroomId);
        expect(redisSub.subscribe).toHaveBeenCalledWith(chatroomId);

        // delete socket.io room
        mockedIO.sockets.adapter.rooms.delete(chatroomId);
    })

    test("subscribeChannel should join room and not subscribe if already subscribed", async () => {
        const chatroomId = "6445f2575f83dcc8f06b37b7";
        const socket = {...mockedSocket};
        const redisPub = {...mockedRedisPub};
        const redisSub = {...mockedRedisSub};

        registerChatroomHandlers(mockedIO, socket, redisPub, redisSub);
        expect(socket.on).toHaveBeenCalledTimes(4);

        // init socket.io room
        mockedIO.sockets.adapter.rooms.set(chatroomId, 0);

        // 模擬訂閱 Redis 頻道時返回未訂閱的情況
        redisPub.pubsub.mockResolvedValueOnce([true]);

        await socket.on.mock.calls[0][1](chatroomId);   // 呼叫 subscribeChannel
        expect(socket.join).toHaveBeenCalledWith(chatroomId);
        expect(redisPub.pubsub).toHaveBeenCalledWith("CHANNELS", chatroomId);
        expect(redisSub.subscribe).not.toHaveBeenCalledWith(chatroomId);

        // delete socket.io room
        mockedIO.sockets.adapter.rooms.delete(chatroomId);
    })

    test("unsubscribeChannel should leave room and unsubscribe if no members in the room", async () => {
        const chatroomId = "6445f2575f83dcc8f06b37b7";
        const socket = { ...mockedSocket };
        const redisPub = { ...mockedRedisPub };
        const redisSub = { ...mockedRedisSub };
    
        // init socket.io room
        mockedIO.sockets.adapter.rooms.set(chatroomId, 1);
    
        registerChatroomHandlers(mockedIO, socket, redisPub, redisSub);
        expect(socket.on).toHaveBeenCalledTimes(4);
    
        await socket.on.mock.calls[1][1](chatroomId); // 呼叫 unsubscribeChannel
    
        expect(socket.leave).toHaveBeenCalledWith(chatroomId);
        expect(mockedIO.sockets.adapter.roomExists(chatroomId)).toBe(false);
        expect(redisSub.unsubscribe).toHaveBeenCalledWith(chatroomId);
    });

    test("unsubscribeChannel should leave room and not unsubscribe if members in the room", async () => {
        const chatroomId = "6445f2575f83dcc8f06b37b7";
        const socket = { ...mockedSocket };
        const redisPub = { ...mockedRedisPub };
        const redisSub = { ...mockedRedisSub };
    
        // init socket.io room
        mockedIO.sockets.adapter.rooms.set(chatroomId, 2);
    
        registerChatroomHandlers(mockedIO, socket, redisPub, redisSub);
        expect(socket.on).toHaveBeenCalledTimes(4);
    
        await socket.on.mock.calls[1][1](chatroomId); // 呼叫 unsubscribeChannel
    
        expect(socket.leave).toHaveBeenCalledWith(chatroomId);
        expect(mockedIO.sockets.adapter.roomExists(chatroomId)).toBe(true);
        expect(redisSub.unsubscribe).not.toHaveBeenCalledWith(chatroomId);
    })

    test("sendMessage should store message to DB and publish to Redis", async () => {
        const chatroomId = "6445f2575f83dcc8f06b37b7";
        const msgData = JSON.stringify({
            userId: "6445e86a5f83dcc8f06b3787",
            time: new Date(),
            from: "Steven",
            message: "Hello World!"
        });
        const socket = { ...mockedSocket };
        const redisPub = { ...mockedRedisPub };
        const redisSub = { ...mockedRedisSub };
    
        registerChatroomHandlers(mockedIO, socket, redisPub, redisSub);
        expect(socket.on).toHaveBeenCalledTimes(4);
    
        await socket.on.mock.calls[2][1](chatroomId, msgData); // 呼叫 sendMessage
    
        expect(Chatroom.findByIdAndUpdate).toHaveBeenCalledWith(chatroomId, {
            $push: { messages: JSON.parse(msgData) }
        });
        expect(redisPub.publish).toHaveBeenCalledWith(chatroomId, msgData);
    })

    test("update the last connection time of user", async () => {
        const userId = "6445e86a5f83dcc8f06b3787";
        const socket = { ...mockedSocket };
        const redisPub = { ...mockedRedisPub };
        const lastChatroomConnectTime = new Date();

        registerChatroomHandlers(mockedIO, socket, redisPub, mockedRedisSub);
        expect(socket.on).toHaveBeenCalledTimes(4);

        await socket.on.mock.calls[3][1](userId); // 對話室連線時間替換
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { lastChatroomConnectTime });
    })
});