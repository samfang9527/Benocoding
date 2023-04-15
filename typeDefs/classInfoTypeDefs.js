
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
    type TestCase {
        id: Int
        case: String
        inputs: String
        result: String
        method: String
        statusCode: String
    }

    type Milestone {
        milestone: String
        milestoneDesc: String
        autoTest: Boolean
        passed: Boolean
        functionTest: Boolean
        functionName: String
        testCases: [TestCase]
    }

    type UserInfo {
        userId: String
        username: String
        email: String
    }

    type Github {
        repo: String
        owner: String
        accessToken: String
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
        gitHub: Github
    }

    type Message {
        time: String
        from: String
        message: String
    }

    type Messages {
        messages: [Message]
    }

    input TestCaseData {
        id: Int
        case: String
        inputs: String
        result: String
        method: String
        statusCode: String
    }

    input MilestoneData {
        milestone: String
        milestoneDesc: String
        autoTest: Boolean
        passed: Boolean
        functionTest: Boolean
        functionName: String
        testCases: [TestCaseData]
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
        getLearnerClassList(userId: String!, pageNum: Int!): [Class]
        getCreaterClassList(userId: String!, pageNum: Int!): [Class]
        getLearnerClassNums(userId: String!): Int
        getCreaterClassNums(userId: String!): Int
    }

    type Mutation {
        createClass(data: InputData!): Class
        buyClass(classId: String!): Boolean
    }
`;

export {
    typeDefs
};