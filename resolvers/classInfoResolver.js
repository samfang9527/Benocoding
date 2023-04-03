
import {
    getClass
} from "../models/classModel.js";

const resolvers = {
    Query: {
        class: async (_, args, context) => {
            const { classId } = args;
            const info = await getClass(classId);
            return info;
        }
    }
};

export {
    resolvers
};