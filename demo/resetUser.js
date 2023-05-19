
import { initMongoDB, User, ClassInfo, UserClassInfo } from "../models/database.js";
import dotenv from "dotenv";

dotenv.config();

initMongoDB();

const { DEMO_USER_ID, DEMO_RESERVED_CLASS_ID } = process.env;

// clear createdClasses
async function clearCreatedClasses() {
    try {
        const { createdClasses } = await User.findById(DEMO_USER_ID);
        const deletePromises = createdClasses.map((classData) => {
            return ClassInfo.deleteOne({_id: classData.classId})
        })
        return await Promise.all(deletePromises)
    } catch (error) {
        return error;
    }
}

// clear userClassInfo
async function clearUserClassInfo() {
    try {
        const classData = await ClassInfo.findById(DEMO_RESERVED_CLASS_ID);
        await UserClassInfo.findOneAndUpdate({userId: DEMO_USER_ID, classId: DEMO_RESERVED_CLASS_ID}, {milestones: classData.milestones});
        await UserClassInfo.deleteMany({userId: DEMO_USER_ID, classId: {$ne: DEMO_RESERVED_CLASS_ID} });
    } catch (error) {
        return error;
    }
}

// reset user
async function resetUser() {
    try {
        const { boughtClasses } = await User.findById(DEMO_USER_ID);
        const defaultBoughtClasses = boughtClasses.filter((classData) => classData.classId === DEMO_RESERVED_CLASS_ID);
        return await User.findByIdAndUpdate(DEMO_USER_ID,
            {
                tags: [],
                createdClasses: [],
                boughtClasses: defaultBoughtClasses
            }
        );
    } catch ( error ) {
        return error;
    }
}

async function runReset() {
    try {
        await Promise.all([clearCreatedClasses(), clearUserClassInfo(), resetUser()]);
        console.log("reset user done");
    } catch (error) {
        console.error(error);
    }
}

runReset();
