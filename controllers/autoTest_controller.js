
import { exec } from "child_process";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";

function isUrl(string) {
    const urlRegex = /^(?:http|https):\/\/[\w\-]+(?:\.[\w\-]+)+[\w\-.,@?^=%&:/~+#]*$/;
    return urlRegex.test(string);
}

export const functionTest = async (req, res) => {

    const { functionName } = req.body;
    const testCases = JSON.parse(req.body.testCases);

    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { path: filePath, filename } = file;
    console.log(testCases);

    // run all test cases
    const testResults = await Promise.all(testCases.map((testCase) => {
        return new Promise((resolve, reject) => {
            const { inputs, result } = testCase;
            const parsedResult = JSON.parse(result);
            const containerName = uuidv4();
            const command = `
            docker run \
                --name ${containerName} \
                -v $(pwd)/${filePath}:/app/${filename} \
                -e INPUT=${inputs} \
                node:18-alpine node /app/${filename} ${functionName}`;
            exec(command, (error, stdout, stderr) => {
                stdout = stdout.trim();
                if ( error ) {
                    console.error(error);
                    reject(error);
                } else {
                    console.log('exec result', stdout);
                    console.log('expected result', parsedResult);
    
                    const resultObj = {
                        case: JSON.parse(testCase.case),
                        inputs: JSON.parse(testCase.inputs),
                        passed: false,
                        execResult: stdout,
                        expectedResult: parsedResult
                    }
    
                    if ( stdout.trim() !== parsedResult ) {
                        allPassed = false;
                    } else {
                        resultObj.passed = true;
                    }
                    exec(`docker rm ${containerName}`);
                    resolve(resultObj);
                }
            })
        })
    }));
    console.log(testResults);
    res.status(200).json({testResults});
}

export const apiTest = async (req, res) => {
    const { targetUrl, testCases } = req.body;
    const parsedTestCases = JSON.parse(testCases);

    console.log(targetUrl, parsedTestCases);

    if ( !isUrl(targetUrl) ) {
        console.log('aaa');
        return res.status(400).json({ message: "Not valid url" });
    }

    const testResults = await Promise.all(parsedTestCases.map((testCase) => {
        return new Promise( async (resolve, reject) => {
            try {
                const response = await axios({
                    method: `${JSON.parse(testCase.method)}`,
                    url: targetUrl,
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                
                const { status, data } = response;
                const resultObj = {
                    case: JSON.parse(testCase.case),
                    url: targetUrl,
                    passed: true,
                    execStatus: status,
                    expectedStatus: JSON.parse(testCase.statusCode),
                    execData: data,
                    expectedData: JSON.parse(testCase.result)
                }
                if ( String(status) !== JSON.parse(testCase.statusCode) || data !== JSON.parse(testCase.result) ) {
                    resultObj.passed = false;
                }
                resolve(resultObj);   
                
            } catch (err) {
                reject({
                    passed: false,
                    message: err
                })
            }
        })
    }));
    console.log(testResults);
    res.status(200).json(testResults);
}

