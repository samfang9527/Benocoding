
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
    type Response {
        statusCode: Int
        responseMessage: String
    }

    type TestCase {
        id: Int
        case: String
        inputs: [String]
        result: String
        method: String
        statusCode: String
    }

    type MilestoneResponse {
        response: Response
        milestones: [Milestone]
    }

    type Milestone {
        milestone: String
        milestoneDesc: String
        autoTest: Boolean
        passed: Boolean
        functionTest: Boolean
        functionName: String
        functionTemplate: String
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
        response: Response
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
        price: Int
    }

    type ClassListResponse {
        response: Response
        classList: [Class]
        maxPageNum: Int
    }

    type UserClass {
        classId: String
        classImage: String
        className: String
        classDesc: String
        teacherName: String
        classStartDate: Date
    }

    type UserClassListResponse {
        response: Response
        classList: [UserClass]
        maxPageNum: Int
    }

    type MessageResponse {
        response: Response
        messages: [Message]
    }

    type Message {
        time: String
        from: String
        message: String
    }

    type Messages {
        messages: [Message]
    }

    type GeneralPRResponse {
        response: Response
        data: [GeneralPRData]
    }

    type GeneralPRData {
        number: Int
        title: String
        body: String
        created_at: String
        updated_at: String
        head: String
        base: String
        url: String
    }

    type DetailPRData {
        response: Response
        body: String
        html_url: String
        state: String
        merge_commit_sha: String
        commits: Int
        additions: Int
        deletions: Int
        mergeable: String
        diffData: String
    }

    type UpdateResponse {
        response: Response
        className: String
        classDesc: String
        classStartDate: Date
        classEndDate: Date
        classImage: String
        classVideo: String
    }

    input TestCaseData {
        id: Int
        case: String
        inputs: [String]
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
        functionTemplate: String
        testCases: [TestCaseData]
    }

    input GithubData {
        repo: String
        owner: String
        accessToken: String
    }

    input InputData {
        price: Int
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
        gitHub: GithubData
    }

    input UpdateData {
        className: String
        classDesc: String
        classStartDate: Date
        classEndDate: Date
        classImage: String
        classVideo: String
    }

    type Query {
        class(classId: String!): Class
        milestones(classId: String!, userId: String!): MilestoneResponse
        getMessages(chatroomId: String!): MessageResponse
        getClassList(pageNum: Int!, keyword: String): ClassListResponse
        getRandomClasses: ClassListResponse
        getLearnerClassList(userId: String!, pageNum: Int!): UserClassListResponse
        getCreaterClassList(userId: String!, pageNum: Int!): UserClassListResponse
        getAllPullRequests(userId: String!, classId: String!): GeneralPRResponse
        getPRDetail(userId: String!, classId: String!, number: Int!) : DetailPRData
    }

    type Mutation {
        createClass(data: InputData!): Class
        buyClass(prime: String!, classId: String!): Class
        updateClass(data: UpdateData!, classId: String!): UpdateResponse
    }
`;

export {
    typeDefs
};