import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as apigateway_integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import { SecretsStack } from "./secret-stack";

export class LambdaGatewayStack extends cdk.Stack {
  private readonly secretsStack: SecretsStack;
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { secretsStack: SecretsStack }
  ) {
    super(scope, id, props);
    this.secretsStack = props.secretsStack;

    const exampleLambda = new NodejsFunction(this, "ExampleHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "lambdaExample",
      functionName: `${this.stackName}-cdk-course-example-lambda`,
    });
    new cdk.CfnOutput(this, "ExampleLambdaArn", {
      value: exampleLambda.functionArn,
      description: "The ARN of the example lambda function",
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'LambdaGatewayQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const homeLambda = new NodejsFunction(this, "HomeHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "homeRoute",
      functionName: `${this.stackName}-home-route-lambda`,
    });

    const profileLambda = new NodejsFunction(this, "ProfileHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "createProfile",
      functionName: `${this.stackName}-profile-lambda`,
    });

    const getUsersLambda = new NodejsFunction(this, "GetUsersHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "getUsers",
      functionName: `${this.stackName}-get-users-lambda`,
    });

    const deleteUserLambda = new NodejsFunction(this, "DeleteUserHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "deleteUser",
      functionName: `${this.stackName}-delete-user-lambda`,
    });

    const getQuoteLambda = new NodejsFunction(this, "GetQuoteHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "getRandomQuote",
      functionName: `${this.stackName}-get-quote-lambda`,
    });

    const getStatsLambda = new NodejsFunction(this, "GetStatsHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "getStats",
      functionName: `${this.stackName}-get-stats-lambda`,
    });

    // add login lambda below
    const loginLambda = new NodejsFunction(this, "LoginHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../src/lambda/handler.ts"),
      handler: "loginRoute",
      functionName: `${this.stackName}-login-route-lambda`,
    });

    const httpApi = new apigateway.HttpApi(this, "FirstApi", {
      apiName: "First API",
      description: "First API with CDK",
      corsPreflight: {
        allowOrigins: ["http://localhost:3000", "https://*"],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["*"],
        allowCredentials: false,
      },
    });

    httpApi.addRoutes({
      path: "/",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "HomeIntegration",
        homeLambda
      ),
    });

    httpApi.addRoutes({
      path: "/profile",
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "ProfileIntegration",
        profileLambda
      ),
    });

    httpApi.addRoutes({
      path: "/users",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "GetUsersIntegration",
        getUsersLambda
      ),
    });

    httpApi.addRoutes({
      path: "/users/{id}",
      methods: [apigateway.HttpMethod.DELETE],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "DeleteUserIntegration",
        deleteUserLambda
      ),
    });

    httpApi.addRoutes({
      path: "/quote",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "GetQuoteIntegration",
        getQuoteLambda
      ),
    });

    httpApi.addRoutes({
      path: "/stats",
      methods: [apigateway.HttpMethod.GET],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "GetStatsIntegration",
        getStatsLambda
      ),
    });

    httpApi.addRoutes({
      path: "/login",
      methods: [apigateway.HttpMethod.POST],
      integration: new apigateway_integrations.HttpLambdaIntegration(
        "LoginIntegration",
        loginLambda
      ),
    });

    // Add environment variable with secret reference
    loginLambda.addEnvironment(
      "SECRET_ID",
      this.secretsStack.secret.secretName
    );

    // Add IAM policy to allow Lambda to access Secrets Manager
    loginLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ],
        resources: [this.secretsStack.secret.secretArn],
      })
    );

    // Grant the login lambda permission to read the secret
    this.secretsStack.secret.grantRead(loginLambda);

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: httpApi.url ?? "",
      description: "The URL of the HTTP API",
    });
  }
}
