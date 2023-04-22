
import { Redis } from "ioredis";
import dotenv from "dotenv";
import { createAdapter } from "@socket.io/redis-adapter";

dotenv.config();

// local test
// const {
//     LOCAL_REDIS_PORT,
//     LOCAL_REDIS_HOST,
//     LOCAL_REDIS_USER,
//     LOCAL_REDIS_PWD
// } = process.env

// aws
const {
    ELASTICACHED_PORT,
    ELASTICACHED_HOST,
    ELASTICACHED_USER,
    ELASTICACHED_PWD
} = process.env

export function initialRedisPubSub(io) {

    const redisPub = new Redis({
        port: ELASTICACHED_PORT,
        host: ELASTICACHED_HOST,
        username: ELASTICACHED_USER,
        password: ELASTICACHED_PWD,
    });

    const redisSub = redisPub.duplicate();
    io.adapter(createAdapter(redisPub, redisSub));

    redisPub.on("ready", () => { console.log('redisPub is ready') });
    redisSub.on("ready", () => { console.log('redisSub is ready') });

    return {
        redisPub: redisPub,
        redisSub: redisSub
    }
}
