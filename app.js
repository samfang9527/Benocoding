import express from "express";
import dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import cors from "cors";
import { DB } from "./models/database.js";

// typeDefs
import { typeDefs as userTypeDefs } from "./typeDefs/userTypeDefs.js";
import { typeDefs as classTypeDefs } from "./typeDefs/classTypeDefs.js";

// resolvers
import { resolvers as userResolvers } from "./resolvers/userResolver.js";
import { resolvers as classResolvers } from "./resolvers/classResolver.js";


dotenv.config();

const app = express();
const port = process.env.MAIN_SERVER_PORT;

const httpServer = http.createServer(app);
const server = new ApolloServer({
    typeDefs: [userTypeDefs, classTypeDefs],
    resolvers: [userResolvers, classResolvers],
    plugins: [ApolloServerPluginDrainHttpServer( { httpServer } )]
});

await server.start();

app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    })
);

app.use('/', (req, res) => {
    console.log('express is still working');
    res.status(200).json('ok');
})

await new Promise((resolve) => httpServer.listen({ port: port }, resolve));
console.log(`🚀 Server ready at http://localhost:${port}/graphql`);

app.use(express.static('public'));

app.use((req, res) => {
    console.log(`404: ${req.path}`);
    res.status(404).json('page not found');
})
