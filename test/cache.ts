//cache.test.ts

import { expect } from "chai";
import { RequestCache } from "../src/cache";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";

describe("RequestCache", () => {
    let requestCache: RequestCache;
    const cacheDir = path.join(os.homedir(), ".gpt-cache");

    beforeEach(() => {
        requestCache = new RequestCache();
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
    });

    afterEach(() => {
        rimraf.sync(cacheDir);
    });

    describe("getCache", () => {
        it("returns null if no cache exists for the given request", () => {
            const request = { url: "https://example.com" };
            const result = requestCache.getCache(request);
            expect(result).to.be.null;
        });

        it("returns cached response if cache exists for the given request", () => {
            const request = { url: "https://example.com" };
            const cachedResponse = { data: "example data" };
            const requestHash = requestCache["getRequestHash"](request);
            fs.writeFileSync(
                path.join(cacheDir, requestHash),
                JSON.stringify(cachedResponse)
            );

            const result = requestCache.getCache(request);
            expect(result).to.deep.equal(cachedResponse);
        });
    });

    describe("setCache", () => {
        it("creates a cache file for the given request and response", () => {
            const request = { url: "https://example.com" };
            const response = { data: "example data" };

            requestCache.setCache(request, response);
            const requestHash = requestCache["getRequestHash"](request);
            const cacheFilePath = path.join(cacheDir, requestHash);
            expect(fs.existsSync(cacheFilePath)).to.be.true;
            const cachedData = JSON.parse(
                fs.readFileSync(cacheFilePath, "utf-8")
            );
            expect(cachedData).to.deep.equal(response);
        });
    });

    describe("getRequestHash", () => {
        it("returns the same hash for identical requests", () => {
            const request1 = {
                url: "https://example.com",
                headers: { "x-api-key": "12345" },
            };
            const request2 = {
                headers: { "x-api-key": "12345" },
                url: "https://example.com",
            };

            const hash1 = requestCache["getRequestHash"](request1);
            const hash2 = requestCache["getRequestHash"](request2);

            expect(hash1).to.equal(hash2);
        });

        it("returns different hashes for different requests", () => {
            const request1 = {
                url: "https://example.com",
                headers: { "x-api-key": "12345" },
            };
            const request2 = {
                url: "https://example.com",
                headers: { "x-api-key": "67890" },
            };

            const hash1 = requestCache["getRequestHash"](request1);
            const hash2 = requestCache["getRequestHash"](request2);

            expect(hash1).to.not.equal(hash2);
        });
    });
});
