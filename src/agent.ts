import { v4 as uuidv4 } from "uuid";
import {
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    ChatCompletionRequestMessageRoleEnum,
} from "openai";
import * as _ from "lodash";
import APIQueue from "./";

interface Message {
    content: string;
    role: ChatCompletionRequestMessageRoleEnum;
    uuid: string;
    parent: string | null;
}

export interface Config extends Omit<CreateChatCompletionRequest, "messages"> {
    head?: string | null;
}

type ProxiedFunction = (content: string) => Promise<ProxiedAgent>;
type ProxiedAgent = ProxiedFunction & InstanceType<typeof Agent>;

export default class Agent {
    static api: APIQueue;
    private static _dag: Map<string, Message> = new Map();

    private _head: string | null;
    private _config: Config;

    public static create(config: Config = { model: "gpt-4" }): ProxiedAgent {
        const instance = new Agent(config);
        const func: ProxiedFunction = async (
            content: string
        ): Promise<ProxiedAgent> => await instance.chat(content);

        return new Proxy(func, {
            get: (target: any, prop: string, receiver: any): any => {
                if (prop in target) {
                    return target[prop];
                } else {
                    // @ts-ignore
                    return typeof instance[prop] === "function"
                        ? // @ts-ignore
                          instance[prop].bind(instance)
                        : // @ts-ignore
                          instance[prop];
                }
            },
            set: (target: any, prop: string, value: any): boolean => {
                if (prop in target) {
                    target[prop] = value;
                } else {
                    // @ts-ignore
                    instance[prop] = value;
                }
                return true;
            },
            apply: (
                target: ProxiedFunction,
                thisArg: any,
                argumentsList: any[]
            ): any => {
                // @ts-ignore
                return target(...argumentsList);
            },
            construct: (
                target: any,
                argumentsList: any[],
                newTarget: any
            ): any => {
                // @ts-ignore
                return new Agent(...argumentsList);
            },
        }) as ProxiedAgent;
    }

    constructor(config: Config) {
        this._head = config.head || null;
        this._config = config;
    }

    get head(): Message | undefined {
        return Agent._dag.get(this._head!);
    }

    get content(): string {
        return this.head!.content;
    }

    get messages(): CreateChatCompletionRequest["messages"] {
        let currentUUID = this._head;
        const messages: CreateChatCompletionRequest["messages"] = [];

        while (currentUUID !== null) {
            const { content, role } = Agent._dag.get(currentUUID)!;
            messages.push({ content, role });
            currentUUID = Agent._dag.get(currentUUID)!.parent;
        }

        return messages.reverse();
    }

    public extend(newConfig: Config): ProxiedAgent {
        const mergedConfig: Config = {
            ...this._config,
            ...newConfig,
            head: this._head,
        };
        return Agent.create(mergedConfig);
    }

    public async chat(content: string): Promise<ProxiedAgent> {
        const uuid: string = this.createMessage(content, "user");
        this._head = uuid;
        const apiResponse: string = await this.callApi(this.messages);
        const assistantUuid: string = this.createMessage(
            apiResponse,
            "assistant",
            uuid
        );
        return this.createNewAgent(assistantUuid);
    }

    public system(partial: string, append: boolean = false): ProxiedAgent {
        if (this.head?.role !== "system") {
            return this.createNewAgent(this.createMessage(partial, "system"));
        } else {
            return this.createSiblingMessageAndReturnNewAgent(partial, append);
        }
    }

    private createMessage(
        content: string,
        role: ChatCompletionRequestMessageRoleEnum,
        parent: string | null = this._head
    ): string {
        const uuid = uuidv4();
        const message: Message = { content, role, uuid, parent };
        Agent._dag.set(uuid, message);
        return uuid;
    }

    private createNewAgent(head: string): ProxiedAgent {
        const newConfig: Config = { ...this._config, head };
        return Agent.create(newConfig);
    }

    private createSiblingMessageAndReturnNewAgent(
        partial: string,
        append: boolean
    ): ProxiedAgent {
        const { content: existingMessage } = this.head!;
        const [first, second] = append
            ? [existingMessage, partial]
            : [partial, existingMessage];
        const combinedContent = `${first}${
            first.endsWith("\n") || second.startsWith("\n") ? "" : "\n"
        }${second}`;
        return this.createNewAgent(
            this.createMessage(combinedContent, "system", this.head!.parent)
        );
    }

    private async callApi(
        messages: CreateChatCompletionRequest["messages"]
    ): Promise<string> {
        const request: CreateChatCompletionRequest = {
            ..._.omit(this._config, "head"),
            messages,
        };
        const response: CreateChatCompletionResponse | null =
            await Agent.api.request(request);

        if (!response) {
            throw new Error("unable to get api response");
        }
        return response!.choices[0]!.message!.content;
    }
}
