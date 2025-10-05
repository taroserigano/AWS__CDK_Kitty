// Import AWS CDK core library for fundamental constructs
import * as cdk from "aws-cdk-lib";
// Import Construct base class - all CDK constructs extend this
import { Construct } from "constructs";
// Import AWS Secrets Manager construct for secure secret storage
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

/**
 * SecretsStack - CDK Stack for managing AWS Secrets Manager secrets
 *
 * This stack creates and manages secrets that can be accessed by other stacks.
 * Secrets are used to store sensitive data like API keys, passwords, or encryption keys.
 */
export class SecretsStack extends cdk.Stack {
  // Public readonly property allows other stacks to access this secret
  // The 'readonly' keyword prevents modification after initialization
  public readonly secret: secretsmanager.Secret;

  /**
   * Constructor for SecretsStack
   *
   * @param scope - Parent construct (usually the CDK App)
   * @param id - Logical ID for this stack in CloudFormation
   * @param props - Optional stack properties (region, account, etc.)
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Call parent class constructor to initialize the Stack
    super(scope, id, props);

    // Create a new AWS Secrets Manager secret
    this.secret = new secretsmanager.Secret(this, "MyAppSecret", {
      // Name of the secret in AWS Secrets Manager (must be unique in region)
      secretName: "my-app-secret",
      // Initial value of the secret (empty JSON object)
      // You should manually add key-value pairs in AWS Console, e.g.:
      // { "encryptionKey": "your-secret-key-here" }
      secretObjectValue: {},
    });

    // Set removal policy to DESTROY
    // This means the secret will be DELETED when the stack is destroyed
    // WARNING: In production, consider using RETAIN to prevent accidental deletion
    this.secret.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create a CloudFormation Output to display the secret ARN after deployment
    // This ARN can be used to reference the secret in other AWS services
    new cdk.CfnOutput(this, "SecretArn", {
      value: this.secret.secretArn,
      description: "The ARN of the secret",
    });
  }
}
