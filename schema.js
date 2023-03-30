
import { User } from "./models/database.js";

const typeDefs = `#graphql
type User {
    id: ID
    username: String
    email: String
    password: String
}

type Query {
    me(id: ID!): User
    users: [User]
}
`;

const resolvers = {
    Query: {
        me: async (_, { id }, context) => {
            const info = await User.findById(id);
            return info;
        },
        users: async () => {
            const infos = await User.find();
            return infos;
        }
    }
};



export {
    typeDefs,
    resolvers
}