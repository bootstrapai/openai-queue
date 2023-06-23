// src/request-cache.ts

import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as stringifySafe from "json-stringify-safe";

export class RequestCache {
    private cacheDir: string;

    constructor() {
        this.cacheDir = path.join(os.homedir(), ".gpt-cache");
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir);
        }
    }

    private sortObjectKeys(obj: object): object {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(this.sortObjectKeys.bind(this));
        }

        const sortedObj: { [key: string]: any } = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
                // @ts-ignore
                sortedObj[key] = this.sortObjectKeys(obj[key]);
            });

        return sortedObj;
    }

    private getRequestHash(request: object): string {
        const sortedRequest = this.sortObjectKeys(request);
        const requestString = stringifySafe(sortedRequest);
        return crypto.createHash("md5").update(requestString).digest("hex");
    }

    getCache(request: object): object | null {
        const cacheFilePath = path.join(
            this.cacheDir,
            this.getRequestHash(request)
        );
        if (fs.existsSync(cacheFilePath)) {
            const cachedData = JSON.parse(
                fs.readFileSync(cacheFilePath, "utf-8")
            );
            return cachedData;
        }
        return null;
    }

    setCache(request: object, response: object): void {
        const cacheFilePath = path.join(
            this.cacheDir,
            this.getRequestHash(request)
        );
        fs.writeFileSync(cacheFilePath, JSON.stringify(response));
    }
}
