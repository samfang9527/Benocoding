import express from "express";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { Chatroom } from "./models/database.js";
import { generateUploadURL } from "./utils/s3.js";
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";

// typeDefs
import { typeDefs as userTypeDefs } from "./typeDefs/userTypeDefs.js";
import { typeDefs as classInfoTypeDefs } from "./typeDefs/classInfoTypeDefs.js";

// resolvers
import { resolvers as userResolvers } from "./resolvers/userResolver.js";
import { resolvers as classInfoResolvers } from "./resolvers/classInfoResolver.js";

// express router
import { autoTestRouter } from "./routes/autoTest_route.js";

dotenv.config();

// express
const app = express();
const port = process.env.MAIN_SERVER_PORT;
const httpServer = http.createServer(app);

// Apollo server for graphQL
const server = new ApolloServer({
    typeDefs: [userTypeDefs, classInfoTypeDefs],
    resolvers: [userResolvers, classInfoResolvers],
    plugins: [ApolloServerPluginDrainHttpServer( { httpServer } )],
});

await server.start();

await new Promise((resolve) => httpServer.listen({ port: port }, resolve));
console.log(`🚀 Server ready at http://localhost:${port}/graphql`);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api/1.0', autoTestRouter);

app.use(
    '/graphql',
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    })
);

// for file upload
app.post('/fileUpload', async (req, res) => {
    const { fileExtension} = req.body;
    const url = await generateUploadURL(fileExtension);
    return res.status(200).json(url);
})

app.use((req, res) => {
    console.log(`404: ${req.path}`);
    res.status(404).json('page not found');
})

// socket.io
const io = new Server(httpServer, {
    cors: 'http://localhost:8080'
});

const chatroomObject = {};
const sockeToChatroomObj = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('newMessage', async (data) => {
        console.log('chatroomObj', chatroomObject);
        console.log('socketToChatroom', sockeToChatroomObj);
        const chatroomId = sockeToChatroomObj[socket.id];

        // store messages to DB
        try {
            const msgData = {
                time: new Date().toLocaleString(),
                from: data.username,
                message: data.message
            }
            await Chatroom.findByIdAndUpdate(chatroomId, {$push: {"messages": msgData}})

            const chatroomMembers = chatroomObject[chatroomId];
            chatroomMembers.forEach((socketId) => {
                io.to(socketId).emit('update', msgData);
            })
        } catch (err) {
            console.error(err);
        }
    })

    socket.on('joinChatroom', (chatroomId) => {
        if ( !chatroomObject.hasOwnProperty(chatroomId) ) {
            chatroomObject[chatroomId] = new Array();
        }

        if ( !chatroomObject[chatroomId].includes(socket.id) ) {
            chatroomObject[chatroomId].push(socket.id);
        }

        sockeToChatroomObj[socket.id] = chatroomId;
    })

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

    socket.on('disconnect', () => {
        console.log('disconnect!');
        const chatroomId = sockeToChatroomObj[socket.id];
        const members = chatroomObject[chatroomId];
        if ( members ) {
            members.splice( members.indexOf(socket.id), 1 );
        }
        delete sockeToChatroomObj[socket.id];
    })
});