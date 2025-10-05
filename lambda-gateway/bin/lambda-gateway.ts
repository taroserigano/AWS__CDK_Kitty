#!/usr/bin/env node
// Shebang line - allows this file to be executed directly as a Node.js script

// Import AWS CDK core library - provides fundamental CDK constructs
import * as cdk from "aws-cdk-lib";

// Import our custom stack definitions
import { LambdaGatewayStack } from "../lib/lambda-gateway-stack";
import { SecretsStack } from "../lib/secret-stack";

// Create a new CDK application instance
// This is the root of your CDK app and manages all stacks
const app = new cdk.App();

// Create the Secrets Stack first
// This stack contains AWS Secrets Manager secret that other stacks depend on
// Parameters:
//   - app: The CDK app instance (parent construct)
//   - "SecretsStack": Logical ID for CloudFormation stack
const secretsStack = new SecretsStack(app, "SecretsStack");

// Create the Lambda Gateway Stack
// This stack contains Lambda functions, API Gateway, and routes
// Parameters:
//   - app: The CDK app instance (parent construct)
//   - "LambdaGatewayStack": Logical ID for CloudFormation stack
//   - { secretsStack }: Pass the secrets stack so Lambda can access secrets
const lambdaStack = new LambdaGatewayStack(app, "LambdaGatewayStack", {
  secretsStack,
});

// Add explicit dependency: LambdaGatewayStack must wait for SecretsStack to deploy first
// This ensures the secret exists before Lambda functions try to access it
lambdaStack.addDependency(secretsStack);
