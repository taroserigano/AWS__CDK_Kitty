// Import AWS CDK core library - provides fundamental CDK constructs
import * as cdk from "aws-cdk-lib";
// Import Construct base class - all CDK constructs extend this
import { Construct } from "constructs";
// Import AWS Lambda construct for creating serverless functions
import * as lambda from "aws-cdk-lib/aws-lambda";
// Import NodejsFunction for TypeScript/JavaScript Lambda functions with automatic bundling
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
// Import path module for working with file paths
import * as path from "path";
// Import API Gateway V2 (HTTP API) for creating REST APIs
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
// Import API Gateway integrations for connecting routes to Lambda functions
import * as apigateway_integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
// Import IAM for managing permissions and policies
import * as iam from "aws-cdk-lib/aws-iam";
// Import our SecretsStack to access the secrets
import { SecretsStack } from "./secret-stack";

/**
 * LambdaGatewayStack - Main CDK Stack for Lambda functions and API Gateway
 *
 * This stack creates:
 * - Multiple Lambda functions for different API endpoints
 * - HTTP API Gateway with CORS configuration
 * - Routes connecting API endpoints to Lambda functions
 * - IAM permissions for Lambda to access Secrets Manager
 */
export class LambdaGatewayStack extends cdk.Stack {
  // Private field to store reference to SecretsStack
  private readonly secretsStack: SecretsStack;

  /**
   * Constructor for LambdaGatewayStack
   *
   * @param scope - Parent construct (usually the CDK App)
   * @param id - Logical ID for this stack in CloudFormation
   * @param props - Stack properties including the required secretsStack reference
   */
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { secretsStack: SecretsStack }
  ) {
    // Call parent class constructor
    super(scope, id, props);
    // Store the SecretsStack reference for later use
    this.secretsStack = props.secretsStack;

    // ========================================
    // Example Lambda Function (for learning)
    // ========================================
    const exampleLambda = new NodejsFunction(this, "ExampleHandler", {
      // Use Node.js 22.x runtime
      runtime: lambda.Runtime.NODEJS_22_X,
      // Path to the TypeScript file containing the handler
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      // Name of the exported function to use as handler
      handler: "lambdaExample",
      // AWS Lambda function name (must be unique in your AWS account/region)
      functionName: `${this.stackName}-cdk-course-example-lambda`,
    });

    // Output the Lambda function ARN for reference
    new cdk.CfnOutput(this, "ExampleLambdaArn", {
      value: exampleLambda.functionArn,
      description: "The ARN of the example lambda function",
    });

    // ========================================
    // Home Route Lambda - Returns welcome message
    // ========================================
    const homeLambda = new NodejsFunction(this, "HomeHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "homeRoute", // Maps to 'export const homeRoute' in handler.ts
      functionName: `${this.stackName}-home-route-lambda`,
    });

    // ========================================
    // Profile Lambda - Creates user profiles
    // ========================================
    const profileLambda = new NodejsFunction(this, "ProfileHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "createProfile", // Maps to 'export const createProfile' in handler.ts
      functionName: `${this.stackName}-profile-lambda`,
    });

    // ========================================
    // Get Users Lambda - Retrieves all users
    // ========================================
    const getUsersLambda = new NodejsFunction(this, "GetUsersHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "getUsers", // Maps to 'export const getUsers' in handler.ts
      functionName: `${this.stackName}-get-users-lambda`,
    });

    // ========================================
    // Delete User Lambda - Removes a user by ID
    // ========================================
    const deleteUserLambda = new NodejsFunction(this, "DeleteUserHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "deleteUser", // Maps to 'export const deleteUser' in handler.ts
      functionName: `${this.stackName}-delete-user-lambda`,
    });

    // ========================================
    // Get Quote Lambda - Returns random inspirational quotes
    // ========================================
    const getQuoteLambda = new NodejsFunction(this, "GetQuoteHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "getRandomQuote", // Maps to 'export const getRandomQuote' in handler.ts
      functionName: `${this.stackName}-get-quote-lambda`,
    });

    // ========================================
    // Get Stats Lambda - Returns API statistics
    // ========================================
    const getStatsLambda = new NodejsFunction(this, "GetStatsHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "getStats", // Maps to 'export const getStats' in handler.ts
      functionName: `${this.stackName}-get-stats-lambda`,
    });

    // ========================================
    // Login Lambda - Authenticates users using Secrets Manager
    // This function accesses AWS Secrets Manager to hash usernames
    // ========================================
    const loginLambda = new NodejsFunction(this, "LoginHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "loginRoute", // Maps to 'export const loginRoute' in handler.ts
      functionName: `${this.stackName}-login-route-lambda`,
    });

    // ========================================
    // Create HTTP API Gateway
    // ========================================
    const httpApi = new apigateway.HttpApi(this, "FirstApi", {
      apiName: "First API",
      description: "First API with CDK",
      // CORS (Cross-Origin Resource Sharing) configuration
      // Allows frontend on localhost:3000 to call this API
      corsPreflight: {
        // Origins that can make requests (your frontend URLs)
        // Use apigateway.CorsHttpMethod.ANY to allow all origins
        allowOrigins: ["*"], // Allow all origins (use specific origins in production)
        // HTTP methods that are allowed
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS, // Required for CORS preflight
        ],
        // Headers that can be included in requests
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent",
        ],
        allowCredentials: false, // Don't allow cookies/credentials
      },
    });

    // ========================================
    // API ROUTES - Connect endpoints to Lambda functions
    // ========================================

    // Route: GET / - Home/Welcome endpoint
    httpApi.addRoutes({
      path: "/", // API endpoint path
      methods: [apigateway.HttpMethod.GET], // HTTP method(s) allowed
      // Create integration between API Gateway and Lambda
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "HomeIntegration", // Logical name for this integration
        homeLambda // Lambda function to invoke
      ),
    });

    // Route: POST /profile - Create new user profile
    httpApi.addRoutes({
      path: "/profile",
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "ProfileIntegration",
        profileLambda
      ),
    });

    // Route: GET /users - Retrieve all users
    httpApi.addRoutes({
      path: "/users",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "GetUsersIntegration",
        getUsersLambda
      ),
    });

    // Route: DELETE /users/{id} - Delete user by ID
    // The {id} is a path parameter that will be passed to the Lambda
    httpApi.addRoutes({
      path: "/users/{id}", // {id} is extracted and sent to Lambda
      methods: [apigateway.HttpMethod.DELETE],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "DeleteUserIntegration",
        deleteUserLambda
      ),
    });

    // Route: GET /quote - Get random inspirational quote
    httpApi.addRoutes({
      path: "/quote",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "GetQuoteIntegration",
        getQuoteLambda
      ),
    });

    // Route: GET /stats - Get API usage statistics
    httpApi.addRoutes({
      path: "/stats",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "GetStatsIntegration",
        getStatsLambda
      ),
    });

    // Route: POST /login - Login endpoint (uses Secrets Manager)
    httpApi.addRoutes({
      path: "/login",
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "LoginIntegration",
        loginLambda
      ),
    });

    // ========================================
    // Configure Login Lambda to use Secrets Manager
    // ========================================

    // Add environment variable to Login Lambda
    // This makes the secret name available as process.env.SECRET_ID
    loginLambda.addEnvironment(
      "SECRET_ID", // Environment variable name
      this.secretsStack.secret.secretName // Value: "my-app-secret"
    );

    // Add IAM policy to allow Login Lambda to read from Secrets Manager
    // This explicitly grants the Lambda function permission to access the secret
    loginLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW, // Grant permission (not deny)
        actions: [
          // Actions the Lambda can perform on Secrets Manager
          "secretsmanager:GetSecretValue", // Read the secret value
          "secretsmanager:DescribeSecret", // Get metadata about the secret
        ],
        // Specific secret ARN this policy applies to
        resources: [this.secretsStack.secret.secretArn],
      })
    );

    // Alternative: Use grantRead() convenience method (does the same thing)
    // Both addToRolePolicy and grantRead() grant the same permissions
    // grantRead() is simpler and recommended for CDK
    this.secretsStack.secret.grantRead(loginLambda);

    // ========================================
    // CloudFormation Outputs
    // ========================================

    // Output the API Gateway URL so you can access your API
    // This URL is displayed after deployment and can be used in your frontend
    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: httpApi.url ?? "", // API Gateway base URL
      description: "The URL of the HTTP API",
    });
  }
}
