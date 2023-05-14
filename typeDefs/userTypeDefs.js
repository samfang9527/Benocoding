
import { GraphQLScalarType, Kind } from "graphql";

const DateType = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
        return new Date(value); // 從傳入的值創建 Date 實例
    },
    serialize(value) {
        return value.getTime(); // 返回 Date 實例的時間戳
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10)); // 從 ast.value 創建 Date 實例
        }
        return null;
    },
});

const typeDefs = `#graphql
    scalar Date
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