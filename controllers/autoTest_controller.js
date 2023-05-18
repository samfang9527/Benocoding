
import { exec } from "child_process";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
import { UserClassInfo } from "../models/database.js";
import fs from "fs";

export const functionTest = async (req, res) => {

    const { functionName, classId, userId, milestoneIdx } = req.body;
    const testCases = JSON.parse(req.body.testCases);

    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { path: filePath, filename } = file;

    try {
        // run all test cases
        const testResults = await Promise.all(testCases.map((testCase) => {
            return new Promise((resolve, reject) => {
                const { inputs, result } = testCase;
                const containerName = uuidv4();
                
                const timeoutMs = 5000;
                const command = `
                docker run \
                    --rm \
                    --name ${containerName} \
                    --cpus 0.5 \
                    --memory 64m \
                    -v $(pwd)/${filePath}:/app/${filename} \
                    -e INPUT1=${JSON.stringify(inputs[0])} \
                    -e INPUT2=${JSON.stringify(inputs[1])} \
                    node:18-alpine node /app/${filename} ${functionName}`;

                exec(command, (error, stdout, stderr) => {
                    stdout = stdout.trim();
                    stderr = stderr.trim();
                    if ( error || stderr ) {
                        reject(error || stderr);
                    } else {
                        const resultObj = {
                            case: testCase.case,
                            inputs: inputs,
                            passed: false,
                            execResult: stdout,
                            expectedResult: result
                        }
        
                        if ( stdout === result ) {
                            resultObj.passed = true;
                        }
                        resolve(resultObj);
                    }
                })
                setTimeout(() => {
                    const stopCommand = `
                    docker stop -t 1 ${containerName}
                    `
                    exec(stopCommand, (error) => {
                        if ( error ) reject(error);
                    });
                    reject(new Error('Execution time exceed limit'));
                }, timeoutMs);
            })
        }));

        // check all case results
        for ( let i = 0; i < testResults.length; i++ ) {
            if ( !testResults[i].passed ) {
                return res.status(200).json({testResults});
            }
        }

        // update milestone passed to true
        await UserClassInfo.updateOne(
            { classId: classId, userId: userId },
            { $set: { [`milestones.${milestoneIdx}.passed`]: true } },
            { new: true }
        );
        res.status(200).json({testResults});

    } catch (err) {
        console.error(err);
        return res.status(400).json({err: err.message});
    } finally {
        // remove file
        fs.unlink(filePath, (err) => {
            if ( err ) {
                console.error(err)
                return;
            }
            console.trace('file removed');
        })
    }
}

export const apiTest = async (req, res) => {
    const { targetUrl, testCases, classId, userId, milestoneIdx } = req.body;
    const parsedTestCases = JSON.parse(testCases);
    console.log(classId, userId, milestoneIdx)

    const axiosPromises = parsedTestCases.map((testCase) => {
        return axios({
            method: testCase.method,
            url: targetUrl,
            headers: {
                "Content-Type": "application/json"
            }
        })
    });

    try {
        const testResults = await Promise.all(axiosPromises);
        let allPassed = true;
        for ( let i = 0; i < testResults.length; i++ ) {
            const testResult = testResults[i];
            const resultObj = {
                case: parsedTestCases[i].case,
                url: targetUrl,
                passed: true,
                execStatus: JSON.stringify(testResult.status),
                expectedStatus: parsedTestCases[i].statusCode,
                execData: JSON.stringify(testResult.data),
                expectedData: parsedTestCases[i].result
            }

            if ( String(testResult.status) !== parsedTestCases[i].statusCode || testResult.data !== parsedTestCases[i].result ) {
                resultObj.passed = false;
                allPassed = false;
            }
            testResults[i] = resultObj;
        }

        // update milestone passed to true
        if ( allPassed ) {
            await UserClassInfo.updateOne(
                { classId: classId, userId: userId },
                { $set: { [`milestones.${milestoneIdx}.passed`]: true } },
                { new: true }
            );
        }

        return res.status(200).json({testResults});
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({err});
    }
}

