
import { getClassList } from "../models/classModel.js";

const resolvers = {
    Query: {
        classes: async () => {
            const infos = await getClassList();
            return infos;
        }
    }
};

export {
    resolvers
};