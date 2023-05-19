"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBOIDC = exports.OIDC_WORKFLOWS = void 0;
const error_1 = require("../../error");
const auth_provider_1 = require("./auth_provider");
const aws_service_workflow_1 = require("./mongodb_oidc/aws_service_workflow");
const callback_workflow_1 = require("./mongodb_oidc/callback_workflow");
/** @internal */
exports.OIDC_WORKFLOWS = new Map();
exports.OIDC_WORKFLOWS.set('callback', new callback_workflow_1.CallbackWorkflow());
exports.OIDC_WORKFLOWS.set('aws', new aws_service_workflow_1.AwsServiceWorkflow());
/**
 * OIDC auth provider.
 * @experimental
 */
class MongoDBOIDC extends auth_provider_1.AuthProvider {
    /**
     * Instantiate the auth provider.
     */
    constructor() {
        super();
    }
    /**
     * Authenticate using OIDC
     */
    async auth(authContext) {
        const { connection, credentials, response, reauthenticating } = authContext;
        if (response?.speculativeAuthenticate) {
            return;
        }
        if (!credentials) {
            throw new error_1.MongoMissingCredentialsError('AuthContext must provide credentials.');
        }
        const workflow = getWorkflow(credentials);
        await workflow.execute(connection, credentials, reauthenticating);
    }
    /**
     * Add the speculative auth for the initial handshake.
     */
    async prepare(handshakeDoc, authContext) {
        const { credentials } = authContext;
        if (!credentials) {
            throw new error_1.MongoMissingCredentialsError('AuthContext must provide credentials.');
        }
        const workflow = getWorkflow(credentials);
        const result = await workflow.speculativeAuth();
        return { ...handshakeDoc, ...result };
    }
}
exports.MongoDBOIDC = MongoDBOIDC;
/**
 * Gets either a device workflow or callback workflow.
 */
function getWorkflow(credentials) {
    const providerName = credentials.mechanismProperties.PROVIDER_NAME;
    const workflow = exports.OIDC_WORKFLOWS.get(providerName || 'callback');
    if (!workflow) {
        throw new error_1.MongoInvalidArgumentError(`Could not load workflow for provider ${credentials.mechanismProperties.PROVIDER_NAME}`);
    }
    return workflow;
}
//# sourceMappingURL=mongodb_oidc.js.map