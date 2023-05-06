
const typeDefs = `#graphql

    type ClassInfo {
        classId: String
        className: String
        classImage: String
        classDesc: String
    }

    type User {
        statusCode: Int
        responseMessage: String
        id: String
        username: String
        email: String
        createdClasses: [ClassInfo]
        boughtClasses: [ClassInfo]
        tags: [String]
        lastChatroomConnectTime: Date
    }

    type Jwt {
        statusCode: Int
        responseMessage: String
        jwt: String
    }

    type JwtData {
        statusCode: Int
        responseMessage: String
        userId: String
        username: String
        email: String
    }

    input UserData {
        username: String
        email: String
        password: String
    }

    type Query {
        me(id: String!): User
        jwtValidate: JwtData
    }

    type Mutation {
        signin(data: UserData!): Jwt
        signup(data: UserData!): Jwt
    }
`;

export {
    typeDefs
};