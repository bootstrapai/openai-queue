# OpenAI Queue

This library provides an easy way to handle rate limits when using the OpenAI API. It provides a Queue class that rate-limits API calls based on tokens and requests per minute. A higher level ModelAPIQueue class is also provided which allows managing different API models each with their own separate rate limits.

It will also automatically retry each request on other errors, with a 10 second delay, 5 attempts per request. The API will often throw errors or disconnects due to being overloaded. Right now we don't inspect the errors and just naively retry. PRs welcome for better error handling.

This code _should_ work in the browser, but the nested tiktoken dependency uses wasm and we haven't instrumented building the tests for the browser yet. PRs welcome.

## Usage

You first need to construct a `ModelAPIQueue` object. If you want to override the default rate limits, you can pass a `customModelConfigs` object to the constructor.

```typescript
const customModelConfigs = {
    "gpt-4": {
        requestsPerMinute: 250,
        tokensPerMinute: 50000,
    },
};

const modelAPIQueue = new ModelAPIQueue("your-api-key", customModelConfigs);
```

Then, you can make API calls using the request() method of the ModelAPIQueue object. The request() method automatically dispatches the API call to the appropriate queue based on the model string of the request. The request object format is the same as in the [openai](https://github.com/openai/openai-node) library

```typescript
const request = {
    model: "gpt-4",
    // Other parameters...
};

const response = await modelAPIQueue.request(request);
```

## Supported models and Default Rate Limits

The library has default rate limits for the following models:

gpt-3.5-turbo: 3500 requests per minute and 90000 tokens per minute
gpt-3.5-turbo-0301: 3500 requests per minute and 90000 tokens per minute
gpt-4: 200 requests per minute and 40000 tokens per minute
gpt-4-0314: 200 requests per minute and 40000 tokens per minute

## Classes

### APIQueue

Manages rate-limited API calls for a single model. It takes a `tokensPerMinute`, `requestsPerMinute`, `model`, and `apiKey` as parameters during construction. API calls are made using the `request()` method.

### ModelAPIQueue

Manages API calls for different models with separate rate limits for each model. It creates an internal `APIQueue` for each model. API calls are made using the `request()` method, which dispatches the API call to the appropriate queue based on the model string of the request.

## Roadmap

-   [x] Node.js support
-   [] browser testing
-   [] non-chat model support
