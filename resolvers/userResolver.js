
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/database.js";
import {
    getUserDataByEmail
} from "../models/userModel.js";
import { jwtValidation } from "../utils/util.js";

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
    return 8 <= password.length <= 20;
}

const resolvers = {
    Query: {
        me: async (_, { id }, context) => {
            const { token } = context;
            if ( !token ) {
                return {
                    statusCode: 400,
                    responseMessage: "No tokens"
                }
            }

            const result = jwtValidation(token);
            if ( Object.keys(result).length === 0 ) {
                return {
                    statusCode: 401,
                    responseMessage: "Authentication failed"
                }
            }

            try {
                const info = await User.findById(id);
                return {
                    ...info,
                    statusCode: 200,
                    responseMessage: "ok"
                };
            } catch (err) {
                console.error(err);
                return {
                    statusCode: 500,
                    responseMessage: "Internal Server Error"
                }
            }
        },
        jwtValidate: async (_, args, context) => {
            const { token } = context;
            if ( !token ) {
                return {
                    statusCode: 400,
                    responseMessage: "No tokens"
                }
            }

            const result = jwtValidation(token);
            if ( Object.keys(result).length === 0 ) {
                return {
                    statusCode: 401,
                    responseMessage: "Authentication failed"
                }
            }

            return {
                ...result,
                statusCode: 200,
                responseMessage: "ok"
            }
        }
    },
    Mutation: {
        signin: async (_, args, context) => {
            try {
                const { email, password } = args.data;
                if ( !email || !password ) {
                    return {
                        statusCode: 400,
                        responseMessage: "Missing required informations"
                    }
                }

                if ( !validateEmail(email) || !validatePassword(password) ) {
                    return {
                        statusCode: 400,
                        responseMessage: "Wrong input format"
                    }
                }

                const data = await getUserDataByEmail(email);
                if ( !data ) {
                    return {
                        statusCode: 401,
                        responseMessage: "Email not exists"
                    }
                }

                const hashedPassword = data.password;
                const passwordValid = await bcrypt.compare(password, hashedPassword);
                if ( !passwordValid ) {
                    return {
                        statusCode: 401,
                        responseMessage: "Wrong password"
                    }
                }

                const payload = {
                    userId: data._id,
                    username: data.username,
                    email: data.email
                }
                const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "7d" });
                return {
                    statusCode: 200,
                    responseMessage: "ok",
                    jwt: token
                }

            } catch (err) {
                console.error(err);
                return {
                    statusCode: 500,
                    responseMessage: "Internal Server Error"
                }
            }
        },
        signup: async (_, args, context) => {
            try {
                const { username, email, password } = args.data;
                if ( !username || !email || !password ) {
                    return {
                        statusCode: 400,
                        responseMessage: "Missing required informations"
                    }
                }

                if ( !validateEmail(email) || !validatePassword(password) ) {
                    return {
                        statusCode: 400,
                        responseMessage: "Wrong input format"
                    }
                }

                const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS));
                const result = await User.create( { username, email, password: hashedPassword } );
                const payload = {
                    userId: result._id,
                    username: result.username,
                    email: result.email
                }
                const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "7d" });
                return {
                    statusCode: 200,
                    responseMessage: "ok",
                    jwt: token
                }
            } catch (err) {
                console.error(err);
                return {
                    statusCode: 500,
                    responseMessage: "Internal Server Error"
                }
            }
        }
    }
};

export {
    resolvers
};