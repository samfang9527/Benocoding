
const typeDefs = `#graphql
    type User {
        id: String
        username: String
        email: String
        password: String
    }

    type Query {
        me(id: String!): User
        users: [User]
    }

    type Mutation {
        addUser(username: String!, email: String!, password: String!): User
        updateUsername(userId: ID!, newUsername: String!): User
    }
`;

export {
    typeDefs
};