export declare class RequestCache {
    private cacheDir;
    constructor();
    private sortObjectKeys;
    private getRequestHash;
    getCache(request: object): object | null;
    setCache(request: object, response: object): void;
}
