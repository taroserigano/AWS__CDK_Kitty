// Import AWS SDK v3 Secrets Manager client and commands
// AWS SDK v3 uses modular imports for smaller bundle sizes
import {
  SecretsManagerClient, // Main client for Secrets Manager operations
  GetSecretValueCommand, // Command to retrieve secret values
  GetSecretValueCommandOutput, // TypeScript type for the command output
} from "@aws-sdk/client-secrets-manager";

/**
 * Create a single Secrets Manager client instance
 * This client is reused across Lambda invocations for better performance
 * The empty {} means use default AWS credentials and region from Lambda environment
 */
const secretClient = new SecretsManagerClient({});

/**
 * Fetch a secret value from AWS Secrets Manager
 *
 * This utility function retrieves secrets stored in AWS Secrets Manager.
 * It's used by Lambda functions to access sensitive data like API keys,
 * database passwords, or encryption keys without hardcoding them.
 *
 * @param secretId - The name or ARN of the secret to retrieve (e.g., "my-app-secret")
 * @returns The secret string value, or undefined if an error occurs
 *
 * @example
 * const secret = await fetchSecret("my-app-secret");
 * const { encryptionKey } = JSON.parse(secret);
 */
export const fetchSecret = async (
  secretId: string
): Promise<string | undefined> => {
  try {
    // Create a command to get the secret value
    // SecretId can be the secret name or full ARN
    const command = new GetSecretValueCommand({ SecretId: secretId });

    // Send the command to AWS Secrets Manager
    // This makes an API call to retrieve the secret
    const response = await secretClient.send(command);

    // Check if the secret string exists in the response
    // Secrets Manager can store strings or binary data
    if (!response.SecretString) {
      console.warn("SecretString is undefined");
      return undefined;
    }

    // Return the secret value as a string
    // Typically this is a JSON string that you'll need to parse
    return response.SecretString;
  } catch (error) {
    // Log the error for CloudWatch Logs (useful for debugging)
    console.error("Error fetching secret:", error);
    // Return undefined instead of throwing to allow graceful error handling
    return undefined;
  }
};
