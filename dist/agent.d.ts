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
}
type ProxiedFunction = (content: string) => Promise<ProxiedAgent>;
type ProxiedAgent = ProxiedFunction & InstanceType<typeof Agent>;
export default class Agent {
    static api: APIQueue;
    private static _dag;
    private _head;
    private _config;
    static create(config?: Config): ProxiedAgent;
    constructor(config: Config);
    get head(): Message | undefined;
    get content(): string;
    get messages(): CreateChatCompletionRequest["messages"];
    extend(newConfig: Config): ProxiedAgent;
    chat(content: string): Promise<ProxiedAgent>;
    system(partial: string, append?: boolean): ProxiedAgent;
    private createMessage;
    private createNewAgent;
    private createSiblingMessageAndReturnNewAgent;
    private callApi;
}
export {};
