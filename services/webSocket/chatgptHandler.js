
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const registerChatGPTHandlers = (io, socket) => {
    const codeReview = async (diffString, number) => {
        // connect to openai
        const apiKey = process.env.CHATGPT_API_KEY;
        const organization = process.env.CHATGPT_ORGANIZATION;
        const intro = `
            Please review all the following code diff and give me a code review within 150 words.
            I want you to provide at lease three problems or parts that can make me better within the difference.
        `;
        const model = process.env.CHATGPT_MODEL;
        const messages = [{
            "role": "system",
            "content": intro
        }]

        try {
            const segmentLength = 2048;
            for (let i = 0; i < diffString.length; i += segmentLength) {
                const part = diffString.slice(i, i + segmentLength);
                messages.push({
                    "role": "user",
                    "content": part
                });
            }

            const configuration = new Configuration({
                apiKey: apiKey,
                organization: organization
            });
            
            const openai = new OpenAIApi(configuration);
            
            console.trace('start generating code review');
            const response = await openai.createChatCompletion({
                model: model,
                messages: messages
            })
            const codeReview = response.data.choices[0].message.content;
            socket.emit('codeReviewResult', codeReview, number);
            console.trace('Complete generating code review');


        } catch (err) {
            console.error(err.response);
        }
    }

    socket.on("codeReview", codeReview);
}


export default registerChatGPTHandlers;