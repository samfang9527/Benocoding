
import { User } from "../../models/database";
import { resolvers } from "../../resolvers/userResolver";
import { typeDefs  } from "../../typeDefs/userTypeDefs";
import { ApolloServer } from "@apollo/server";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

jest.mock("../../models/database.js", () => ({
    User: {
        find: jest.fn(),
        create: jest.fn(),
    }
}));

jest.mock("bcrypt", () => ({
    compare: jest.fn(),
    hash: jest.fn()
}));

describe("User Resolver -signin", () => {
    let testServer;

    beforeAll(async () => {
        testServer = new ApolloServer({
            typeDefs,
            resolvers,
        });
        await testServer.start();
    })

    afterAll(async () => {
        await testServer.stop();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Sign in successful", async () => {

        const mockedUser = {
            _id: '6445e86a5f83dcc8f06b3787',
            username: 'Steven',
            email: 'steven8542@gmail.com',
            password: '$2b$10$mhp9ronOJYgOo4UUMAtBi.Lqnr.riAmcota8ST1NgxHzxV4kaUeIa' // hashed password for "12345678"
        };
        User.find.mockResolvedValue([mockedUser]);

        bcrypt.compare.mockImplementation((password, hashedPassword) => {
            return password === "12345678" && hashedPassword === mockedUser.password;
        })
        
        const query = `
            mutation($data: UserData!) {
                signin(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            email: "steven8542@gmail.com",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(User.find).toHaveBeenCalledWith({email: userData.email});
        expect(bcrypt.compare).toHaveBeenCalledWith(userData.password, mockedUser.password);
        expect(res.body.singleResult.data.signin).toEqual({
            statusCode: 200,
            responseMessage: "ok",
            jwt: expect.any(String)
        })
    })

    test("Sign in failed, missing arguments", async () => {
        
        const query = `
            mutation($data: UserData!) {
                signin(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            email: "steven8542@gmail.com",
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signin).toEqual({
            statusCode: 400,
            responseMessage: "Missing required informations",
            jwt: null
        })
    })

    test("Sign in failed, wrong email format", async () => {
        
        const query = `
            mutation($data: UserData!) {
                signin(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            email: "steven8542@gmailcom",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signin).toEqual({
            statusCode: 400,
            responseMessage: "Wrong input format",
            jwt: null
        })
    })

    test("Sign in failed, email not exists", async () => {

        User.find.mockResolvedValue([]);
        
        const query = `
            mutation($data: UserData!) {
                signin(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            email: "steven8542@gmail.com",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signin).toEqual({
            statusCode: 401,
            responseMessage: "Email not exists",
            jwt: null
        })
    })

    test("Sign in failed, wrong password", async () => {

        const mockedUser = {
            _id: '6445e86a5f83dcc8f06b3787',
            username: 'Steven',
            email: 'steven8542@gmail.com',
            password: '$2b$10$mhp9ronOJYgOo4UUMAtBi.Lqnr.riAmcota8ST1NgxHzxV4kaUeIa' // hashed password for "12345678"
        };
        User.find.mockResolvedValue([mockedUser]);

        bcrypt.compare.mockImplementation((password, hashedPassword) => {
            return password === "12345678" && hashedPassword === mockedUser.password;
        })
        
        const query = `
            mutation($data: UserData!) {
                signin(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            email: "steven8542@gmail.com",
            password: "123456789"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signin).toEqual({
            statusCode: 401,
            responseMessage: "Wrong password",
            jwt: null
        })
    })
});

describe("User Resolver -signup", () => {
    let testServer;

    beforeAll(async () => {
        testServer = new ApolloServer({
            typeDefs,
            resolvers,
        });
        await testServer.start();
    })

    afterAll(async () => {
        await testServer.stop();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Sign up successful", async () => {

        const mockedUser = {
            _id: '6445e86a5f83dcc8f06b3787',
            username: 'tester007',
            email: "tester007@gmail.com",
            password: '$2b$10$mhp9ronOJYgOo4UUMAtBi.Lqnr.riAmcota8ST1NgxHzxV4kaUeIa' // hashed password for "12345678"
        };
        const hashedPassword = '$2b$10$mhp9ronOJYgOo4UUMAtBi.Lqnr.riAmcota8ST1NgxHzxV4kaUeIa';
        User.find.mockResolvedValue([]);
        bcrypt.hash.mockResolvedValue(hashedPassword);
        User.create.mockResolvedValue(mockedUser);

        const query = `
            mutation($data: UserData!) {
                signup(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            username: "tester",
            email: "tester007@gmail.com",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(User.find).toHaveBeenCalledWith({email: userData.email});
        expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, Number(process.env.BCRYPT_SALT_ROUNDS));
        expect(User.create).toHaveBeenCalledWith({email: userData.email, username: userData.username, password: hashedPassword});
        expect(res.body.singleResult.data.signup).toEqual({
            statusCode: 200,
            responseMessage: "ok",
            jwt: expect.any(String)
        });
    })

    test("Sign up failed, missing arguments", async () => {
        const query = `
            mutation($data: UserData!) {
                signup(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            email: "tester007@gmail.com",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signup).toEqual({
            statusCode: 400,
            responseMessage: "Missing required informations",
            jwt: null
        })
    })

    test("Sign up failed, wrong email format", async () => {
        const query = `
            mutation($data: UserData!) {
                signup(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            username: "tester",
            email: "tester007gmail.com",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signup).toEqual({
            statusCode: 400,
            responseMessage: "Wrong input format",
            jwt: null
        })
    })

    test("Sign up failed, email already exists", async () => {
        User.find.mockResolvedValue([true]);

        const query = `
            mutation($data: UserData!) {
                signup(data: $data) {
                    statusCode,
                    responseMessage,
                    jwt
                }
            }
        `;

        const userData = {
            username: "tester",
            email: "tester007@gmail.com",
            password: "12345678"
        }

        const res = await testServer.executeOperation({
            query: query,
            variables: { data: userData },
        });

        expect(res.body.singleResult.data.signup).toEqual({
            statusCode: 400,
            responseMessage: "Email already exists",
            jwt: null
        })
    })
})