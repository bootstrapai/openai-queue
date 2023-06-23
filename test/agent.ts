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

        it("should append system message", function () {
            const agent = Agent.create();
            const newAgent = agent.system("append message", true);
            // @ts-ignore
            expect(newAgent.content).to.equal("append message");
            const appendedAgent = newAgent.system("appended again", true);
            // @ts-ignore
            expect(appendedAgent.content).to.equal(
                "append message\nappended again"
            );
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
});
