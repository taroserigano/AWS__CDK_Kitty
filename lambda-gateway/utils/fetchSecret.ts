import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";

const secretClient = new SecretsManagerClient({});

export const fetchSecret = async (
  secretId: string
): Promise<string | undefined> => {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await secretClient.send(command);

    if (!response.SecretString) {
      console.warn("SecretString is undefined");
      return undefined;
    }

    return response.SecretString;
  } catch (error) {
    console.error("Error fetching secret:", error);
    return undefined;
  }
};
