
import axios from "axios";
import dotenv from "dotenv";
import { DB, UserClassInfo, ClassInfo, Chatroom, User, Order } from "../models/database.js";
import { getClassCache, setClassCache, updateClassCache } from "../utils/cache.js";
import { PAGELIMIT, HOME_PAGELIMIT } from "../constant.js";
import escapeStringRegexp from "escape-string-regexp";
import { jwtValidation } from "../utils/util.js";
import { addCreatedClass, addboughtClass } from "../models/userModel.js";
import { createClassInfo, getClassInfo} from "../models/classModel.js";
import { createChatroom, addUserToChatroom } from "../models/chatroomModel.js";
import { getUserClassData } from "../models/userClassModel.js";

dotenv.config();

function generateResponseObj(statusCode, message) {
    return {
        statusCode,
        responseMessage: message
    }
}

const resolvers = {
    Query: {
        class: async (_, args) => {
            const { classId } = args;
            if ( !classId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                const cacheData = await getClassCache(classId);
                if ( cacheData !== '' ) {
                    const parsedCacheData = JSON.parse(cacheData);
                    parsedCacheData.id = parsedCacheData._id;     // Manually add id after JSON.stringify();
                    parsedCacheData.response = generateResponseObj(200, "ok");
                    return parsedCacheData;
                }

                const classInfo = await getClassInfo(classId);
                await setClassCache(classId, JSON.stringify(classInfo));
                classInfo.response = generateResponseObj(200, "ok");
                return classInfo;

            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        milestones: async (_, args) => {
            const { classId, userId } = args;
            if ( !classId || !userId ) {
                return {
                    response: generateResponseObj(400, "Missing required arguments"),
                    milestones: []
                }
            }

            try {
                const [ userClassData ] = await getUserClassData(classId, userId);
                if ( !userClassData ) {
                    return {
                        response: generateResponseObj(200, "No matched data"),
                        milestones: []
                    }
                }

                return {
                    response: generateResponseObj(200, "ok"),
                    milestones: userClassData.milestones
                }

            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getMessages: async (_, args) => {
            const { chatroomId } = args;
            if ( !chatroomId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            try {
                const chatroomData = await Chatroom.findById(chatroomId);
                if ( !chatroomData ) {
                    return { response: generateResponseObj(200, "No matched data") }
                }

                return {
                    response: generateResponseObj(200, "ok"),
                    messages: chatroomData.messages
                }

            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getClassList: async (_, args) => {
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
        getRandomClasses: async () => {
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
        getLearnerClassList: async (_, args) => {
            const { userId, pageNum } = args;
            if ( !userId || pageNum === undefined || pageNum === null ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // calculate page range
            const offset = pageNum * PAGELIMIT;

            try {
                const userData = await User.findById(userId);
                const { boughtClasses } = userData;
                const pagingClassList = boughtClasses.slice(offset, offset + PAGELIMIT);
                
                const classList = [];
                for ( let i = 0; i < pagingClassList.length; i++ ) {
                    const { classId } = pagingClassList[i];

                    // check cache
                    const cachedData = await getClassCache(classId);
                    if ( cachedData.length !== 0 ) {
                        // cache hit
                        classList.push(JSON.parse(cachedData));
                    } else {
                        // cache miss, get data from DB
                        const classData = await ClassInfo.findById(classId);
                        if ( classData ) {
                            classList.push(classData);
                        }
                    }
                }

                return {
                    response: generateResponseObj(200, "ok"),
                    classList: classList,
                    maxPageNum: Math.ceil(boughtClasses.length / PAGELIMIT)
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
            
        },
        getCreaterClassList: async (_, args) => {
            const { userId, pageNum } = args;
            if ( !userId || pageNum === undefined || pageNum === null ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }

            // calculate page range
            const offset = pageNum * PAGELIMIT;

            try {
                const userData = await User.findById(userId);
                const { createdClasses } = userData;
                const pagingClassList = createdClasses.slice(offset, offset + PAGELIMIT);

                const classList = [];
                for ( let i = 0; i < pagingClassList.length; i++ ) {
                    const { classId } = pagingClassList[i];

                    // check cache
                    const cachedData = await getClassCache(classId);
                    if ( cachedData.length !== 0 ) {
                        // cache hit
                        classList.push(JSON.parse(cachedData));
                    } else {
                        // cache miss, get data from DB
                        const classData = await ClassInfo.findById(classId);
                        if ( classData ) {
                            classList.push(classData);
                        }
                    }
                }
                
                return {
                    response: generateResponseObj(200, "ok"),
                    classList: classList,
                    maxPageNum: Math.ceil(createdClasses.length / PAGELIMIT)
                }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getAllPullRequests: async (_, args) => {
            const { userId, classId } = args;
            if ( !userId || !classId ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }
            
            try {
                const classData = await ClassInfo.findById(classId);
                const { ownerId, gitHub } = classData;
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

                    const gitHubData = data.map((pr) => {
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
                        data: gitHubData
                    }
                }
                return { response: generateResponseObj(403, "Forbidden") }
            } catch (err) {
                return { response: generateResponseObj(500, "Internal Server Error") }
            }
        },
        getPRDetail: async (_, args) => {
            const { userId, classId, number } = args;
            if ( !userId || !classId || !number ) {
                return { response: generateResponseObj(400, "Missing required arguments") }
            }
            
            try {
                const classData = await ClassInfo.findById(classId);
                const { ownerId, gitHub } = classData;
                if ( ownerId === userId ) {
                    try {
                        const prInfoPromise = axios.get(
                            `https://api.github.com/repos/${gitHub.owner}/${gitHub.repo}/pulls/${number}`,
                            {
                                headers: {
                                    'Authorization': `token ${gitHub.accessToken}`,
                                    'Accept': 'application/vnd.github.v3+json'
                                }
                            }
                        )
        
                        const diffDataPromise = axios.get(
                            `https://api.github.com/repos/${gitHub.owner}/${gitHub.repo}/pulls/${number}.diff?diff_filter=exclude:package-lock.json`,
                            {
                                headers: {
                                    'Authorization': `token ${gitHub.accessToken}`,
                                    'Accept': 'application/vnd.github.v3.diff'
                                }
                            }
                        )

                        const prDataResult = await Promise.all([prInfoPromise, diffDataPromise]);
                        const prInfo = prDataResult[0].data;
                        const diffLines = prDataResult[1].data.split('\n');

                        // exclude changes on package-lock.json
                        const newDiffLines = [];
                        for ( let i = 0; i < diffLines.length; i++ ) {
                            let skip = false;
                            const line = diffLines[i];
                            if ( line.includes('diff') && line.includes('package-lock.json') ) {
                                skip = true;
                            }
                            if ( !skip ) {
                                newDiffLines.push(line);
                            }
                        }
                        
                        return {
                            response: generateResponseObj(200, "ok"),
                            body: prInfo.body,
                            html_url: prInfo.html_url,
                            state: prInfo.state,
                            merge_commit_sha: prInfo.merge_commit_sha,
                            commits: prInfo.commits,
                            additions: prInfo.additions,
                            deletions: prInfo.deletions,
                            mergeable: prInfo.mergeable,
                            diffData: newDiffLines.join('\n')
                        }

                    } catch (err) {
                        console.error(err);
                        return { response: generateResponseObj(500, "Failed on fetching gitHub data") }
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

            const classInfo = await getClassInfo(classId);
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
                await UserClassInfo.create({
                    userId: userData.userId,
                    classId: classInfo._id,
                    milestones: classInfo.milestones
                })

                // Update user class
                const classData = {
                    classId: classInfo._id,
                    className: classInfo.className,
                    classImage: classInfo.classImage,
                    classDesc: classInfo.classDesc,
                    classStartDate: classInfo.classStartDate,
                    teacherName: classInfo.teacherName
                }
                await addboughtClass(userData.userId, classData, classInfo.classTags);

                // update chatroom
                await addUserToChatroom(classInfo.chatroomId, userData);

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