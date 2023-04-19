
const typeDefs = `#graphql

    type ClassInfo {
        classId: String
        className: String
        classImage: String
        classDesc: String
    }

    type User {
        status: Int
        responseMessage: String
        id: String
        username: String
        email: String
        createdClasses: [ClassInfo]
        boughtClasses: [ClassInfo]
        tags: [String]
    }

    type Jwt {
        status: Int
        responseMessage: String
        jwt: String
    }

    type JwtData {
        status: Int
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