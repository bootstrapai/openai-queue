import { CreateChatCompletionRequest, CreateChatCompletionResponse } from "openai";
import { supportModelType } from "gpt-tokens";
/**
 * ModelAPIQueue is a class to manage rate-limited API calls.
 * It supports both token-based and request-based rate limits.
 */
export declare class ModelAPIQueue {
    private tokensPerMinute;
    private requestsPerMinute;
    private model;
    private apiKey;
    private availableTokens;
    private availableRequests;
    private lastRefillTime;
    private openai;
    /**
     * @constructor
     * @param {number} tokensPerMinute - The maximum number of tokens available per minute.
     * @param {number} requestsPerMinute - The maximum number of requests available per minute.
     * @param {string} model - Model string associated with API calls.
     * @param {string} apiKey - API key for API calls.
     */
    constructor(tokensPerMinute: number, requestsPerMinute: number, model: supportModelType, apiKey: string);
    /**
     * Sleep for a certain amount of time.
     * @param {number} ms - The number of milliseconds to sleep.
     * @return {Promise<void>} A promise that resolves after the specified number of milliseconds.
     */
    private sleep;
    /**
     * Refill tokens and requests based on the elapsed time since the last refill.
     */
    private refillTokensAndRequests;
    /**
     * Compute the number of tokens required for a specific request.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {number} The number of tokens required for the request.
     */
    private computeTokens;
    /**
     * Make an API call.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the response from the API call.
     */
    private callAPI;
    /**
     * Make a request. This function will wait for enough tokens and requests to be available before making the API call.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the result of the API call.
     */
    request(request: CreateChatCompletionRequest): Promise<CreateChatCompletionResponse | null>;
}
