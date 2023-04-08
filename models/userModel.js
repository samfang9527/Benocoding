
import { User } from "./database.js";

async function addUserClass(userId, classData, classTags) {
    try {
        const { tags } = await User.findById(userId);
        console.log('classTags', classTags);
        classTags.forEach((ele) => {
            if ( !tags.includes(ele) ) {
                tags.push(ele);
            }
        })
        console.log('tags', tags);

        const result = await User.findByIdAndUpdate(userId, {$push: {"class": classData}, tags: tags}, {new: true});
        console.log('userUpdated', result);
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

export {
    addUserClass,
    getUserDataByEmail
}