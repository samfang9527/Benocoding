
import jwt from "jsonwebtoken";
import { DB, UserClassInfo, ClassInfo, Chatroom } from "../models/database.js";
import { PAGELIMIT, HOME_PAGELIMIT } from "../constant.js";
import axios from "axios";
import escapeStringRegexp from "escape-string-regexp";
import { jwtValidation } from "../utils/util.js";

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

function generateResponseObj(statusCode, message) {
    return {
        statusCode,
        responseMessage: message
    }
}

const resolvers = {
    Query: {
        class: async (_, args, context) => {
            const { classId } = args;
            if ( !classId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                const info = await getClass(classId);
                return {
                    ...info,
                    response: generateResponseObj(200, "ok")
                };
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        milestones: async (_, args, context) => {
            const { classId, userId } = args;
            if ( !classId || !userId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                const [ info ] = await getUserClassData(classId, userId);
                if ( !info ) {
                    return { response: generateResponseObj(200, "No matched data") }
                }

                return {
                    response: generateResponseObj(200, "ok"),
                    milestones: info.milestones
                }

            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getMessages: async (_, args, context) => {
            const { chatroomId } = args;
            if ( !chatroomId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                const data = await Chatroom.findById(chatroomId);
                if ( !data ) {
                    return { response: generateResponseObj(200, "No matched data") }
                }

                return {
                    response: generateResponseObj(200, "ok"),
                    messages: data.messages
                }

            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getClassList: async (_, args, context) => {
            const { pageNum, keyword } = args;
            if ( !pageNum ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            const filter = {}
            if ( keyword ) {
                const regex = new RegExp(`.*${escapeStringRegexp(keyword)}.*`, "i");
                filter.className = regex;
            }
            
            // calculate page range
            const offset = pageNum * HOME_PAGELIMIT;

            // get all class data
            try {
                const classData = await ClassInfo.find(filter)
                .skip(offset)
                .limit(PAGELIMIT)
                .exec();

                return {
                    ...classData,
                    response: generateResponseObj(200, "ok")
                };

            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getRandomClasses: async (_, args, context) => {
            try {
                const data = await ClassInfo.aggregate([{$sample: {size: 3}}]);
                const newData = data.map((ele) => {
                    return {
                        ...ele,
                        id: ele._id
                    }
                })
                return {
                    response: generateResponseObj(200, "ok"),
                    classList: newData
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getAllPageNums: async (_, args, context) => {
            try {
                const allPagnNums = await ClassInfo.find().countDocuments();
                return {
                    response: generateResponseObj(200, "ok"),
                    number: Math.ceil(allPagnNums / HOME_PAGELIMIT)
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getLearnerClassNums: async (_, args, context) => {
            try {
                const { userId } = args;
                const userClassNums = await UserClassInfo.find({
                    userId: userId
                })
                .countDocuments();
    
                return {
                    response: generateResponseObj(200, "ok"),
                    number: Math.ceil(userClassNums / PAGELIMIT)
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getLearnerClassList: async (_, args, context) => {
            const { userId, pageNum } = args;
            if ( !userId || !pageNum ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                // calculate page range
                const offset = pageNum * PAGELIMIT;
                const responseData = await ClassInfo.find({
                    ownerId: { $ne: userId }, // userId 不等於 ownerId
                    classMembers: { $elemMatch: { userId: userId } } // classMembers 陣列內包含 userId 的物件
                })
                .skip(offset)
                .limit(PAGELIMIT)
                .exec();

                return {
                    response: generateResponseObj(200, "ok"),
                    classList: responseData
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
            
        },
        getCreaterClassNums: async (_, args, context) => {
            const { userId } = args;
            if ( !userId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                // get all class data
                const classNums = await ClassInfo.find({
                    ownerId: userId,
                })
                .countDocuments();
                return {
                    response: generateResponseObj(200, "ok"),
                    number: Math.ceil(classNums / PAGELIMIT)
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getCreaterClassList: async (_, args, context) => {
            const { userId, pageNum } = args;
            if ( !userId || !pageNum ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // calculate page range
            const offset = pageNum * PAGELIMIT;

            try {
                const classData = await ClassInfo.find({
                    ownerId: userId,
                })
                .skip(offset)
                .limit(PAGELIMIT)
                .exec();
                
                return {
                    response: generateResponseObj(200, "ok"),
                    classList: classData
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getAllPullRequests: async (_, args, context) => {
            const { userId, classId } = args;
            if ( !userId || !classId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }
            
            try {
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
                    return {
                        response: generateResponseObj(200, "ok"),
                        data: results
                    }
                }
                return { response: generateResponseObj(403, "Forbidden") }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getPRDetail: async (_, args, context) => {
            const { userId, classId, number } = args;
            if ( !userId || !classId || !number ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }
            
            try {
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
                            response: generateResponseObj(200, "ok"),
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
                return { response: generateResponseObj(403, "Forbidden") }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        }
    },
    Mutation: {
        createClass: async (_, args, context) => {
            const { data } = args;
            const { token } = context;
            if ( !data || !token ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            const teacherOptions = ["class info", "members", "chatroom", "pull request", "settings"];
            const studentOptions = ["class info", "members", "chatroom", "milestones"];
            const studentNumbers = 0;
            const status = false;

            // verify jwt
            const userData = jwtValidation(token);
            if ( Object.keys(userData).length === 0 ) {
                return { response: generateResponseObj(401, "Authentication failed") }
            }

            // bind other infos to data
            const newData = {
                ...data,
                teacherOptions,
                studentOptions,
                studentNumbers,
                status
            }

            // start transaction
            const session = await DB.startSession();
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

                    return {
                        ...newData,
                        response: generateResponseObj(200, "ok")
                    }

                } catch (err) {
                    console.error(err);
                    await session.abortTransaction();
                    return { response: generateResponseObj(500, "Internal Server Error") }
                } finally {
                    await session.endSession();
                }
            })
        },
        buyClass: async (_, args, context) => {
            const { classId } = args;
            if ( !classId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // verify jwt
            const userData = jwtValidation(token);
            if ( Object.keys(userData).length === 0 ) {
                return { response: generateResponseObj(401, "Authentication failed") }
            }
            console.log('userData', userData);

            // check if already buy this class
            const classInfo = await getClass(classId);
            for ( let i = 0; i < classInfo.classMembers; i++) {
                if ( classInfo.classMembers[i].userId === userData.userId ) {
                    return generateResponseObj(409, "Already bought the class")
                }
            }

            // start transaction
            const session = await DB.startSession();
            await session.withTransaction(async () => {
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

                    await session.commitTransaction();
                    return generateResponseObj(200, "ok")
                    
                } catch (err) {
                    await session.abortTransaction();
                    return { response: generateResponseObj(500, "Internal Server Error") }
                } finally {
                    await session.endSession();
                }
            })
        }
    }
};

export {
    resolvers
};