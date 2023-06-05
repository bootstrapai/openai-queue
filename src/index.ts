import {
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
} from "openai";
import { supportModelType } from "gpt-tokens";
import { ModelAPIQueue } from "./queue";
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
 * Default rate limits for each model.
 *
 * @type {Object}
 *
 * @property {Object} 'gpt-3.5-turbo' - Rate limits for 'gpt-3.5-turbo' model.
 * @property {number} 'gpt-3.5-turbo'.requestsPerMinute - Default number of requests per minute: 3500.
 * @property {number} 'gpt-3.5-turbo'.tokensPerMinute - Default number of tokens per minute: 90000.
 *
 * @property {Object} 'gpt-3.5-turbo-0301' - Rate limits for 'gpt-3.5-turbo-0301' model.
 * @property {number} 'gpt-3.5-turbo-0301'.requestsPerMinute - Default number of requests per minute: 3500.
 * @property {number} 'gpt-3.5-turbo-0301'.tokensPerMinute - Default number of tokens per minute: 90000.
 *
 * @property {Object} 'gpt-4' - Rate limits for 'gpt-4' model.
 * @property {number} 'gpt-4'.requestsPerMinute - Default number of requests per minute: 200.
 * @property {number} 'gpt-4'.tokensPerMinute - Default number of tokens per minute: 40000.
 *
 * @property {Object} 'gpt-4-0314' - Rate limits for 'gpt-4-0314' model.
 * @property {number} 'gpt-4-0314'.requestsPerMinute - Default number of requests per minute: 200.
 * @property {number} 'gpt-4-0314'.tokensPerMinute - Default number of tokens per minute: 40000.
 */
const defaultModelConfigs: Record<string, QueueConfig> = {
    "gpt-3.5-turbo": {
        requestsPerMinute: 3500,
        tokensPerMinute: 90000,
    },
    "gpt-3.5-turbo-0301": {
        requestsPerMinute: 3500,
        tokensPerMinute: 90000,
    },
    "gpt-4": {
        requestsPerMinute: 200,
        tokensPerMinute: 40000,
    },
    "gpt-4-0314": {
        requestsPerMinute: 200,
        tokensPerMinute: 40000,
    },
};

/**
 * APIQueue is a class that manages API calls for different models with separate rate limits for each.
 * It uses an internal queue for each model, and dispatches API calls to the appropriate queue based on the model string.
 */
export class APIQueue {
    private apiKey: string;
    private queues: Record<string, ModelAPIQueue>;

    constructor(
        apiKey: string,
        customModelConfigs: Record<string, QueueConfig> = {}
    ) {
        this.apiKey = apiKey;
        this.queues = {};

        const modelConfigs = { ...defaultModelConfigs, ...customModelConfigs };

        for (const [model, config] of Object.entries(modelConfigs)) {
            this.queues[model] = new ModelAPIQueue(
                config.tokensPerMinute,
                config.requestsPerMinute,
                model as supportModelType,
                this.apiKey
            );
        }
    }

    /**
     * Make a request. This function will dispatch the request to the appropriate queue
     * based on the model string on the request object.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the result of the API call.
     */
    public async request(
        request: CreateChatCompletionRequest
    ): Promise<CreateChatCompletionResponse> {
        const modelQueue = this.queues[request.model];
        if (!modelQueue) {
            throw new Error(`Unsupported model: ${request.model}`);
        }

        return await modelQueue.request(request);
    }
}

export default APIQueue;
