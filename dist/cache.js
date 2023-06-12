"use strict";
// src/request-cache.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestCache = void 0;
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const stringifySafe = require("json-stringify-safe");
class RequestCache {
    constructor() {
        this.cacheDir = path.join(os.homedir(), ".gpt-cache");
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir);
        }
    }
    sortObjectKeys(obj) {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(this.sortObjectKeys);
        }
        const sortedObj = {};
        Object.keys(obj)
            .sort()
            .forEach((key) => {
            // @ts-ignore
            sortedObj[key] = this.sortObjectKeys(obj[key]);
        });
        return sortedObj;
    }
    getRequestHash(request) {
        const sortedRequest = this.sortObjectKeys(request);
        const requestString = stringifySafe(sortedRequest);
        return crypto.createHash("md5").update(requestString).digest("hex");
    }
    getCache(request) {
        console.log(this.getRequestHash(request));
        const cacheFilePath = path.join(this.cacheDir, this.getRequestHash(request));
        if (fs.existsSync(cacheFilePath)) {
            const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
            return cachedData;
        }
        return null;
    }
    setCache(request, response) {
        const cacheFilePath = path.join(this.cacheDir, this.getRequestHash(request));
        fs.writeFileSync(cacheFilePath, JSON.stringify(response));
    }
}
exports.RequestCache = RequestCache;
