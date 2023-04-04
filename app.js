import express from "express";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { DB } from "./models/database.js";
import { generateUploadURL } from "./utils/s3.js";

// typeDefs
import { typeDefs as userTypeDefs } from "./typeDefs/userTypeDefs.js";
import { typeDefs as classInfoTypeDefs } from "./typeDefs/classInfoTypeDefs.js";

// resolvers
import { resolvers as userResolvers } from "./resolvers/userResolver.js";
import { resolvers as classInfoResolvers } from "./resolvers/classInfoResolver.js";

dotenv.config();

// express
const app = express();
const port = process.env.MAIN_SERVER_PORT;
const httpServer = http.createServer(app);

// socket.io
const io = new Server(httpServer, {
    cors: 'http://localhost:8080'
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('newMessage', (message) => {
        console.log(message);
        io.emit('update', message.message);
    })
});

// Apollo server for graphQL
const server = new ApolloServer({
    typeDefs: [userTypeDefs, classInfoTypeDefs],
    resolvers: [userResolvers, classInfoResolvers],
    plugins: [ApolloServerPluginDrainHttpServer( { httpServer } )]
});

await server.start();

app.use(cors());
app.use(express.json());

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
    console.log(url);
    return res.status(200).json(url);
})

app.post('/test', (req, res) => {
    const { body } = req;
    console.log(body);
    res.status(200).send('ok');
})


await new Promise((resolve) => httpServer.listen({ port: port }, resolve));
console.log(`🚀 Server ready at http://localhost:${port}/graphql`);

app.use(express.static('public'));

app.use((req, res) => {
    console.log(`404: ${req.path}`);
    res.status(404).json('page not found');
})
