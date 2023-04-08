import mongoose from "mongoose";

const classInfoSchema = mongoose.Schema({
    ownerId: {
        type: String,
        required: [true, 'ownerId is required']
    },
    className: {
        type: String,
        required: [true, 'className is required'],
        minLength: [1, 'classname can\'t be smaller than 1 characters'],
        maxLength: [16, 'classname can\'t be greater than 16 characters']
    },
    classDesc: {
        type: String,
        maxLength: [128, 'class description can\'t be greater than 128 characters']
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
            type: String,
            maxLength: [128, 'milestone description can\'t be greater than 128 characters']
        },
        video: String,
        autoTest: String,
        passed: Boolean
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
    }]
}, { collection: 'classInfos' } );

export { classInfoSchema };