/* eslint-disable no-undef */

import { Server } from "socket.io";
import { DOMAIN, WWWDOMAIN } from "../constant.js";
import { initialRedisPubSub } from "./cache.js";
import { Chatroom, User } from "../models/database.js";
import { Configuration, OpenAIApi } from "openai";
import { createAdapter } from "@socket.io/redis-adapter";

export async function initWebSocket(httpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: [DOMAIN, WWWDOMAIN, "http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    const { redisPub, redisSub } = initialRedisPubSub();
    io.adapter(createAdapter(redisPub, redisSub));

    redisSub.on("message", (channel, msgData) => {
        io.to(channel).emit('newMessage', JSON.parse(msgData));
    })

    io.on('connection', (socket) => {
        console.info(`user: ${socket.id} connected`);

        socket.on('subscribe', async ( chatroomId ) => {
            // join room
            await socket.join(chatroomId);
            console.trace(`${socket.id} join room: ${chatroomId}`);

            // check if already subscribe chatroom on redis
            const [ isSubscribed ] = await redisPub.pubsub("CHANNELS", chatroomId)
            if ( !isSubscribed ) {
                await redisSub.subscribe(chatroomId);
                console.trace(`${socket.id} subscribe ${chatroomId}`);
            }
        })

        socket.on("unsubscribe", async ( chatroomId ) => {
            // leave room
            socket.leave(chatroomId);

            // unsubscribe if no members in room
            if ( !io.sockets.adapter.rooms.has(chatroomId) ) {
                await redisSub.unsubscribe(chatroomId);
                console.trace(`${socket.id} unsub ${chatroomId}`);
            }
        });
      
        socket.on("sendMessage", async (chatroomId, msgData) => {
            // store message to db
            await Chatroom.findByIdAndUpdate(chatroomId, {
                $push: { messages: JSON.parse(msgData) }
            })

            await redisPub.publish(chatroomId, msgData);
            console.trace(`user: ${socket.id} publish ${msgData}`);
        });

        socket.on("chatroomConnect", async (userId) => {
            await User.findByIdAndUpdate(userId, {lastChatroomConnectTime: new Date()})
        })
    
        socket.on('codeReview', async (diffString, number) => {
            // connect to openai
            const apiKey = process.env.CHATGPT_API_KEY;
            const organization = process.env.CHATGPT_ORGANIZATION;
            const intro = `
                Please review all the following code diff and give me a code review within 150 words.
                I want you to provide at lease three problems or parts that can make me better within the difference.
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
                
                console.trace('start generating code review');
                const response = await openai.createChatCompletion({
                    model: model,
                    messages: messages
                })
                const codeReview = response.data.choices[0].message.content;
                socket.emit('codeReviewResult', codeReview, number);
                console.trace('Complete generating code review');
    
    
            } catch (err) {
                console.error(err.response);
            }
        })
    });
}