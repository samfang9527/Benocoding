
import { User } from "../models/database.js";

const resolvers = {
    Query: {
        me: async (_, { id }, context) => {
            const info = await User.findById(id);
            return info;
        },
        users: async () => {
            const infos = await User.find();
            return infos;
        }
    },
    Mutation: {
        addUser: async (root, args, context) => {
            const { username, email, password } = args;
            const result = await User.create( { username, email, password } );
            return result;
        },
        updateUsername: async (root, args, context) => {
            const { userId, newUsername } = args;
            const result = await User.findByIdAndUpdate(userId, { username: newUsername })
            return result;
        }
    }
};

export {
    resolvers
};