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
            type: String,
            maxLength: [128, 'milestone description can\'t be greater than 128 characters']
        },
        video: String,
        autoTest: String,
        passed: Boolean
    }]
}, { collection: 'userClassInfos' } );

export { userClassInfoSchema };
