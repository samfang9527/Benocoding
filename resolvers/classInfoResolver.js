
import { DB } from "../models/database.js";

import {
    addUserClass
} from "../models/userModel.js";

import {
    getClass,
    createClassInfo
} from "../models/classModel.js";

import {
    createChatroom
} from "../models/chatroomModel.js";

import {
    createUserClassInfo
} from "../models/userClassModel.js";

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
            const teacherOptions = ["class info", "class setting", "student list", "chatroom", "pull request"];
            const studentOptions = ["class info", "student list", "chatroom", "pull request", "homework"];
            const studentNumbers = 0;
            const status = false;

            const newData = {
                ...data,
                teacherOptions,
                studentOptions,
                studentNumbers,
                status
            }
            console.log('newData', newData);

            const session = await DB.startSession();
            try {
                await session.withTransaction(async () => {

                    // create general class info
                    const classResult = await createClassInfo(newData);
                    console.log('classResult', classResult);

                    // create chatroom
                    const chatroomResult = await createChatroom({
                        messages: [],
                        classId: classResult._id,
                        ownerId: classResult.ownerId,
                        members: [classResult.ownerId]
                    })
                    console.log('chatroomResult', chatroomResult);

                    // create user class info
                    const userClassInfoData = {
                        ...data,
                        userId: classResult.ownerId,
                        classId: classResult._id,
                        chatroomId: chatroomResult._id,
                        ownerId: classResult.ownerId,
                        teacherOptions
                    }
                    const userClassInfoResult = await createUserClassInfo(userClassInfoData);
                    console.log('userClassInfoResult', userClassInfoResult);

                    // update user info
                    const classData = {
                        classId: classResult._id,
                        className: classResult.className,
                        role: "teacher",
                        githubAccessToken: process.env.GITHUB_ACCESS_TOKEN
                    }
                    const userResult = await addUserClass(newData.ownerId, classData, newData.classTags);
                    console.log('userResult', userResult);
                })
                
                return newData;

            } catch (err) {
                console.error(err);
            } finally {
                await session.endSession();
            }
        }
    }
};

export {
    resolvers
};