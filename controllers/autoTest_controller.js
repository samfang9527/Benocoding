
import { exec } from "child_process";
import { v4 as uuidv4 } from 'uuid';

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
    const data = req.body;
    console.log(data);
    res.status(200).json('ok');
}

