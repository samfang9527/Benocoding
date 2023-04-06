import mongoose from "mongoose";

const userClassInfoSchema = mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'userId is required']
    },
    classId: {
        type: String,
        required: [true, 'classId is required']
    },
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
    studentOptions: [String]
}, { collection: 'userClassInfos' } );

export { userClassInfoSchema };
