"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsServiceWorkflow = void 0;
const promises_1 = require("fs/promises");
const error_1 = require("../../../error");
const service_workflow_1 = require("./service_workflow");
/**
 * Device workflow implementation for AWS.
 *
 * @internal
 */
class AwsServiceWorkflow extends service_workflow_1.ServiceWorkflow {
    constructor() {
        super();
    }
    /**
     * Get the token from the environment.
     */
    async getToken() {
        const tokenFile = process.env.AWS_WEB_IDENTITY_TOKEN_FILE;
        if (!tokenFile) {
            throw new error_1.MongoAWSError('AWS_WEB_IDENTITY_TOKEN_FILE must be set in the environment.');
        }
        return (0, promises_1.readFile)(tokenFile, 'utf8');
    }
}
exports.AwsServiceWorkflow = AwsServiceWorkflow;
//# sourceMappingURL=aws_service_workflow.js.map