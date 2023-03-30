import mongoose from "mongoose";

const classSchema = mongoose.Schema({
    className: {
        type: String,
        required: [true, 'className is required'],
        minLength: [1, 'classname can\'t be smaller than 1 characters'],
        maxLength: [16, 'classname can\'t be greater than 16 characters']
    },
    teacherName: {
        type: [String],
        required: [true, 'teacherName is required'],
        default: []
    },
    classDesc: {
        type: String,
        maxLength: [128, 'class description can\'t be greater than 128 characters']
    },
    classTags: {
        type: [String],
        default: []
    },
    maxStudentsNumber: {
        type: Number
    },
    minStudentsNumber: {
        type: Number
    },
    classStartDate: Date,
    classEndDate: Date,
    classMilestones: [{
        milestone: {
            type: String,
            minLength: [1, 'milestone can\'t be smaller than 1 characters'],
            maxLength: [16, 'milestone can\'t be greater than 16 characters']
        },
        milestoneDesc: {
            type: String,
            maxLength: [128, 'milestone description can\'t be greater than 128 characters']
        },
        passed: {
            type: Boolean,
            default: false
        },
        milestoneAutoTestCode: String
    }]

}, { collection: 'class' } );

export { classSchema };