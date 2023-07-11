import { CreateChatCompletionRequest, ChatCompletionRequestMessageRoleEnum } from "openai";
import APIQueue from "./";
interface Message {
    content: string;
    role: ChatCompletionRequestMessageRoleEnum;
    uuid: string;
    parent: string | null;
}
export interface Config extends Omit<CreateChatCompletionRequest, "messages"> {
    head?: string | null;
    callId?: number;
}
type ProxiedFunction = (content: string) => Promise<ProxiedAgent>;
type ProxiedAgent = ProxiedFunction & InstanceType<typeof Agent>;
export default class Agent {
    static api: APIQueue;
    cost: number;
    private static _dag;
    private _head;
    private _config;
    private callId;
    static create(config?: Config, cost?: number): ProxiedAgent;
    constructor(config: Config, cost: number);
    get head(): Message | undefined;
    get content(): string;
    get messages(): CreateChatCompletionRequest["messages"];
    extend(newConfig: Config): ProxiedAgent;
    chat(content: string): Promise<ProxiedAgent>;
    retry(): Promise<ProxiedAgent>;
    system(partial: string): ProxiedAgent;
    private createMessage;
    private createNewAgent;
    private callApi;
}
export {};
