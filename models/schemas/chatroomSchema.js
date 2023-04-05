import mongoose from "mongoose";

const chatroomSchema = mongoose.Schema({
    messages: [{
        time: {
            type: Date,
            required: [true, 'time is required']
        },
        from: {
            type: String,
            required: [true, 'from userId is required']
        },
        message: String
    }],
    classId: String,
    ownerId: String,
    members: [String]
}, { collection: 'chatrooms' });

export { chatroomSchema };
