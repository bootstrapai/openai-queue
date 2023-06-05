"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelAPIQueue = void 0;
const openai_1 = require("openai");
const gpt_tokens_1 = require("gpt-tokens");
/**
 * ModelAPIQueue is a class to manage rate-limited API calls.
 * It supports both token-based and request-based rate limits.
 */
class ModelAPIQueue {
    /**
     * @constructor
     * @param {number} tokensPerMinute - The maximum number of tokens available per minute.
     * @param {number} requestsPerMinute - The maximum number of requests available per minute.
     * @param {string} model - Model string associated with API calls.
     * @param {string} apiKey - API key for API calls.
     */
    constructor(tokensPerMinute, requestsPerMinute, model, apiKey) {
        this.tokensPerMinute = tokensPerMinute;
        this.requestsPerMinute = requestsPerMinute;
        this.model = model;
        this.apiKey = apiKey;
        this.availableTokens = tokensPerMinute;
        this.availableRequests = requestsPerMinute;
        this.lastRefillTime = Date.now();
        const configuration = new openai_1.Configuration({
            apiKey: this.apiKey,
        });
        this.openai = new openai_1.OpenAIApi(configuration);
    }
    /**
     * Sleep for a certain amount of time.
     * @param {number} ms - The number of milliseconds to sleep.
     * @return {Promise<void>} A promise that resolves after the specified number of milliseconds.
     */
    sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => setTimeout(resolve, ms));
        });
    }
    /**
     * Refill tokens and requests based on the elapsed time since the last refill.
     */
    refillTokensAndRequests() {
        const now = Date.now();
        const timeElapsed = now - this.lastRefillTime;
        const tokensToAdd = Math.floor((timeElapsed / 60000) * this.tokensPerMinute);
        console.log("tokensToAdd", tokensToAdd);
        if (tokensToAdd > 0) {
            this.availableTokens = Math.min(this.availableTokens + tokensToAdd, this.tokensPerMinute);
        }
        const requestsToAdd = Math.floor((timeElapsed / 60000) * this.requestsPerMinute);
        if (requestsToAdd > 0) {
            this.availableRequests = Math.min(this.availableRequests + requestsToAdd, this.requestsPerMinute);
        }
        this.lastRefillTime = now;
    }
    /**
     * Compute the number of tokens required for a specific request.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {number} The number of tokens required for the request.
     */
    computeTokens(request) {
        const usageInfo = new gpt_tokens_1.GPTTokens({
            model: this.model,
            messages: request.messages,
        });
        const multiplier = request.n ? request.n : 1;
        return (usageInfo.usedTokens + (request.max_tokens || 0)) * multiplier;
    }
    /**
     * Make an API call.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the response from the API call.
     */
    callAPI(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const backoffTime = 10000; // Set backoff time to 10 seconds, adjust as needed
            let attemptCount = 0;
            const maxAttempts = 5; // Set max attempts to 5, adjust as needed
            let result;
            while (attemptCount < maxAttempts) {
                try {
                    const completion = yield this.openai.createCompletion(request);
                    const usedTokens = completion.data.usage.completion_tokens;
                    if (request.max_tokens) {
                        const multiplier = request.n ? request.n : 1;
                        const expectedTokens = request.max_tokens * multiplier;
                        if (expectedTokens > usedTokens) {
                            this.availableTokens += expectedTokens - usedTokens;
                        }
                    }
                    else {
                        this.availableTokens -= usedTokens;
                    }
                    result = completion.data;
                }
                catch (error) {
                    console.error(`API call failed with error: ${error.message}`);
                    this.availableTokens = 0;
                    attemptCount++;
                    if (attemptCount < maxAttempts) {
                        console.log(`Backing off for ${backoffTime} ms and then retrying...`);
                        yield this.sleep(backoffTime);
                    }
                    else {
                        throw new Error(`API call failed after ${maxAttempts} attempts.`);
                    }
                }
            }
            return result;
        });
    }
    /**
     * Make a request. This function will wait for enough tokens and requests to be available before making the API call.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the result of the API call.
     */
    request(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokensNeeded = this.computeTokens(request);
            console.log("tokensNeeded", tokensNeeded);
            while (tokensNeeded > this.availableTokens ||
                this.availableRequests <= 0) {
                this.refillTokensAndRequests();
                console.log(tokensNeeded, this.availableTokens);
                const timeToSleep = Math.max(((tokensNeeded - this.availableTokens) / this.tokensPerMinute) *
                    60000, (1 / this.requestsPerMinute) * 60000);
                yield this.sleep(timeToSleep);
            }
            this.availableTokens -= tokensNeeded;
            this.availableRequests -= 1;
            return yield this.callAPI(request);
        });
    }
}
exports.ModelAPIQueue = ModelAPIQueue;
