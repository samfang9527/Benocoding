
import axios from "axios";
import dotenv from "dotenv";
import { User } from "../models/database.js";
import jwt from "jsonwebtoken";
import { DOMAIN } from "../constant.js";

dotenv.config();

const {
    GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET,
    JWT_PRIVATE_KEY,
} = process.env;

export const callback = async (req, res) => {
    try {
        const { code } = req.query;
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_OAUTH_CLIENT_ID,
            client_secret: GITHUB_OAUTH_CLIENT_SECRET,
            code: code
        }, {
            headers: {
            'Accept': 'application/json'
            }
        });
        
        const access_token = response.data.access_token;
        const userData = await axios.get('https://api.github.com/user', {
            headers: {
                "Authorization": `token ${access_token}`
            }
        })
        console.log(userData.data);

        // check if email exist
        const user = await User.findOne({
            email: userData.data.email
        })
        console.log('user', user);

        let payload = {};
        if ( user ) {
            payload = {
                userId: user._id,
                username: userData.data.username,
                email: userData.data.email
            }
            return res.redirect(DOMAIN);
        }

        const userObj = {
            username: userData.data.name,
            email: userData.data.email,
        }
        const userResult = await User.create(userObj);
        console.log(userResult);

        payload = {
            userId: userResult._id,
            username: userResult.username,
            email: userResult.email
        }

        const token = jwt.sign(payload, JWT_PRIVATE_KEY, { expiresIn: "7d" });
        res.cookie('jwt', token);
        res.redirect(DOMAIN);

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to login with github.');
    }
}
