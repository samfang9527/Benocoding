import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { generateUploadURL } from "./utils/s3.js";
import { API_DOMAIN, DOMAIN, WWWDOMAIN } from "./constant.js";
import { initMongoDB } from "./models/database.js";

// socket.io server
import { Server } from "socket.io";
import { initialRedisPubSub } from "./utils/cache.js";
import { createAdapter } from "@socket.io/redis-adapter";
import registerChatGPTHandlers from "./services/webSocket/chatgptHandler.js";
import registerChatroomHandlers from "./services/webSocket/chatroomHandler.js";

// Apollo server
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

// typeDefs
import { typeDefs as userTypeDefs } from "./typeDefs/userTypeDefs.js";
import { typeDefs as classInfoTypeDefs } from "./typeDefs/classInfoTypeDefs.js";

// resolvers
import { resolvers as userResolvers } from "./resolvers/userResolver.js";
import { resolvers as classInfoResolvers } from "./resolvers/classInfoResolver.js";

// express router
import { autoTestRouter } from "./routes/autoTest_route.js";
import { gitHubRouter } from "./routes/github_route.js";

dotenv.config();

// express
const app = express();
const port = process.env.MAIN_SERVER_PORT;
const httpServer = http.createServer(app);

// mongoDB
initMongoDB();

// socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [DOMAIN, WWWDOMAIN, "http://localhost:3000"],
        credentials: true
    }
});

const { redisPub, redisSub } = initialRedisPubSub();
io.adapter(createAdapter(redisPub, redisSub));

redisSub.on("message", (channel, msgData) => {
    io.to(channel).emit('newMessage', JSON.parse(msgData));
})

const onSocketIOConnection = (socket) => {
    registerChatroomHandlers(io, socket, redisPub, redisSub);
    registerChatGPTHandlers(io, socket);
}

io.on("connection", onSocketIOConnection);

// Apollo server for GraphQL
const server = new ApolloServer({
    typeDefs: [userTypeDefs, classInfoTypeDefs],
    resolvers: [userResolvers, classInfoResolvers],
    plugins: [ApolloServerPluginDrainHttpServer( { httpServer } )]
});
await server.start();
await new Promise((resolve) => httpServer.listen({ port: port }, resolve));
console.info(`🚀 Server ready at ${API_DOMAIN}/graphql`);

app.use(cors({
    origin: [WWWDOMAIN, DOMAIN, "http://localhost:3000"],
    methods: ["GET", "POST"]
}));
app.use(express.json());
app.use('/api/1.0', autoTestRouter, gitHubRouter);

app.use(
    '/graphql',
    expressMiddleware(server, {
        context: async ({ req }) => {
            return { token: req.headers.token }
        },
    })
);

// for file upload
app.post('/fileUpload', async (req, res) => {
    const { fileExtension} = req.body;
    const url = await generateUploadURL(fileExtension);
    return res.status(200).json(url);
})

// for ALB healthy check 
app.get('/', (req, res) => {
    res.status(200).send("ok");
})

app.use((req, res) => {
    console.log(`404: ${req.path}`);
    res.status(404).json('page not found');
})
