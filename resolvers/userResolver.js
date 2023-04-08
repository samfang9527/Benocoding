
import jwt from "jsonwebtoken";
import { User } from "../models/database.js";
import {
    getUserDataByEmailAndPassword
} from "../models/userModel.js";

function validateUsername(username) {
    return 2 <= username.length <= 16;
}

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
}

function validatePassword(password) {
    return 8 <= username.length <= 20;
}

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
            try {
                const { email, password } = args.data;
                if ( validateEmail(email) && validatePassword(password) ) {
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
                }
                return;
            } catch (err) {
                console.error(err);
            }
        },
        signup: async (root, args, context) => {
            try {
                const { username, email, password } = args.data;
                if ( validateUsername(username) && validateEmail(email) && validatePassword(password) ) {
                    const result = await User.create( { username, email, password } );
                    if ( result ) {
                        const payload = {
                            userId: result._id,
                            username: result.username
                        }
                        const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "7d" });
                        return {
                            "jwt": token
                        }
                    }
                }
                return;
            } catch (err) {
                console.error(err);
            }
        }
    }
};

export {
    resolvers
};