
import jwt from "jsonwebtoken";
import { DB, UserClassInfo, ClassInfo } from "../models/database.js";

import {
    addUserClass
} from "../models/userModel.js";

import {
    createClassInfo,
    getClass
} from "../models/classModel.js";

import {
    addUserToChatroom,
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
            const info = await getClass(classId);
            return info;
        },
        milestones: async (_, args, context) => {
            const { userClassId, userId } = args;
            const [ info ] = await getUserClassData(userClassId, userId);
            return info.milestones;
        }
    },
    Mutation: {
        createClass: async (_, args, context) => {
            const { data } = args;
            const teacherOptions = ["class info", "members", "chatroom", "pull request"];
            const studentOptions = ["class info", "members", "chatroom", "pull request", "milestones", "homework"];
            const studentNumbers = 0;
            const status = false;

            // verify jwt
            let userData;
            try {
                const { token } = context;
                userData = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
            } catch (err) {
                console.error(err);
                return;
            }
            console.log('userData', userData);

            // bind other infos to data
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
                            members: [userData]
                        })
                        console.log('chatroomResult', chatroomResult);

                        // create general class info
                        const classResult = await createClassInfo({
                            ...newData,
                            chatroomId: chatroomResult._id,
                            classMembers: []
                        });
                        console.log('classResult', classResult);

                        // create user class info
                        const userClassInfoData = {
                            userId: userData.userId,
                            classId: classResult._id,
                            milestones: newData.milestones
                        }
                        const userClassInfoResult = await createUserClassInfo(userClassInfoData);
                        console.log('userClassInfoResult', userClassInfoResult);

                        // update user info
                        const classData = {
                            classId: classResult._id,
                            userClassId: userClassInfoResult._id,
                            className: classResult.className,
                            role: "teacher",
                            githubAccessToken: process.env.GITHUB_ACCESS_TOKEN
                        }
                        const userResult = await addUserClass(newData.ownerId, classData, newData.classTags);
                        console.log('userResult', userResult);

                        await session.commitTransaction();

                    } catch (err) {
                        console.error(err);
                        await session.abortTransaction();
                    }
                })
                return newData;
            } catch (err) {
                console.error(err);
            } finally {
                await session.endSession();
            }
        },
        buyClass: async (_, args, context) => {
            const { classId } = args;

            // verify jwt
            let userData;
            try {
                const { token } = context;
                userData = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
            } catch (err) {
                console.error(err);
                return;
            }
            console.log('userData', userData);

            const session = await DB.startSession();
            try {

                const classInfo = await getClass(classId);

                await session.withTransaction(async () => {
                    // create userClass data
                    const userClassResult = await UserClassInfo.create({
                        userId: userData.userId,
                        classId: classInfo._id,
                        milestones: classInfo.milestones
                    })
                    console.log('userClassResult', userClassResult);

                    // Update user class
                    const classData = {
                        classId: classInfo._id,
                        className: classInfo.className,
                        role: 'student',
                        githubAccessToken: process.env.GITHUB_ACCESS_TOKEN
                    }
                    const userUpdatedResult = await addUserClass(userData.userId, classData, classInfo.classTags);
                    console.log('userUpdatedResult', userUpdatedResult);

                    // update chatroom
                    const chatroomResult = await addUserToChatroom(classInfo.chatroomId, userData);
                    console.log('chatroomResult', chatroomResult);

                    // update class student number
                    await ClassInfo.findByIdAndUpdate(classId, {
                        $inc: {"studentNumbers": 1},
                        $push: {"classMembers": userData}
                    });

                    await session.commitTransaction();

                    return true;
                });
                
            } catch (err) {
                console.error(err);
                await session.abortTransaction();
                return false;
            } finally {
                await session.endSession();
            }
        }
    }
};

export {
    resolvers
};