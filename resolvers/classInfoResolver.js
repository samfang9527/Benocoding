
import {
    getClass,
    createClassInfo
} from "../models/classModel.js";

const resolvers = {
    Query: {
        class: async (_, args, context) => {
            const { classId } = args;
            const info = await getClass(classId);
            return info;
        }
    },
    Mutation: {
        createClass: async (_, args, context) => {
            const { data } = args;
            const result = await createClassInfo(data);
            return result;
        }
    }
};

export {
    resolvers
};