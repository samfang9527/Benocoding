
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

    type Jwt {
        jwt: String
    }

    input UserData {
        username: String
        email: String
        password: String
    }

    type Query {
        me(id: String!): User
        users: [User]
    }

    type Mutation {
        signin(data: UserData!): Jwt
        signup(data: UserData!): Jwt
    }
`;

export {
    typeDefs
};