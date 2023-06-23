# OpenAI Queue

This library simplifies handling rate limits when using the OpenAI API. It provides the APIQueue class that manages API calls across all models based on tokens and requests per minute. Also, a higher-level ModelAPIQueue class is available for managing different API models each with their distinct rate limits.

The library automatically retries each request on encountering errors, with a 10-second delay, up to 5 attempts per request. Presently, the library naively retries all errors, but contributions are welcome for more sophisticated error handling.

While the code _should_ function in a browser environment, due to the nested tiktoken dependency which uses wasm, we haven't added support for browser testing yet. Contributions for this are also welcome.

## Usage

To use the library, create an `APIQueue` instance. To override the default rate limits, a `customModelConfigs` object can be passed to the constructor.

```typescript
const customModelConfigs = {
    "gpt-4": {
        requestsPerMinute: 250,
        tokensPerMinute: 50000,
    },
};

const APIQueue = new APIQueue("your-api-key", customModelConfigs);
```

Then, make API calls using the request() method of the APIQueue object. The request() method dispatches the API call to the appropriate queue based on the model string of the request. The request object format matches that in the [openai](https://github.com/openai/openai-node) library.

```typescript
const request = {
    model: "gpt-4",
    // Other parameters...
};

const response = await APIQueue.request(request);
```

## Supported Models and Default Rate Limits

The library provides default rate limits for the following models:

-   gpt-3.5-turbo: 3500 requests per minute and 90000 tokens per minute
-   gpt-3.5-turbo-0301: 3500 requests per minute and 90000 tokens per minute
-   gpt-4: 200 requests per minute and 40000 tokens per minute
-   gpt-4-0314: 200 requests per minute and 40000 tokens per minute

## Classes

### ModelAPIQueue

Handles rate-limited API calls for a single model. It requires `tokensPerMinute`, `requestsPerMinute`, `model`, and `apiKey` parameters during construction. API calls are made using the `request()` method.

### APIQueue

Manages API calls across different models, each with its unique rate limits. It internally creates a `ModelAPIQueue` instance for each model. API calls are made using the `request()` method, which dispatches the API call to the correct queue based on the request's model string.

## OpenAI Agent Class

The `Agent` class provides a high-level interface to OpenAI's GPT-4 models, wrapping the process of making API requests and managing conversational context.

### Basic Usage

Import the `Agent` class:

```javascript
import Agent from "./agent";
```

Manually set a properly configured `ModelAPIQueue` on the `Agent` class:

```javascript
import ModelAPIQueue from "./ModelAPIQueue";

Agent.api = new ModelAPIQueue(/*configuration*/);
```

Create a new agent using the `create()` static method:

```javascript
const agent = Agent.create();
```

This method takes an optional `config` object, which can include any properties that an OpenAI `CreateChatCompletionRequest` would accept, excluding the `messages` property, and an extra `head` property.

To interact with the agent, call the agent as a function:

```javascript
agent("Hello, agent!").then((newAgent) => {
    console.log(newAgent.content);
});
```

The `agent()` function makes an API request to OpenAI, then returns a new agent with the same config but an updated `head` representing the assistant's latest message. You can use this new agent to continue the conversation.

### Additional Agent Features

-   **System Messages**: Add system messages to the conversation using the `system` method. If the previous message was a system message, this will append to it instead of creating a new message.
-   **Extending an Agent**: Create a new agent with extra or changed configuration using the `extend` method. This new agent will maintain the same conversation `head`, but with a different configuration.
-   **Other Methods**: The `Agent` class includes several getter methods: `head`, `content`, and `messages` to access details about the agent and the conversation it maintains.
    -   `head`: the full message object of the head.
    -   `content`: the content string of the head message.
    -   `messages`: the complete message history of the Agent.

This module is written in TypeScript and includes type definitions for all methods and configurations.

## Roadmap

-   [x] Node.js support
-   [ ] Browser testing
-   [ ] Non-chat model support
