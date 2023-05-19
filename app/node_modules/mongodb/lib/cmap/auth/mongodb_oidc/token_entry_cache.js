"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenEntryCache = exports.TokenEntry = void 0;
/* 5 minutes in milliseonds */
const EXPIRATION_BUFFER_MS = 300000;
/* Default expiration is now for when no expiration provided */
const DEFAULT_EXPIRATION_SECS = 0;
/* Counter for function "hashes".*/
let FN_HASH_COUNTER = 0;
/* No function present function */
const NO_FUNCTION = () => {
    return Promise.resolve({ accessToken: 'test' });
};
/* The map of function hashes */
const FN_HASHES = new WeakMap();
/* Put the no function hash in the map. */
FN_HASHES.set(NO_FUNCTION, FN_HASH_COUNTER);
/** @internal */
class TokenEntry {
    /**
     * Instantiate the entry.
     */
    constructor(tokenResult, serverResult, expiration) {
        this.tokenResult = tokenResult;
        this.serverResult = serverResult;
        this.expiration = expiration;
    }
    /**
     * The entry is still valid if the expiration is more than
     * 5 minutes from the expiration time.
     */
    isValid() {
        return this.expiration - Date.now() > EXPIRATION_BUFFER_MS;
    }
}
exports.TokenEntry = TokenEntry;
/**
 * Cache of OIDC token entries.
 * @internal
 */
class TokenEntryCache {
    constructor() {
        this.entries = new Map();
    }
    /**
     * Set an entry in the token cache.
     */
    addEntry(address, username, requestFn, refreshFn, tokenResult, serverResult) {
        const entry = new TokenEntry(tokenResult, serverResult, expirationTime(tokenResult.expiresInSeconds));
        this.entries.set(cacheKey(address, username, requestFn, refreshFn), entry);
        return entry;
    }
    /**
     * Clear the cache.
     */
    clear() {
        this.entries.clear();
    }
    /**
     * Delete an entry from the cache.
     */
    deleteEntry(address, username, requestFn, refreshFn) {
        this.entries.delete(cacheKey(address, username, requestFn, refreshFn));
    }
    /**
     * Get an entry from the cache.
     */
    getEntry(address, username, requestFn, refreshFn) {
        return this.entries.get(cacheKey(address, username, requestFn, refreshFn));
    }
    /**
     * Delete all expired entries from the cache.
     */
    deleteExpiredEntries() {
        for (const [key, entry] of this.entries) {
            if (!entry.isValid()) {
                this.entries.delete(key);
            }
        }
    }
}
exports.TokenEntryCache = TokenEntryCache;
/**
 * Get an expiration time in milliseconds past epoch. Defaults to immediate.
 */
function expirationTime(expiresInSeconds) {
    return Date.now() + (expiresInSeconds ?? DEFAULT_EXPIRATION_SECS) * 1000;
}
/**
 * Create a cache key from the address and username.
 */
function cacheKey(address, username, requestFn, refreshFn) {
    return `${address}-${username}-${hashFunctions(requestFn, refreshFn)}`;
}
/**
 * Get the hash string for the request and refresh functions.
 */
function hashFunctions(requestFn, refreshFn) {
    let requestHash = FN_HASHES.get(requestFn || NO_FUNCTION);
    let refreshHash = FN_HASHES.get(refreshFn || NO_FUNCTION);
    if (!requestHash && requestFn) {
        // Create a new one for the function and put it in the map.
        FN_HASH_COUNTER++;
        requestHash = FN_HASH_COUNTER;
        FN_HASHES.set(requestFn, FN_HASH_COUNTER);
    }
    if (!refreshHash && refreshFn) {
        // Create a new one for the function and put it in the map.
        FN_HASH_COUNTER++;
        refreshHash = FN_HASH_COUNTER;
        FN_HASHES.set(refreshFn, FN_HASH_COUNTER);
    }
    return `${requestHash}-${refreshHash}`;
}
//# sourceMappingURL=token_entry_cache.js.map