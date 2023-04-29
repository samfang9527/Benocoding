
import { Server } from "socket.io";
import { DOMAIN, WWWDOMAIN } from "../constant.js";
import { initialRedisPubSub } from "./cache.js";
import { Chatroom } from "../models/database.js";
import { Configuration, OpenAIApi } from "openai";
import { createAdapter } from "@socket.io/redis-adapter";

export function createIOServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: [DOMAIN, WWWDOMAIN, "http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    return io;
}

export async function initialSocketIO(io) {

    const { redisPub, redisSub } = initialRedisPubSub();
    io.adapter(createAdapter(redisPub, redisSub));

    redisSub.on("message", (channel, msgData) => {
        io.to(channel).emit('newMessage', JSON.parse(msgData));
    })

    io.on('connection', (socket) => {
        console.log(`user: ${socket.id} connected`);

        socket.on('subscribe', async ( chatroomId ) => {
            // join room
            await socket.join(chatroomId);
            console.log(`${socket.id} join room: ${chatroomId}`);

            // check if already subscribe chatroom on redis
            const [ isSubscribed ] = await redisPub.pubsub("CHANNELS", chatroomId)
            if ( !isSubscribed ) {
                await redisSub.subscribe(chatroomId);
                console.log(`${socket.id} subscribe ${chatroomId}`);
            }
        })

        socket.on("unsubscribe", async ( chatroomId ) => {
            // leave room
            socket.leave(chatroomId);

            // unsubscribe if no members in room
            if ( !io.sockets.adapter.rooms.has(chatroomId) ) {
                await redisSub.unsubscribe(chatroomId);
                console.log(`${socket.id} unsub ${chatroomId}`);
            }
        });
      
        socket.on("sendMessage", async (chatroomId, msgData) => {
            // store message to db
            await Chatroom.findByIdAndUpdate(chatroomId, {
                $push: { messages: JSON.parse(msgData) }
            })

            await redisPub.publish(chatroomId, msgData);
            console.log(`user: ${socket.id} publish ${msgData}`);
        });
    
        socket.on('codeReview', async (diffString) => {
            // connect to openai
            const apiKey = process.env.CHATGPT_API_KEY;
            const organization = process.env.CHATGPT_ORGANIZATION;
            const intro = `
                Please review all the following code diff and give me a summary,
                describe the change and tell me if there are any problems or recommendations that can make it better.
            `;
            const model = process.env.CHATGPT_MODEL;
            const messages = [{
                "role": "system",
                "content": intro
            }]
    
            try {
                const segmentLength = 2048;
                for (let i = 0; i < diffString.length; i += segmentLength) {
                    const part = diffString.slice(i, i + segmentLength);
                    messages.push({
                        "role": "user",
                        "content": part
                    });
                }
    
                const configuration = new Configuration({
                    apiKey: apiKey,
                    organization: organization
                });
                
                const openai = new OpenAIApi(configuration);
                
                console.log('start generating code review');
                const response = await openai.createChatCompletion({
                    model: model,
                    messages: messages
                })
                const codeReview = response.data.choices[0].message.content;
                socket.emit('codeReviewResult', codeReview);
                console.log(codeReview);
                console.log('Complete generating code review');
    
    
            } catch (err) {
                console.error(err.response);
            }
        })
    });
}