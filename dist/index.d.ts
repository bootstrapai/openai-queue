import { CreateChatCompletionRequest, CreateChatCompletionResponse } from "openai";
/**
 * Configuration object for each model queue. Specifies the rate limits for requests and tokens.
 * @interface QueueConfig
 * @property {number} requestsPerMinute - The maximum number of requests per minute.
 * @property {number} tokensPerMinute - The maximum number of tokens per minute.
 */
interface QueueConfig {
    requestsPerMinute: number;
    tokensPerMinute: number;
}
/**
 * APIQueue is a class that manages API calls for different models with separate rate limits for each.
 * It uses an internal queue for each model, and dispatches API calls to the appropriate queue based on the model string.
 */
export declare class APIQueue {
    private apiKey;
    private queues;
    private cache;
    constructor(apiKey: string, customModelConfigs?: Record<string, QueueConfig>);
    /**
     * Make a request. This function will dispatch the request to the appropriate queue
     * based on the model string on the request object.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the result of the API call.
     */
    request(request: CreateChatCompletionRequest): Promise<CreateChatCompletionResponse | null>;
}
export default APIQueue;
