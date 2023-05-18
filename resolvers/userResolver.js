
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/database.js";
import { jwtValidation, generateResponseObj } from "../utils/util.js";
import dotenv from "dotenv";
import validator from "validator";

dotenv.config();

function validatePassword(password) {
    if ( !validator.isLength(password, { min: 8, max: 16 } ) ) {
        return false
    }
    
    const isValidPwd = validator.isStrongPassword(password, {
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    })
    return isValidPwd;
}

const resolvers = {
    Query: {
        me: async (_, { id }, context) => {
            const { token } = context;
            if ( !token ) {
                return generateResponseObj(400, "No tokens")
            }

            const result = jwtValidation(token);
            if ( Object.keys(result).length === 0 ) {
                return generateResponseObj(401, "Authentication failed")
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
                return generateResponseObj(500, "Internal Server Error")
            }
        },
        jwtValidate: async (_, args, context) => {
            const { token } = context;
            if ( !token ) {
                return generateResponseObj(400, "No tokens")
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
        signin: async (_, args) => {
            try {
                const { email, password } = args.data;
                if ( !email || !password ) {
                    return generateResponseObj(400, "Missing required informations")
                }

                if ( !validator.isEmail(email) || !validatePassword(password) ) {
                    return generateResponseObj(400, "Wrong input format")
                }

                const [ data ] = await User.find({ email: email })
                if ( !data ) {
                    return generateResponseObj(401, "Email not exists")
                }

                const hashedPassword = data.password;
                const passwordValid = await bcrypt.compare(password, hashedPassword);
                if ( !passwordValid ) {
                    return generateResponseObj(401, "Wrong password")
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
                return generateResponseObj(500, "Internal Server Error")
            }
        },
        signup: async (_, args) => {
            try {
                const { username, email, password } = args.data;
                if ( !username || !email || !password ) {
                    return generateResponseObj(400, "Missing required informations")
                }

                if ( !validator.isEmail(email) || !validatePassword(password) || !validator.isLength(username, {min: 2, max: 16}) ) {
                    return generateResponseObj(400, "Wrong input format")
                }

                const isEmailExist = await User.find({email: email});
                if ( isEmailExist.length !== 0 ) {
                    return generateResponseObj(400, "Email already exists")
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
                return generateResponseObj(500, "Internal Server Error")
            }
        }
    }
};

export {
    resolvers
};