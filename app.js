/* eslint-disable no-undef */
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { generateUploadURL } from "./utils/s3.js";
import { API_DOMAIN, DOMAIN, WWWDOMAIN } from "./constant.js";
import { initWebSocket } from "./utils/socket.js";
import { initMongoDB } from "./models/database.js";

// Apollo server
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginInlineTrace } from "@apollo/server/plugin/inlineTrace";

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
initWebSocket(httpServer);

// Apollo server for GraphQL
const server = new ApolloServer({
    typeDefs: [userTypeDefs, classInfoTypeDefs],
    resolvers: [userResolvers, classInfoResolvers],
    plugins: [ApolloServerPluginDrainHttpServer( { httpServer } ), ApolloServerPluginInlineTrace()],
});
await server.start();
await new Promise((resolve) => httpServer.listen({ port: port }, resolve));
console.info(`🚀 Server ready at ${API_DOMAIN}/graphql`);

app.use(cors({
    origin: [WWWDOMAIN, DOMAIN, "http://localhost:3000"],
    methods: ["POST"]
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/api/1.0', autoTestRouter, gitHubRouter);

app.use('/test', (req, res) => {
    res.send("ok");
})

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

app.use((req, res) => {
    console.log(`404: ${req.path}`);
    res.status(404).json('page not found');
})
