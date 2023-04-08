
import jwt from "jsonwebtoken";
import { User } from "../models/database.js";
import {
    getUserDataByEmailAndPassword
} from "../models/userModel.js";

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
        signin: async (_, args, context) => {
            const { email, password } = args.data;
            const data = await getUserDataByEmailAndPassword(email, password);

            if ( data ) {
                const payload = {
                    userId: data._id,
                    username: data.username
                }
                const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "7d" });
                return {
                    "jwt": token
                }
            }
            return;
        },
        signup: async (root, args, context) => {
            const { username, email, password } = args;
            const result = await User.create( { username, email, password } );
            return result;
        }
    }
};

export {
    resolvers
};