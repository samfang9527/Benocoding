
import { User } from "./database.js";

async function addUserClass(userId, classId, classTags) {
    try {
        const { tags } = await User.findById(userId);
        console.log('classTags', classTags);
        classTags.forEach((ele) => {
            if ( !tags.includes(ele) ) {
                tags.push(ele);
            }
        })
        console.log('tags', tags);

        const result = await User.findByIdAndUpdate(userId, {$push: {"class": classId}, tags: tags}, {new: true});
        console.log('userUpdated', result);
        return result;
    } catch (err) {
        console.error(err);
    }
}

export {
    addUserClass
}