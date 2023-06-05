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
exports.APIQueue = void 0;
const queue_1 = require("./queue");
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
const defaultModelConfigs = {
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
class APIQueue {
    constructor(apiKey, customModelConfigs = {}) {
        this.apiKey = apiKey;
        this.queues = {};
        const modelConfigs = Object.assign(Object.assign({}, defaultModelConfigs), customModelConfigs);
        for (const [model, config] of Object.entries(modelConfigs)) {
            this.queues[model] = new queue_1.ModelAPIQueue(config.tokensPerMinute, config.requestsPerMinute, model, this.apiKey);
        }
    }
    /**
     * Make a request. This function will dispatch the request to the appropriate queue
     * based on the model string on the request object.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the result of the API call.
     */
    request(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const modelQueue = this.queues[request.model];
            if (!modelQueue) {
                throw new Error(`Unsupported model: ${request.model}`);
            }
            return yield modelQueue.request(request);
        });
    }
}
exports.APIQueue = APIQueue;
exports.default = APIQueue;
