
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/database.js";
import {
    getUserDataByEmail
} from "../models/userModel.js";
import { jwtValidation } from "../utils/util.js";
import dotenv from "dotenv";
import validator from "validator";

dotenv.config();

function validatePassword(password) {
    if ( !validator.isLength(password, { min: 8, max: 16 } ) ) {
        return false
    }
    return true;
    // const isValidPwd = validator.isStrongPassword(password, {
    //     minLowercase: 1,
    //     minUppercase: 1,
    //     minNumbers: 1,
    //     minSymbols: 0,
    // })
    // return isValidPwd;
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
                    id: info._id,
                    username: info.username,
                    email: info.username,
                    tags: info.tags,
                    lastChatroomConnectTime: info.lastChatroomConnectTime,
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

                if ( !validator.isEmail(email) || !validatePassword(password) ) {
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

                if ( !validator.isEmail(email) || !validatePassword(password) || !validator.isLength(username, {min: 2, max: 16}) ) {
                    return {
                        statusCode: 400,
                        responseMessage: "Wrong input format"
                    }
                }

                const isEmailExist = await User.find({email: email});
                if ( isEmailExist.length !== 0 ) {
                    return {
                        statusCode: 400,
                        responseMessage: "Email already exists"
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