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
const uuid_1 = require("uuid");
const _ = require("lodash");
class Agent {
    static create(config = { model: "gpt-4", callId: 0 }, cost = 0) {
        const instance = new Agent(config, cost);
        const func = (content) => __awaiter(this, void 0, void 0, function* () { return yield instance.chat(content); });
        return new Proxy(func, {
            get: (target, prop, receiver) => {
                if (prop in target) {
                    return target[prop];
                }
                else {
                    // @ts-ignore
                    return typeof instance[prop] === "function"
                        ? // @ts-ignore
                            instance[prop].bind(instance)
                        : // @ts-ignore
                            instance[prop];
                }
            },
            set: (target, prop, value) => {
                if (prop in target) {
                    target[prop] = value;
                }
                else {
                    // @ts-ignore
                    instance[prop] = value;
                }
                return true;
            },
            apply: (target, thisArg, argumentsList) => {
                // @ts-ignore
                return target(...argumentsList);
            },
            construct: (target, argumentsList, newTarget) => {
                // @ts-ignore
                return new Agent(...argumentsList);
            },
        });
    }
    constructor(config, cost) {
        this._head = config.head || null;
        this._config = config;
        this.cost = cost;
        this.callId = config.callId || 0;
    }
    get head() {
        return Agent._dag.get(this._head);
    }
    get content() {
        return this.head.content;
    }
    get messages() {
        let currentUUID = this._head;
        const messages = [];
        while (currentUUID !== null) {
            const { content, role } = Agent._dag.get(currentUUID);
            messages.push({ content, role });
            currentUUID = Agent._dag.get(currentUUID).parent;
        }
        return messages.reverse();
    }
    extend(newConfig) {
        const mergedConfig = Object.assign(Object.assign(Object.assign({}, this._config), newConfig), { head: this._head });
        return Agent.create(mergedConfig);
    }
    chat(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const stashedHead = this._head;
            const uuid = this.createMessage(content, "user");
            this._head = uuid;
            const { content: apiResponse, cost } = yield this.callApi(this.messages);
            this._head = stashedHead;
            const assistantUuid = this.createMessage(apiResponse, "assistant", uuid);
            return this.createNewAgent(assistantUuid, cost);
        });
    }
    retry() {
        return __awaiter(this, void 0, void 0, function* () {
            let lastUserMessage = this.head;
            while ((lastUserMessage === null || lastUserMessage === void 0 ? void 0 : lastUserMessage.role) !== "user") {
                if (!(lastUserMessage === null || lastUserMessage === void 0 ? void 0 : lastUserMessage.parent))
                    throw new Error("No user message found for retry");
                lastUserMessage = Agent._dag.get(lastUserMessage.parent);
            }
            // Create a new agent that's based on the parent of the last user message
            const newAgentConfig = Object.assign(Object.assign({}, this._config), { head: lastUserMessage.parent, callId: this.callId + 1 });
            const newAgent = Agent.create(newAgentConfig, this.cost);
            // Then call chat on the new agent with the same message as before
            return newAgent.chat(lastUserMessage.content.split(" ").slice(1).join(" "));
        });
    }
    system(partial) {
        return this.createNewAgent(this.createMessage(partial, "system"), this.cost);
    }
    createMessage(content, role, parent = this._head) {
        const uuid = (0, uuid_1.v4)();
        if (role === "user") {
            content = `${this.callId.toString().padStart(2, "0")} ${content}`;
        }
        const message = { content, role, uuid, parent };
        Agent._dag.set(uuid, message);
        return uuid;
    }
    createNewAgent(head, cost) {
        const newConfig = Object.assign(Object.assign({}, this._config), { head, callId: this.callId });
        return Agent.create(newConfig, cost);
    }
    callApi(messages) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const request = Object.assign(Object.assign({}, _.omit(this._config, "head")), { messages });
            const response = yield Agent.api.request(request);
            if (!response) {
                throw new Error("unable to get api response");
            }
            const content = response.choices[0].message.content;
            const cost = this.cost +
                ((_a = response.usage) === null || _a === void 0 ? void 0 : _a.prompt_tokens) +
                ((_b = response.usage) === null || _b === void 0 ? void 0 : _b.completion_tokens) * 2;
            return { content, cost };
        });
    }
}
Agent._dag = new Map();
exports.default = Agent;
