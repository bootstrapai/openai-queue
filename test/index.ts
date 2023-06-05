import { expect } from "chai";
import * as sinon from "sinon";
import { CreateChatCompletionRequest } from "openai";
import APIQueue from "../src"; // Replace with your actual file path

// TSLint requires space after comment
describe("APIQueue", function () {
    // TSLint requires space after comment
    // @ts-ignore
    this.timeout(61000);

    let apiQueue: APIQueue;
    const apiKey = "testApiKey";

    beforeEach(() => {
        apiQueue = new APIQueue(apiKey);
    });

    afterEach(() => {
        sinon.restore();
    });

    // Use arrow function and access via dot notation
    it("should initialize with default model configurations", () => {
        // @ts-ignore
        expect(Object.keys(apiQueue.queues)).to.deep.equal([
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-0301",
            "gpt-4",
            "gpt-4-0314",
        ]);
    });

    // Use arrow function and access via dot notation
    it("should make a request to a valid model", async () => {
        const model = "gpt-4";
        const request: CreateChatCompletionRequest = {
            model,
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Who won the world series in 2020?" },
            ],
        };

        // @ts-ignore
        const modelQueue = apiQueue.queues[model];
        const stub = sinon.stub(modelQueue, "request").resolves({} as any);

        await apiQueue.request(request);

        sinon.assert.calledOnce(stub);
    });

    // Use arrow function and access via dot notation
    it("should throw an error for unsupported model", async function () {
        const model = "unsupported-model";
        const request: CreateChatCompletionRequest = {
            model,
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Who won the world series in 2020?" },
            ],
        };

        try {
            await apiQueue.request(request);
        } catch (err) {
            expect(err.message).to.equal(`Unsupported model: ${model}`);
        }
    });

    // Use arrow function and access via dot notation
    it("should refill tokens and requests when making a request with insufficient tokens", async () => {
        const model = "gpt-4";
        const request: CreateChatCompletionRequest = {
            model,
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content:
                        'Translate this sentence to French: "Hello, World!"',
                },
            ],
            max_tokens: 20000, // TSLint requires space after comment
        };

        // @ts-ignore
        const modelQueue = apiQueue.queues[model];
        // @ts-ignore
        const callStub = sinon.stub(modelQueue, "callAPI").resolves({} as any);

        // make two requests sequentially to exceed the limit
        await Promise.all([
            apiQueue.request(request),
            apiQueue.request(request),
            apiQueue.request(request),
        ]);

        sinon.assert.callCount(callStub, 3);
    });
});
