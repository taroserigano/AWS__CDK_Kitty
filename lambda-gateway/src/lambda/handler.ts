import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { fetchSecret } from "../../utils/fetchSecret";
import * as crypto from "crypto";

// Simulated in-memory storage (in production, use DynamoDB or RDS)
let users: Array<{
  id: string;
  username: string;
  email: string;
  createdAt: string;
}> = [];
let requestCount = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export const lambdaExample = async (event: any) => {
  console.log("Event:", event);
  return { message: "Hello ME!" };
};

export const homeRoute = async (event: APIGatewayProxyEventV2) => {
  console.log("Home route event:", event);
  requestCount++;
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: "Welcome to the API! 🚀",
      timestamp: new Date().toISOString(),
      requestNumber: requestCount,
    }),
  };
};

// add loginroute below
export const loginRoute = async (event: APIGatewayProxyEventV2) => {
  try {
    const { username } = JSON.parse(event.body ?? "{}");
    const secretValue = await fetchSecret(process.env.SECRET_ID || "");
    const { encryptionKey } = secretValue
      ? JSON.parse(secretValue)
      : { encryptionKey: "" };
    const hashedUserName = crypto
      .createHmac("sha256", encryptionKey)
      .update(username)
      .digest("hex");
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        username: hashedUserName,
      }),
    };
  } catch (err) {
    console.error("Error in loginRoute:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};

// create profile route
export const createProfile = async (event: APIGatewayProxyEventV2) => {
  console.log("Create profile event:", event);
  const body = JSON.parse(event.body ?? "{}");

  const newUser = {
    id: Math.random().toString(36).substring(7),
    username: body.username,
    email: body.email || `${body.username}@example.com`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  requestCount++;

  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      message: "Profile created successfully! 🎉",
      user: newUser,
      totalUsers: users.length,
    }),
  };
};

// Get all users
export const getUsers = async (event: APIGatewayProxyEventV2) => {
  console.log("Get users event:", event);
  requestCount++;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: "Users retrieved successfully",
      users: users,
      count: users.length,
    }),
  };
};

// Delete a user
export const deleteUser = async (event: APIGatewayProxyEventV2) => {
  console.log("Delete user event:", event);
  const userId = event.pathParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "User ID is required" }),
    };
  }

  const initialLength = users.length;
  users = users.filter((user) => user.id !== userId);
  requestCount++;

  if (users.length < initialLength) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "User deleted successfully! 🗑️",
        remainingUsers: users.length,
      }),
    };
  } else {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: "User not found" }),
    };
  }
};

// Random quote generator
export const getRandomQuote = async (event: APIGatewayProxyEventV2) => {
  console.log("Get random quote event:", event);
  requestCount++;

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
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    {
      text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
      author: "Martin Fowler",
    },
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      quote: randomQuote,
      timestamp: new Date().toISOString(),
    }),
  };
};

// Get API statistics
export const getStats = async (event: APIGatewayProxyEventV2) => {
  console.log("Get stats event:", event);
  requestCount++;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      totalRequests: requestCount,
      totalUsers: users.length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    }),
  };
};
