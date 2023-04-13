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
            statusCode: String
        }]
    }]
}, { collection: 'userClassInfos' } );

export { userClassInfoSchema };
