
import { GraphQLScalarType } from "graphql";

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
    type Milestone {
        milestone: String
        milestoneDesc: String
        video: String
        autoTest: String
        passed: Boolean
    }

    type UserInfo {
        userId: String
        username: String
        email: String
    }

    type Class {
        ownerId: String
        id: String
        className: String
        classDesc: String
        teacherName: String
        classStartDate: Date
        classEndDate: Date
        classImage: String
        classVideo: String
        classTags: [String]
        milestones: [Milestone]
        teacherOptions: [String]
        studentOptions: [String]
        studentNumbers: Int
        status: Boolean
        chatroomId: String
        classMembers: [UserInfo]
    }

    type Message {
        time: String
        from: String
        message: String
    }

    type Messages {
        messages: [Message]
    }

    input MilestoneData {
        milestone: String
        milestoneDesc: String
        autoTest: String
        passed: Boolean
    }

    input InputData {
        ownerId: String
        className: String
        classDesc: String
        teacherName: String
        classStartDate: Date
        classEndDate: Date
        classImage: String
        classVideo: String
        classTags: [String]
        milestones: [MilestoneData]
        teacherOptions: [String]
        studentOptions: [String]
        studentNumbers: Int
        status: Boolean
    }

    type Query {
        class(classId: String!): Class
        milestones(userClassId: String!, userId: String!): [Milestone]
        getMessages(chatroomId: String!): [Message]
    }

    type Mutation {
        createClass(data: InputData!): Class
        buyClass(classId: String!): Boolean
    }
`;

export {
    typeDefs
};