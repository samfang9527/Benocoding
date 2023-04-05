
const typeDefs = `#graphql

    type ClassInfo {
        classId: String
        className: String
        role: String
        githubAccessToken: String
    }

    type User {
        id: String
        username: String
        email: String
        password: String
        class: [ClassInfo]
        tags: [String]
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