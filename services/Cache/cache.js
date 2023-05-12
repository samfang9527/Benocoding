
import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// const {
//     ELASTICACHED_PORT,
//     ELASTICACHED_HOST,
//     ELASTICACHED_USER,
//     ELASTICACHED_PWD
// } = process.env

let redisClient;

function initCacheService() {
    if ( redisClient ) return redisClient;
    // redisClient = new Redis({
    //     port: ELASTICACHED_PORT,
    //     host: ELASTICACHED_HOST,
    //     username: ELASTICACHED_USER,
    //     password: ELASTICACHED_PWD,
    //     tls: {}
    // });

    redisClient = new Redis({
        port: process.env.LOCAL_REDIS_PORT,
        host: process.env.LOCAL_REDIS_HOST,
        username: process.env.LOCAL_REDIS_USER,
        password: process.env.LOCAL_REDIS_PWD
    })
    
    redisClient.on("ready", () => { console.info('redisClient is ready') });
    redisClient.on("error", (err) => { console.error(err) });
}

async function getClassCache( classId ) {
    try {
        const classData = await redisClient.hget("classCache", classId);
        return classData ? classData : '';
    } catch (err) {
        console.error(err);
        return err;
    }
}

async function setClassCache( classId, classData ) {
    try {
        const hashData = {};
        hashData[classId] = classData
        const result = await redisClient.hset("classCache", hashData)
        return result;
    } catch (err) {
        console.error(err);
        return err;
    }
}

async function updateClassCache( classId, classData ) {
    try {
        const isCached = await redisClient.hexists("classCache", classId);
        if ( isCached ) {
            const hashData = {};
            hashData[classId] = classData;
            await redisClient.hset("classCache", hashData);
        }
        return;
    } catch (err) {
        console.error(err);
        return err;
    }
}

function initialRedisPubSub() {

    const redisPub = redisClient.duplicate();
    const redisSub = redisClient.duplicate();

    redisPub.on("ready", () => { console.info('redisPub is ready') });
    redisSub.on("ready", () => { console.info('redisSub is ready') });

    redisPub.on("error", (err) => { console.error(err) });
    redisSub.on("error", (err) => { console.error(err) });

    return {
        redisPub: redisPub,
        redisSub: redisSub
    }
}

export {
    initCacheService,
    initialRedisPubSub,
    getClassCache,
    setClassCache,
    updateClassCache
}
