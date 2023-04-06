
import { DB } from "../models/database.js";

import {
    addUserClass
} from "../models/userModel.js";

import {
    createClassInfo
} from "../models/classModel.js";

import {
    createChatroom
} from "../models/chatroomModel.js";

import {
    createUserClassInfo,
    getUserClassData
} from "../models/userClassModel.js";

const resolvers = {
    Query: {
        class: async (_, args, context) => {
            const { classId } = args;
            const info = await getUserClassData(classId);
            return info;
        }
    },
    Mutation: {
        createClass: async (_, args, context) => {
            const { data } = args;
            const teacherOptions = ["class info", "student list", "chatroom", "pull request"];
            const studentOptions = ["class info", "student list", "chatroom", "pull request", "milestones", "homework"];
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

                    try {
                        // create chatroom
                        const chatroomResult = await createChatroom({
                            messages: [],
                            ownerId: newData.ownerId,
                            members: [newData.ownerId]
                        })
                        console.log('chatroomResult', chatroomResult);

                        // create general class info
                        const classResult = await createClassInfo({...newData});
                        console.log('classResult', classResult);

                        // create user class info
                        const userClassInfoData = {
                            ...data,
                            userId: classResult.ownerId,
                            classId: classResult._id,
                            ownerId: classResult.ownerId,
                            teacherOptions,
                            chatroomId: chatroomResult._id
                        }
                        const userClassInfoResult = await createUserClassInfo(userClassInfoData);
                        console.log('userClassInfoResult', userClassInfoResult);

                        // update user info
                        const classData = {
                            classId: userClassInfoResult._id,
                            className: classResult.className,
                            role: "teacher",
                            githubAccessToken: process.env.GITHUB_ACCESS_TOKEN
                        }
                        const userResult = await addUserClass(newData.ownerId, classData, newData.classTags);
                        console.log('userResult', userResult);

                        await session.commitTransaction();

                    } catch (err) {
                        console.error(err);
                        return await session.abortTransaction();
                    }
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