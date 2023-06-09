import { expect } from "chai";
import * as sinon from "sinon";
import Agent, { Config } from "../src/agent";
import APIQueue from "../src";
import {
    CreateChatCompletionResponse,
    ChatCompletionRequestMessageRoleEnum,
} from "openai";
import * as _ from "lodash";

describe("Agent Class", function () {
    let apiQueueStub: sinon.SinonStub;

    const apiResponse: CreateChatCompletionResponse = {
        id: "testid",
        object: "chat.completion",
        created: 1677649428,
        model: "gpt-4",
        choices: [
            {
                message: {
                    role: ChatCompletionRequestMessageRoleEnum.Assistant,
                    content: "This is a test response from the assistant",
                },
            },
        ],
    };

    // @ts-ignore
    before(function () {
        const mockAPI = new APIQueue("fake-key");
        sinon.stub(mockAPI, "request").resolves(apiResponse);
        Agent.api = mockAPI;
    });

    describe("Agent Creation", function () {
        it("should create an agent with default configuration", function () {
            const agent = Agent.create();
            expect(agent).to.exist;
            // @ts-ignore
            expect(agent._config.model).to.equal("gpt-4");
        });

        it("should create an agent with custom configuration", function () {
            const config: Config = {
                model: "gpt-4",
                head: "testhead",
                temperature: 0.5,
                max_tokens: 100,
            };
            const agent = Agent.create(config);
            expect(agent).to.exist;
            // @ts-ignore
            expect(agent._config.model).to.equal(config.model);
            // @ts-ignore
            expect(agent._head).to.equal(config.head);
            // @ts-ignore
            expect(agent._config.temperature).to.equal(config.temperature);
            // @ts-ignore
            expect(agent._config.max_tokens).to.equal(config.max_tokens);
        });
    });

    describe("Chatting with the Agent", function () {
        it("should be able to chat", async function () {
            const agent = Agent.create();
            const newAgent = await agent("Hello, Agent!");

            expect(newAgent).to.exist;
            // @ts-ignore
            expect(_.omit(newAgent._config, "head")).to.deep.equal(
                // @ts-ignore
                _.omit(agent._config, "head")
            );
            // @ts-ignore
            expect(newAgent.content).to.equal(
                apiResponse.choices[0].message!.content
            );
        });

        it("should allow branching", async function () {
            const agent = await Agent.create().chat("first post");

            // @ts-ignore
            const head = agent._head;
            const newAgent1 = await agent("Hello, Agent 1!");
            const newAgent2 = await agent("Hello, Agent 2!");

            // Original agent's head should remain the same
            // @ts-ignore
            expect(agent._head).to.equal(head);

            // The new agents should have different heads
            // @ts-ignore
            expect(newAgent1._head).to.not.equal(newAgent2._head);
        });
    });

    describe("System Message", function () {
        it("should be able to create system message", function () {
            const agent = Agent.create();
            const newAgent = agent.system("This is a system message.");

            expect(newAgent).to.exist;
            // @ts-ignore
            expect(_.omit(newAgent._config, "head")).to.deep.equal(
                // @ts-ignore
                _.omit(agent._config, "head")
            );
            // @ts-ignore
            expect(newAgent.content).to.equal("This is a system message.");
        });

        it("should create a new system message rather than appending", function () {
            const agent = Agent.create();
            const newAgent = agent.system("initial message");
            // @ts-ignore
            expect(newAgent.content).to.equal("initial message");
            const separateAgent = newAgent.system("separate message");
            // @ts-ignore
            expect(separateAgent.content).to.equal("separate message");
        });
    });

    describe("Extending an Agent", function () {
        it("should be able to extend the agent", function () {
            const agent = Agent.create();
            const config: Config = {
                model: "gpt-4",
                head: "testhead2",
                temperature: 0.7,
                max_tokens: 150,
            };
            const newAgent = agent.extend(config);
            expect(newAgent).to.exist;
            // @ts-ignore
            expect(newAgent._config.model).to.equal(config.model);
            // @ts-ignore
            expect(newAgent._head).to.equal(agent._head); // head should remain same on extend
            // @ts-ignore
            expect(newAgent._config.temperature).to.equal(config.temperature);
            // @ts-ignore
            expect(newAgent._config.max_tokens).to.equal(config.max_tokens);
        });
    });

    describe("Retry Behavior", function () {
        it("should be able to retry and increment callId", async function () {
            const agent = Agent.create();
            const newAgent = await agent("Hello, Agent!"); // Ensuring agent call is awaited
            const retryAgent = await newAgent.retry(); // Retry on newAgent
            // @ts-ignore
            expect(retryAgent.callId).to.equal(newAgent.callId + 1);
            // @ts-ignore
            expect(retryAgent.messages[0].content).to.include(
                // @ts-ignore
                retryAgent.callId.toString().padStart(2, "0")
            );
        });

        it("should retry with last user message", async function () {
            const agent = Agent.create();
            const userMsg = "Hello, Agent!";
            const newAgent = await agent(userMsg); // Ensuring agent call is awaited
            const retryAgent = await newAgent.retry(); // Retry on newAgent
            // @ts-ignore
            expect(retryAgent.messages[0].content).to.include(userMsg);
        });

        it("should throw an error if no user message found for retry", async function () {
            const agent = Agent.create();
            agent.system("System message.");
            try {
                await agent.retry();
            } catch (error) {
                expect(error.message).to.equal(
                    "No user message found for retry"
                );
            }
        });
    });

    describe("Chatting with the Agent with callId", function () {
        it("should include callId in user message content", async function () {
            const agent = Agent.create();
            const newAgent = await agent("Hello, Agent!");
            // @ts-ignore
            expect(newAgent.messages[0].content).to.include(
                // @ts-ignore
                agent.callId.toString().padStart(2, "0")
            );
        });
    });
});
