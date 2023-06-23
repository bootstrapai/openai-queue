import {
    Configuration,
    OpenAIApi,
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
} from "openai";
import { GPTTokens, supportModelType } from "gpt-tokens";

/**
 * ModelAPIQueue is a class to manage rate-limited API calls.
 * It supports both token-based and request-based rate limits.
 */
export class ModelAPIQueue {
    private tokensPerMinute: number;
    private requestsPerMinute: number;
    private model: supportModelType;
    private apiKey: string;
    private availableTokens: number;
    private availableRequests: number;
    private lastRefillTime: number;
    private openai: OpenAIApi;

    /**
     * @constructor
     * @param {number} tokensPerMinute - The maximum number of tokens available per minute.
     * @param {number} requestsPerMinute - The maximum number of requests available per minute.
     * @param {string} model - Model string associated with API calls.
     * @param {string} apiKey - API key for API calls.
     */
    constructor(
        tokensPerMinute: number,
        requestsPerMinute: number,
        model: supportModelType,
        apiKey: string
    ) {
        this.tokensPerMinute = tokensPerMinute;
        this.requestsPerMinute = requestsPerMinute;
        this.model = model;
        this.apiKey = apiKey;
        this.availableTokens = tokensPerMinute;
        this.availableRequests = requestsPerMinute;
        this.lastRefillTime = Date.now();

        const configuration = new Configuration({
            apiKey: this.apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    /**
     * Sleep for a certain amount of time.
     * @param {number} ms - The number of milliseconds to sleep.
     * @return {Promise<void>} A promise that resolves after the specified number of milliseconds.
     */
    private async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Refill tokens and requests based on the elapsed time since the last refill.
     */
    private refillTokensAndRequests(): void {
        const now = Date.now();
        const timeElapsed = now - this.lastRefillTime;

        const tokensToAdd = Math.floor(
            (timeElapsed / 60000) * this.tokensPerMinute
        );
        if (tokensToAdd > 0) {
            this.availableTokens = Math.min(
                this.availableTokens + tokensToAdd,
                this.tokensPerMinute
            );
        }

        const requestsToAdd = Math.floor(
            (timeElapsed / 60000) * this.requestsPerMinute
        );
        if (requestsToAdd > 0) {
            this.availableRequests = Math.min(
                this.availableRequests + requestsToAdd,
                this.requestsPerMinute
            );
        }

        this.lastRefillTime = now;
    }

    /**
     * Compute the number of tokens required for a specific request.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {number} The number of tokens required for the request.
     */
    private computeTokens(request: CreateChatCompletionRequest): number {
        const usageInfo = new GPTTokens({
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
    private async callAPI(
        request: CreateChatCompletionRequest
    ): Promise<CreateChatCompletionResponse> {
        const completion = await this.openai.createChatCompletion(request);
        const usedTokens = completion.data.usage!.completion_tokens;

        if (request.max_tokens) {
            const multiplier = request.n ? request.n : 1;
            const expectedTokens = request.max_tokens * multiplier;

            if (expectedTokens > usedTokens) {
                this.availableTokens += expectedTokens - usedTokens;
            }
        } else {
            this.availableTokens -= usedTokens;
        }

        return completion.data;
    }

    /**
     * Make a request. This function will wait for enough tokens and requests to be available before making the API call.
     * If an API call fails, it will wait for enough tokens and requests to be available before retrying.
     * @param {CreateChatCompletionRequest} request - The request for the API call.
     * @return {Promise<CreateChatCompletionResponse>} A promise that resolves with the result of the API call.
     */
    public async request(
        request: CreateChatCompletionRequest
    ): Promise<CreateChatCompletionResponse | null> {
        const backoffTime = 10000; // Set backoff time to 10 seconds, adjust as needed
        let attemptCount = 0;
        const maxAttempts = 5; // Set max attempts to 5, adjust as needed
        const tokensNeeded = this.computeTokens(request);

        while (attemptCount < maxAttempts) {
            while (
                tokensNeeded > this.availableTokens ||
                this.availableRequests <= 0
            ) {
                this.refillTokensAndRequests();
                const timeToSleep = Math.max(
                    ((tokensNeeded - this.availableTokens) /
                        this.tokensPerMinute) *
                        60000,
                    (1 / this.requestsPerMinute) * 60000
                );
                await this.sleep(timeToSleep);
            }

            this.availableTokens -= tokensNeeded;
            this.availableRequests -= 1;

            try {
                return await this.callAPI(request);
            } catch (error) {
                console.error(
                    `API call failed with error: ${(error as Error).message}`
                );
                this.availableTokens = 0;
                attemptCount++;
                if (attemptCount < maxAttempts) {
                    console.log(
                        `Backing off for ${backoffTime} ms and then retrying...`
                    );
                    await this.sleep(backoffTime);
                } else {
                    throw new Error(
                        `API call failed after ${maxAttempts} attempts.`
                    );
                }
            }
        }

        return null;
    }
}
