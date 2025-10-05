/**
 * Lambda Handler Functions for API Gateway
 *
 * This file contains all Lambda function handlers that process API requests.
 * Each handler corresponds to a specific API endpoint defined in the CDK stack.
 */

// Import AWS Lambda types for API Gateway V2 events
import type { APIGatewayProxyEventV2 } from "aws-lambda";
// Import utility function to fetch secrets from AWS Secrets Manager
import { fetchSecret } from "../../utils/fetchSecret";
// Import Node.js crypto module for hashing and encryption
import * as crypto from "crypto";

/**
 * IN-MEMORY STORAGE - For demonstration purposes only!
 *
 * WARNING: Lambda containers are ephemeral and can be destroyed/recycled at any time.
 * Data stored in memory will be lost when:
 * - Lambda container is recycled (after ~15 minutes of inactivity)
 * - Different container handles the next request (AWS Load Balancing)
 * - Lambda is redeployed
 *
 * FOR PRODUCTION: Use persistent storage like:
 * - DynamoDB (serverless NoSQL database)
 * - RDS (relational database)
 * - S3 (object storage)
 */
let users: Array<{
  id: string; // Unique identifier for each user
  username: string; // User's display name
  email: string; // User's email address
  createdAt: string; // ISO 8601 timestamp of creation
}> = [];

// Track total number of API requests (also lost when container recycles)
let requestCount = 0;

/**
 * CORS Headers - Allow cross-origin requests from frontend
 *
 * These headers must be included in every response to allow
 * the Next.js frontend (running on localhost:3000) to call this API
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow requests from any origin (* = wildcard)
  "Access-Control-Allow-Headers": "Content-Type", // Allow Content-Type header
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", // Allowed HTTP methods
};

/**
 * Example Lambda Handler - Simple test function
 *
 * This is a basic handler for learning purposes.
 * It doesn't follow the proper API Gateway response format.
 *
 * @param event - Raw Lambda event object
 * @returns Simple message object (not properly formatted)
 */
export const lambdaExample = async (event: any) => {
  console.log("Event:", event); // Log full event for debugging
  return { message: "Hello ME!" }; // Simple response
};

/**
 * Home Route Handler - GET /
 *
 * Returns a welcome message with timestamp and request count.
 * This demonstrates:
 * - Proper API Gateway response format
 * - CORS headers
 * - Request tracking
 *
 * @param event - API Gateway V2 event object
 * @returns HTTP response with status 200 and JSON body
 */
export const homeRoute = async (event: APIGatewayProxyEventV2) => {
  console.log("Home route event:", event); // Log for CloudWatch debugging
  requestCount++; // Increment request counter (lost on container recycle)

  return {
    statusCode: 200, // HTTP 200 OK
    headers: corsHeaders, // Include CORS headers
    body: JSON.stringify({
      message: "Welcome to the API! 🚀",
      timestamp: new Date().toISOString(), // Current time in ISO format
      requestNumber: requestCount, // Total requests handled by this container
    }),
  };
};

/**
 * Login Route Handler - POST /login
 *
 * Authenticates users by hashing their username with a secret encryption key.
 * This demonstrates:
 * - AWS Secrets Manager integration
 * - Cryptographic hashing (HMAC-SHA256)
 * - Error handling with try-catch
 * - Environment variables
 *
 * Process:
 * 1. Extract username from request body
 * 2. Fetch encryption key from AWS Secrets Manager
 * 3. Hash username using HMAC-SHA256 with the encryption key
 * 4. Return hashed username
 *
 * @param event - API Gateway V2 event with JSON body containing username
 * @returns HTTP response with hashed username or error message
 */
export const loginRoute = async (event: APIGatewayProxyEventV2) => {
  try {
    // Parse JSON body from the request
    // event.body is a string, so we need to parse it
    // Use ?? "{}" as fallback if body is null/undefined
    const { username } = JSON.parse(event.body ?? "{}");

    // Fetch the secret from AWS Secrets Manager
    // process.env.SECRET_ID is set by CDK (see lambda-gateway-stack.ts)
    // Returns a JSON string like: '{"encryptionKey": "abc123"}'
    const secretValue = await fetchSecret(process.env.SECRET_ID || "");

    // Parse the secret JSON to extract the encryption key
    // If secret fetch fails, use empty string as fallback
    const { encryptionKey } = secretValue
      ? JSON.parse(secretValue)
      : { encryptionKey: "" };

    // Create HMAC (Hash-based Message Authentication Code) using SHA-256
    // This produces a secure hash of the username using the encryption key
    // The hash is deterministic (same input = same output) but irreversible
    const hashedUserName = crypto
      .createHmac("sha256", encryptionKey) // Create HMAC with SHA-256 algorithm
      .update(username) // Feed the username into the hash
      .digest("hex"); // Output as hexadecimal string

    // Return success response with hashed username
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        username: hashedUserName, // Send back the hashed version
      }),
    };
  } catch (err) {
    // Log error to CloudWatch for debugging
    console.error("Error in loginRoute:", err);

    // Return 500 Internal Server Error
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};

/**
 * Create Profile Handler - POST /profile
 *
 * Creates a new user profile with username and optional email.
 * This demonstrates:
 * - Parsing JSON request body
 * - Creating unique IDs
 * - Array manipulation (storing in memory)
 * - HTTP 201 Created status
 *
 * Request body format:
 * {
 *   "username": "string",
 *   "email": "string (optional)"
 * }
 *
 * @param event - API Gateway V2 event with JSON body
 * @returns HTTP 201 with created user details
 */
export const createProfile = async (event: APIGatewayProxyEventV2) => {
  console.log("Create profile event:", event);

  // Parse the JSON request body
  const body = JSON.parse(event.body ?? "{}");

  // Create new user object
  const newUser = {
    // Generate random ID using base-36 encoding (numbers + letters)
    // substring(7) makes it shorter (removes "0." prefix)
    id: Math.random().toString(36).substring(7),
    username: body.username, // Username from request
    // Use provided email or generate default
    email: body.email || `${body.username}@example.com`,
    // Store creation timestamp in ISO 8601 format
    createdAt: new Date().toISOString(),
  };

  // Add user to in-memory array (will be lost on container recycle!)
  users.push(newUser);
  requestCount++; // Increment request counter

  return {
    statusCode: 201, // HTTP 201 Created (resource successfully created)
    headers: corsHeaders,
    body: JSON.stringify({
      message: "Profile created successfully! 🎉",
      user: newUser, // Return the created user
      totalUsers: users.length, // Current count of users in memory
    }),
  };
};

/**
 * Get Users Handler - GET /users
 *
 * Retrieves all users from in-memory storage.
 * This demonstrates:
 * - Simple GET request handling
 * - Returning array data
 *
 * Note: Will only return users created in the current Lambda container.
 * Different containers have different memory, so results may vary.
 *
 * @param event - API Gateway V2 event
 * @returns HTTP 200 with array of all users
 */
export const getUsers = async (event: APIGatewayProxyEventV2) => {
  console.log("Get users event:", event);
  requestCount++; // Track this request

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: "Users retrieved successfully",
      users: users, // Return all users from memory
      count: users.length, // Total count
    }),
  };
};

/**
 * Delete User Handler - DELETE /users/{id}
 *
 * Deletes a user by their ID from in-memory storage.
 * This demonstrates:
 * - Path parameters extraction
 * - Array filtering
 * - HTTP 404 handling
 * - Validation
 *
 * @param event - API Gateway V2 event with path parameter {id}
 * @returns HTTP 200 if deleted, 404 if not found, 400 if missing ID
 */
export const deleteUser = async (event: APIGatewayProxyEventV2) => {
  console.log("Delete user event:", event);

  // Extract {id} path parameter from the URL
  // e.g., DELETE /users/abc123 -> userId = "abc123"
  const userId = event.pathParameters?.id;

  // Validate that ID was provided
  if (!userId) {
    return {
      statusCode: 400, // HTTP 400 Bad Request (missing required parameter)
      headers: corsHeaders,
      body: JSON.stringify({ message: "User ID is required" }),
    };
  }

  // Store original array length to detect if deletion occurred
  const initialLength = users.length;

  // Filter out the user with matching ID
  // Array.filter returns new array without the deleted user
  users = users.filter((user) => user.id !== userId);
  requestCount++; // Track this request

  // Check if a user was actually deleted by comparing lengths
  if (users.length < initialLength) {
    // User was found and deleted
    return {
      statusCode: 200, // HTTP 200 OK (successful deletion)
      headers: corsHeaders,
      body: JSON.stringify({
        message: "User deleted successfully! 🗑️",
        remainingUsers: users.length, // Updated count
      }),
    };
  } else {
    // No user with that ID existed
    return {
      statusCode: 404, // HTTP 404 Not Found
      headers: corsHeaders,
      body: JSON.stringify({ message: "User not found" }),
    };
  }
};

/**
 * Random Quote Generator Handler - GET /quote
 *
 * Returns a random inspirational quote from a predefined array.
 * This demonstrates:
 * - Array of objects
 * - Random selection logic
 * - Simple GET endpoint
 *
 * Each quote object has:
 * - text: The quote content
 * - author: Who said it
 * - category: Quote theme/topic
 *
 * @param event - API Gateway V2 event
 * @returns HTTP 200 with random quote object
 */
export const getRandomQuote = async (event: APIGatewayProxyEventV2) => {
  console.log("Get random quote event:", event);
  requestCount++; // Track this request

  // Predefined array of quote objects
  const quotes = [
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    },
    {
      text: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs",
    },
    {
      text: "Code is like humor. When you have to explain it, it's bad.",
      author: "Cory House",
    },
    {
      text: "First, solve the problem. Then, write the code.",
      author: "John Johnson",
    },
    {
      text: "Experience is the name everyone gives to their mistakes.",
      author: "Oscar Wilde",
    },
    {
      text: "Simplicity is the soul of efficiency.",
      author: "Austin Freeman",
    },
    {
      text: "Make it work, make it right, make it fast.",
      author: "Kent Beck",
    },
    {
      text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
      author: "Martin Fowler",
    },
  ];

  // Generate random index between 0 and quotes.length - 1
  // Math.random() returns 0 to 0.999...
  // Multiply by length and floor to get integer index
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      quote: randomQuote, // The randomly selected quote object
      timestamp: new Date().toISOString(), // When it was generated
    }),
  };
};

/**
 * Get API Statistics Handler - GET /stats
 *
 * Returns runtime statistics for this Lambda container instance.
 * This demonstrates:
 * - Process metrics (uptime, memory)
 * - Request counting
 * - Node.js process API
 *
 * IMPORTANT: These stats are per-container, not global!
 * - totalRequests: Only requests handled by THIS container
 * - totalUsers: Only users created in THIS container's memory
 * - uptime: How long THIS container has been running
 * - memoryUsage: Memory used by THIS Node.js process
 *
 * AWS Lambda can create multiple container instances to handle load,
 * and each instance has its own independent statistics.
 *
 * @param event - API Gateway V2 event
 * @returns HTTP 200 with statistics object
 */
export const getStats = async (event: APIGatewayProxyEventV2) => {
  console.log("Get stats event:", event);
  requestCount++; // Increment before returning stats

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      // Total API requests handled by this Lambda container
      totalRequests: requestCount,

      // Total users stored in this container's memory
      totalUsers: users.length,

      // How many seconds this Node.js process has been running
      // process.uptime() is a Node.js built-in that returns seconds as a number
      uptime: process.uptime(),

      // Memory usage statistics for this Node.js process
      // Returns object with properties: rss, heapTotal, heapUsed, external, arrayBuffers
      // All values are in bytes
      memoryUsage: process.memoryUsage(),

      // ISO 8601 timestamp of when these stats were generated
      timestamp: new Date().toISOString(),
    }),
  };
};
