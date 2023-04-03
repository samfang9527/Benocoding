
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
    }

    type Class {
        id: String
        className: String
        classDesc: String
        teacherName: String
        classStartDate: Date
        classEndDate: Date
        classImage: String
        classTags: [String]
        milestones: [Milestone]
        classTeacherOptions: [String]
        classStudentOptions: [String]
    }

    type Query {
        classes: [Class],
        class(classId: String!): Class
    }
`;

export {
    typeDefs
};