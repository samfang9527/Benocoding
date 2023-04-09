import mongoose from "mongoose";

const chatroomSchema = mongoose.Schema({
    messages: [{
        time: {
            type: String,
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
    members: [{
        userId: String,
        username: String,
        email: String
    }]
}, { collection: 'chatrooms' });

export { chatroomSchema };
