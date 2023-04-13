
import jwt from "jsonwebtoken";
import { DB, UserClassInfo, ClassInfo, Chatroom } from "../models/database.js";
import { PAGELIMIT } from "../constant.js";

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
        },
        getMessages: async (_, args, context) => {
            const { chatroomId } = args;
            const data = await Chatroom.findById(chatroomId);
            return data.messages;
        },
        getLearnerClassNums: async (_, args, context) => {
            const { userId } = args;
            const userClassNums = await UserClassInfo.find({
                userId: userId
            })
            .countDocuments();

            return Math.ceil(userClassNums / PAGELIMIT);

        },
        getLearnerClassList: async (_, args, context) => {
            const { userId, pageNum } = args;

            // calculate page range
            const offset = pageNum * PAGELIMIT;

            // see how many class the user have
            const userClassData = await UserClassInfo.find({
                userId: userId
            })
            .select('classId')
            .exec();

            // get all class datas and return
            const responseData = await Promise.all(userClassData.map(async (ele) => {
                const { classId } = ele;
                const [ classData ] = await ClassInfo.find({
                    _id: classId,
                    ownerId: { $ne: userId }
                })
                .skip(offset)
                .limit(PAGELIMIT)
                .exec();
                return classData;
            }));
            return responseData;
        },
        getCreaterClassNums: async (_, args, context, info) => {
            const { userId } = args;

            // get all class data
            const classNums = await ClassInfo.find({
                ownerId: userId,
            })
            .countDocuments();
            return Math.ceil(classNums / PAGELIMIT);
        },
        getCreaterClassList: async (_, args, context, info) => {
            const { userId, pageNum } = args;

            // calculate page range
            const offset = pageNum * PAGELIMIT;

            // get all class data
            const classData = await ClassInfo.find({
                ownerId: userId,
            })
            .skip(offset)
            .limit(PAGELIMIT)
            .exec();
            
            return classData;
        }
    },
    Mutation: {
        createClass: async (_, args, context) => {
            const { data } = args;
            const teacherOptions = ["class info", "members", "chatroom", "pull request"];
            const studentOptions = ["class info", "members", "chatroom", "pull request", "milestones"];
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
                            classMembers: [userData]
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

            // check if already buy this class
            const classInfo = await getClass(classId);
            for ( let i = 0; i < classInfo.classMembers; i++) {
                if ( classInfo.classMembers[i].userId === userData.userId ) {
                    return false;
                }
            }

            const session = await DB.startSession();
            try {
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
                });
                return true;
                
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