"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackWorkflow = void 0;
const bson_1 = require("bson");
const error_1 = require("../../../error");
const utils_1 = require("../../../utils");
const providers_1 = require("../providers");
const token_entry_cache_1 = require("./token_entry_cache");
/* 5 minutes in milliseconds */
const TIMEOUT_MS = 300000;
/**
 * OIDC implementation of a callback based workflow.
 * @internal
 */
class CallbackWorkflow {
    /**
     * Instantiate the workflow
     */
    constructor() {
        this.cache = new token_entry_cache_1.TokenEntryCache();
    }
    /**
     * Get the document to add for speculative authentication. Is empty when
     * callbacks are in play.
     */
    speculativeAuth() {
        return Promise.resolve({});
    }
    /**
     * Execute the workflow.
     *
     * Steps:
     * - If an entry is in the cache
     *   - If it is not expired
     *     - Skip step one and use the entry to execute step two.
     *   - If it is expired
     *     - If the refresh callback exists
     *       - remove expired entry from cache
     *       - call the refresh callback.
     *       - put the new entry in the cache.
     *       - execute step two.
     *     - If the refresh callback does not exist.
     *       - remove expired entry from cache
     *       - call the request callback.
     *       - put the new entry in the cache.
     *       - execute step two.
     * - If no entry is in the cache.
     *   - execute step one.
     *   - call the refresh callback.
     *   - put the new entry in the cache.
     *   - execute step two.
     */
    async execute(connection, credentials, reauthenticate = false) {
        const request = credentials.mechanismProperties.REQUEST_TOKEN_CALLBACK;
        const refresh = credentials.mechanismProperties.REFRESH_TOKEN_CALLBACK;
        const entry = this.cache.getEntry(connection.address, credentials.username, request || null, refresh || null);
        if (entry) {
            // Check if the entry is not expired and if we are reauthenticating.
            if (!reauthenticate && entry.isValid()) {
                // Skip step one and execute the step two saslContinue.
                try {
                    const result = await finishAuth(entry.tokenResult, undefined, connection, credentials);
                    return result;
                }
                catch (error) {
                    // If authentication errors when using a cached token we remove it from
                    // the cache.
                    this.cache.deleteEntry(connection.address, credentials.username || '', request || null, refresh || null);
                    throw error;
                }
            }
            else {
                // Remove the expired entry from the cache.
                this.cache.deleteEntry(connection.address, credentials.username || '', request || null, refresh || null);
                // Execute a refresh of the token and finish auth.
                return this.refreshAndFinish(connection, credentials, entry.serverResult, entry.tokenResult);
            }
        }
        else {
            // No entry means to start with the step one saslStart.
            const result = await connection.commandAsync((0, utils_1.ns)(credentials.source), startCommandDocument(credentials), undefined);
            const stepOne = bson_1.BSON.deserialize(result.payload.buffer);
            // Call the request callback and finish auth.
            return this.requestAndFinish(connection, credentials, stepOne, result.conversationId);
        }
    }
    /**
     * Execute the refresh callback if it exists, otherwise the request callback, then
     * finish the authentication.
     */
    async refreshAndFinish(connection, credentials, stepOneResult, tokenResult, conversationId) {
        const request = credentials.mechanismProperties.REQUEST_TOKEN_CALLBACK;
        const refresh = credentials.mechanismProperties.REFRESH_TOKEN_CALLBACK;
        // If a refresh callback exists, use it. Otherwise use the request callback.
        if (refresh) {
            const result = await refresh(credentials.username, stepOneResult, tokenResult, TIMEOUT_MS);
            // Validate the result.
            if (!result || !result.accessToken) {
                throw new error_1.MongoMissingCredentialsError('REFRESH_TOKEN_CALLBACK must return a valid object with an accessToken');
            }
            // Cache a new entry and continue with the saslContinue.
            this.cache.addEntry(connection.address, credentials.username || '', request || null, refresh, result, stepOneResult);
            return finishAuth(result, conversationId, connection, credentials);
        }
        else {
            // Fallback to using the request callback.
            return this.requestAndFinish(connection, credentials, stepOneResult, conversationId);
        }
    }
    /**
     * Execute the request callback and finish authentication.
     */
    async requestAndFinish(connection, credentials, stepOneResult, conversationId) {
        // Call the request callback.
        const request = credentials.mechanismProperties.REQUEST_TOKEN_CALLBACK;
        const refresh = credentials.mechanismProperties.REFRESH_TOKEN_CALLBACK;
        // Always clear expired entries from the cache on each finish as cleanup.
        this.cache.deleteExpiredEntries();
        if (!request) {
            // Request callback must be present.
            throw new error_1.MongoInvalidArgumentError('Auth mechanism property REQUEST_TOKEN_CALLBACK is required.');
        }
        const tokenResult = await request(credentials.username, stepOneResult, TIMEOUT_MS);
        // Validate the result.
        if (!tokenResult || !tokenResult.accessToken) {
            throw new error_1.MongoMissingCredentialsError('REQUEST_TOKEN_CALLBACK must return a valid object with an accessToken');
        }
        // Cache a new entry and continue with the saslContinue.
        this.cache.addEntry(connection.address, credentials.username || '', request, refresh || null, tokenResult, stepOneResult);
        return finishAuth(tokenResult, conversationId, connection, credentials);
    }
}
exports.CallbackWorkflow = CallbackWorkflow;
/**
 * Cache the result of the user supplied callback and execute the
 * step two saslContinue.
 */
async function finishAuth(result, conversationId, connection, credentials) {
    // Execute the step two saslContinue.
    return connection.commandAsync((0, utils_1.ns)(credentials.source), continueCommandDocument(result.accessToken, conversationId), undefined);
}
/**
 * Generate the saslStart command document.
 */
function startCommandDocument(credentials) {
    const payload = {};
    if (credentials.username) {
        payload.n = credentials.username;
    }
    return {
        saslStart: 1,
        autoAuthorize: 1,
        mechanism: providers_1.AuthMechanism.MONGODB_OIDC,
        payload: new bson_1.Binary(bson_1.BSON.serialize(payload))
    };
}
/**
 * Generate the saslContinue command document.
 */
function continueCommandDocument(token, conversationId) {
    if (conversationId) {
        return {
            saslContinue: 1,
            conversationId: conversationId,
            payload: new bson_1.Binary(bson_1.BSON.serialize({ jwt: token }))
        };
    }
    // saslContinue requires a conversationId in the command to be valid so in this
    // case the server allows "step two" to actually be a saslStart with the token
    // as the jwt since the use of the cached value has no correlating conversating
    // on the particular connection.
    return {
        saslStart: 1,
        mechanism: providers_1.AuthMechanism.MONGODB_OIDC,
        payload: new bson_1.Binary(bson_1.BSON.serialize({ jwt: token }))
    };
}
//# sourceMappingURL=callback_workflow.js.map