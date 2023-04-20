
import { User } from "./database.js";

async function addCreatedClass(userId, classData, classTags) {
    try {
        const { tags } = await User.findById(userId);
        classTags.forEach((ele) => {
            if ( !tags.includes(ele) ) {
                tags.push(ele);
            }
        })

        const result = await User.findByIdAndUpdate(userId, {$push: {"createdClasses": classData}, tags: tags}, {new: true});
        return result;
    } catch (err) {
        console.error(err);
    }
}

async function addboughtClass(userId, classData, classTags) {
    try {
        const { tags } = await User.findById(userId);
        classTags.forEach((ele) => {
            if ( !tags.includes(ele) ) {
                tags.push(ele);
            }
        })

        const result = await User.findByIdAndUpdate(userId, {$push: {"boughtClasses": classData}, tags: tags}, {new: true});
        return result;
    } catch (err) {
        console.error(err);
    }
}

async function getUserDataByEmail(email) {
    try {
        const [ data ] = await User.find({
            email: email
        })
        return data;

    } catch (err) {
        console.error(err);
    }
}

async function getUserById(userId) {
    try {
        const data = await User.findById(userId);
        return data;
    } catch (err) {
        console.error(err);
    }
}

export {
    addCreatedClass,
    addboughtClass,
    getUserDataByEmail,
    getUserById
}