
import jwt from "jsonwebtoken";
import { DB, UserClassInfo, ClassInfo, Chatroom } from "../models/database.js";
import { PAGELIMIT, HOME_PAGELIMIT } from "../constant.js";
import axios from "axios";
import escapeStringRegexp from "escape-string-regexp";

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
import e from "express";

const resolvers = {
    Query: {
        class: async (_, args, context) => {
            const { classId } = args;
            const info = await getClass(classId);
            return info;
        },
        milestones: async (_, args, context) => {
            const { classId, userId } = args;
            const [ info ] = await getUserClassData(classId, userId);
            return info.milestones;
        },
        getMessages: async (_, args, context) => {
            const { chatroomId } = args;
            const data = await Chatroom.findById(chatroomId);
            return data.messages;
        },
        getClassList: async (_, args, context) => {
            const { pageNum, keyword } = args;

            const filter = {}
            if ( keyword ) {
                const regex = new RegExp(`.*${escapeStringRegexp(keyword)}.*`, "i");
                filter.className = regex;
            }
            
            // calculate page range
            const offset = pageNum * HOME_PAGELIMIT;

            // get all class data
            const classData = await ClassInfo.find(filter)
            .skip(offset)
            .limit(PAGELIMIT)
            .exec();
            return classData;
        },
        getRandomClasses: async (_, args, context) => {
            const data = await ClassInfo.aggregate([{$sample: {size: 3}}]);
            const newData = data.map((ele) => {
                return {
                    ...ele,
                    id: ele._id
                }
            })
            return newData;
        },
        getAllPageNums: async (_, args, context) => {
            // get all class data
            const allPagnNums = await ClassInfo.find().countDocuments();

            return Math.ceil(allPagnNums / HOME_PAGELIMIT);
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
            const responseData = await ClassInfo.find({
                ownerId: { $ne: userId }, // userId 不等於 ownerId
                classMembers: { $elemMatch: { userId: userId } } // classMembers 陣列內包含 userId 的物件
            })
            .skip(offset)
            .limit(PAGELIMIT)
            .exec();

            return responseData;
        },
        getCreaterClassNums: async (_, args, context) => {
            const { userId } = args;

            // get all class data
            const classNums = await ClassInfo.find({
                ownerId: userId,
            })
            .countDocuments();
            return Math.ceil(classNums / PAGELIMIT);
        },
        getCreaterClassList: async (_, args, context) => {
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
        },
        getAllPullRequests: async (_, args, context) => {
            const { userId, classId } = args;
            
            const gitHubData = await ClassInfo.findById(classId);
            const { ownerId, gitHub } = gitHubData;
            if ( ownerId === userId ) {
                const { data } = await axios.get(
                    `https://api.github.com/repos/${gitHub.owner}/${gitHub.repo}/pulls`,
                    {
                        headers: {
                            'Authorization': `token ${gitHub.accessToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                )

                const results = data.map((pr) => {
                        return {
                            number: pr.number,
                            title: pr.title,
                            body: pr.body,
                            created_at: pr.created_at,
                            updated_at: pr.updated_at,
                            head: pr.head.label,
                            base: pr.base.label,
                            url: pr.url
                        }
                    }
                )
                return results;
            }
            return [];
        },
        getPRDetail: async (_, args, context) => {
            const { userId, classId, number } = args;
            
            const gitHubData = await ClassInfo.findById(classId);
            const { ownerId, gitHub } = gitHubData;
            if ( ownerId === userId ) {
                try {
                    const { data } = await axios.get(
                        `https://api.github.com/repos/${gitHub.owner}/${gitHub.repo}/pulls/${number}`,
                        {
                            headers: {
                                'Authorization': `token ${gitHub.accessToken}`,
                                'Accept': 'application/vnd.github.v3+json'
                            }
                        }
                    )
    
                    const diffData = await axios.get(
                        `https://api.github.com/repos/${gitHub.owner}/${gitHub.repo}/pulls/${number}.diff?diff_filter=exclude:package-lock.json`,
                        {
                            headers: {
                                'Authorization': `token ${gitHub.accessToken}`,
                                'Accept': 'application/vnd.github.v3.diff'
                            }
                        }
                    )
                    
                    const diffLines = diffData.data.split('\n');
                    // exclude changes on package-lock.json
                    const newDiffLines = [];
                    let jump = false;
                    for ( let i = 0; i < diffLines.length; i++ ) {
                        const line = diffLines[i];
                        if ( line.includes('diff') ) {
                            if ( line.includes('package-lock.json') ) {
                                jump = true;
                            } else {
                                jump = false;
                            }  
                        }
                        if ( !jump ) {
                            newDiffLines.push(line);
                        }
                    }
                    
                    return {
                        body: data.body,
                        html_url: data.html_url,
                        state: data.state,
                        merge_commit_sha: data.merge_commit_sha,
                        commits: data.commits,
                        additions: data.additions,
                        deletions: data.deletions,
                        mergeable: data.mergeable,
                        diffData: newDiffLines.join('\n')
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
    },
    Mutation: {
        createClass: async (_, args, context) => {
            const { data } = args;
            const teacherOptions = ["class info", "members", "chatroom", "pull request", "settings"];
            const studentOptions = ["class info", "members", "chatroom", "milestones"];
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

            // bind other infos to data
            const newData = {
                ...data,
                teacherOptions,
                studentOptions,
                studentNumbers,
                status
            }

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

                        // create general class info
                        const classResult = await createClassInfo({
                            ...newData,
                            chatroomId: chatroomResult._id,
                            classMembers: [userData]
                        });

                        // create user class info
                        const userClassInfoData = {
                            userId: userData.userId,
                            classId: classResult._id,
                            milestones: newData.milestones
                        }
                        const userClassInfoResult = await createUserClassInfo(userClassInfoData);

                        // update user info
                        const classData = {
                            classId: classResult._id,
                            userClassId: userClassInfoResult._id,
                            className: classResult.className,
                            role: "teacher",
                            githubAccessToken: process.env.GITHUB_ACCESS_TOKEN
                        }
                        await addUserClass(newData.ownerId, classData, newData.classTags);

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
                return {
                    status: 401,
                    responseMessage: "Authentication failed"
                };
            }
            console.log('userData', userData);

            // check if already buy this class
            const classInfo = await getClass(classId);
            for ( let i = 0; i < classInfo.classMembers; i++) {
                if ( classInfo.classMembers[i].userId === userData.userId ) {
                    return {
                        status: 409,
                        responseMessage: "Already bought the class"
                    };
                }
            }

            try {
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
                return {
                    status: 200,
                    responseMessage: "Successful"
                };
                
            } catch (err) {
                console.error(err);
                return {
                    status: 501,
                    responseMessage: "Error creating data"
                };
            }
        }
    }
};

export {
    resolvers
};