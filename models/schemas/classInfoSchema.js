import mongoose from "mongoose";

const classInfoSchema = mongoose.Schema({
    ownerId: {
        type: String,
        required: [true, 'ownerId is required']
    },
    className: {
        type: String,
        required: [true, 'className is required'],
        minLength: [1, 'classname can\'t be smaller than 1 characters']
    },
    classDesc: {
        type: String
    },
    teacherName: {
        type: String,
        required: [true, 'teacherName is required']
    },
    classStartDate: {
        type: Date,
        required: [true, 'start date is required']
    },
    classEndDate: {
        type: Date,
        required: [true, 'start date is required']
    },
    classImage: String,
    classVideo: String,
    classTags: {
        type: [String],
        default: []
    },
    milestones: [{
        milestone: {
            type: String,
            minLength: [1, 'milestone can\'t be smaller than 1 characters']
        },
        milestoneDesc: {
            type: String
        },
        autoTest: Boolean,
        functionTest: Boolean,
        passed: Boolean,
        functionName: String,
        testCases: [{
            case: String,
            inputs: String,
            result: String,
            method: String,
            statusCode: String,
        }]
    }],
    teacherOptions: [String],
    studentOptions: [String],
    studentNumbers: Number,
    status: Boolean,
    chatroomId: String,
    classMembers: [{
        userId: String,
        username: String,
        email: String,
    }],
    gitHub: {
        repo: String,
        owner: String,
        accessToken: String
    },
    price: Number
}, { collection: 'classInfos' } );

export { classInfoSchema };