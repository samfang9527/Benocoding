
import { DB, UserClassInfo, ClassInfo, Chatroom, User, Order } from "../models/database.js";
import { getClassCache, setClassCache, updateClassCache } from "../utils/cache.js";
import { PAGELIMIT, HOME_PAGELIMIT } from "../constant.js";
import escapeStringRegexp from "escape-string-regexp";
import { jwtValidation } from "../utils/util.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

import {
    addCreatedClass,
    addboughtClass
} from "../models/userModel.js";

import {
    createClassInfo,
    getClass
} from "../models/classModel.js";

import { createChatroom, addUserToChatroom } from "../models/chatroomModel.js";
import { getUserClassData } from "../models/userClassModel.js";

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
                const isCached = await getClassCache(classId);
                if ( isCached !== '' ) {
                    const info = JSON.parse(isCached);
                    info.id = info._id;     // Manually add id after JSON.stringify();
                    info.response = generateResponseObj(200, "ok");
                    console.log('cache hit!');
                    return info;
                }

                const info = await getClass(classId);
                await setClassCache(classId, JSON.stringify(info));
                info.response = generateResponseObj(200, "ok");
                return info;
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        milestones: async (_, args, context) => {
            const { classId, userId } = args;
            if ( !classId || !userId ) {
                return {
                    response: generateResponseObj(400, "Missing required arguments"),
                    milestones: []
                }
            }

            try {
                const [ info ] = await getUserClassData(classId, userId);
                if ( !info ) {
                    return {
                        response: generateResponseObj(200, "No matched data"),
                        milestones: []
                    }
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
            if ( pageNum === undefined || pageNum === null ) {
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
                .limit(HOME_PAGELIMIT)
                .exec();

                const allPageNums = await ClassInfo.find(filter).countDocuments();

                return {
                    classList: classData,
                    response: generateResponseObj(200, "ok"),
                    maxPageNum: Math.ceil(allPageNums / HOME_PAGELIMIT)
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
        getLearnerClassList: async (_, args, context) => {
            const { userId, pageNum } = args;
            if ( !userId || pageNum === undefined || pageNum === null ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                // calculate page range
                const offset = pageNum * PAGELIMIT;
                const responseData = await User.findById(userId);
                const { boughtClasses } = responseData;

                return {
                    response: generateResponseObj(200, "ok"),
                    classList: boughtClasses.slice(offset, offset + PAGELIMIT),
                    maxPageNum: Math.ceil(boughtClasses.length / PAGELIMIT)
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
            
        },
        getCreaterClassList: async (_, args, context) => {
            const { userId, pageNum } = args;
            if ( !userId || pageNum === undefined || pageNum === null ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // calculate page range
            const offset = pageNum * PAGELIMIT;

            try {
                const responseData = await User.findById(userId);
                const { createdClasses } = responseData;
                
                return {
                    response: generateResponseObj(200, "ok"),
                    classList: createdClasses.slice(offset, offset + PAGELIMIT),
                    maxPageNum: Math.ceil(createdClasses.length / PAGELIMIT)
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
                status,
                teacherName: userData.username
            }

            // start transaction
            const session = await DB.startSession();
            session.startTransaction()
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

                // update user info
                const classData = {
                    classId: classResult._id,
                    className: newData.className,
                    classImage: newData.classImage,
                    classDesc: newData.classDesc,
                    classStartDate: newData.classStartDate,
                    teacherName: newData.teacherName
                }
                await addCreatedClass(newData.ownerId, classData, newData.classTags);

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
        },
        buyClass: async (_, args, context) => {
            const { prime, classId} = args;
            const { token } = context;
            if ( !prime || !classId || !token ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // verify jwt
            const userData = jwtValidation(token);
            if ( Object.keys(userData).length === 0 ) {
                return { response: generateResponseObj(401, "Authentication failed") }
            }

            const classInfo = await getClass(classId);
            const { classMembers, ownerId } = classInfo;
            // check if is owner
            if ( ownerId === userData.userId ) {
                return {
                    response: generateResponseObj(400, "You can't buy your own class")
                }
            }

            // check if already buy this class
            for ( let i = 0; i < classMembers.length; i++) {
                if ( classMembers[i].userId === userData.userId ) {
                    return { response: generateResponseObj(400, "Already bought the class") }
                }
            }

            // start transaction
            const session = await DB.startSession();
            const transactionOptions = {
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
            };
            session.startTransaction(transactionOptions);
            try {
                // create order
                const orderData = {
                    username: userData.username,
                    userId: userData.userId,
                    orderStatus: "unpaid",
                    orderPrice: classInfo.price,
                    orderDetail: [
                        {
                            classId: classId,
                            className: classInfo.className,
                            createrId: classInfo.ownerId,
                            teacherName: classInfo.teacherName,
                            price: classInfo.price
                        }
                    ],
                    createdDate: new Date().toISOString(),
                    payment: "credit card"
                }
                const orderResult = await Order.create(orderData);

                // start payment
                const paymentResult = await axios({
                    method: 'post',
                    url: 'https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime',
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.TAPPAY_PARTNER_KEY
                    },
                    data: {
                        "prime": prime,
                        "partner_key": process.env.TAPPAY_PARTNER_KEY,
                        "merchant_id": process.env.TAPPAY_MERCHANT_ID,
                        "details": "TapPay Test",
                        "amount": classInfo.price,
                        "cardholder": {
                            "phone_number": "0900000000",
                            "name": userData.username,
                            "email": userData.email,
                        }
                    }
                });
                if ( paymentResult.data.status !== 0 ) {
                    return { response: generateResponseObj(500, paymentResult.data.msg) }
                }

                // update order status
                await Order.findByIdAndUpdate(orderResult._id, { orderStatus: "paid" })

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
                    classImage: classInfo.classImage,
                    classDesc: classInfo.classDesc,
                    classStartDate: classInfo.classStartDate,
                    teacherName: classInfo.teacherName
                }
                const userUpdatedResult = await addboughtClass(userData.userId, classData, classInfo.classTags);
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
                return { response: generateResponseObj(200, "ok") }
                
            } catch (err) {
                await session.abortTransaction();
                return { response: generateResponseObj(500, "Internal Server Error") }
            } finally {
                await session.endSession();
            }
        },
        updateClass: async (_, args, context) => {
            const { token } = context;
            const { data, classId } = args;

            // args check
            if ( !data || !token ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // verify jwt
            const userData = jwtValidation(token);
            if ( Object.keys(userData).length === 0 ) {
                return { response: generateResponseObj(401, "Authentication failed") }
            }

            try {
                // update class info
                const classData = await ClassInfo.findById(classId);
                if ( !classData ) {
                    return { response: generateResponseObj(400, "Wrong classId") }
                }

                if ( classData.ownerId !== userData.userId ) {
                    return { response: generateResponseObj(403, "Forbidden") }
                }

                await ClassInfo.updateOne(
                    { _id: classId, ownerId: userData.userId },
                    { $set: data },
                    { new: true }
                )

                const { milestones } = data;
                if ( milestones ) {
                    // update user class info
                    await UserClassInfo.updateMany(
                        {classId: classId},
                        {milestones: milestones}
                    )
                }

                // update cache
                const newClassData = await ClassInfo.findById(classId);
                await updateClassCache(classId, JSON.stringify(newClassData));
                
                return {
                    response: generateResponseObj(200, "updated")
                }
            } catch (err) {
                console.error(err);
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        }
    }
};

export {
    resolvers
};