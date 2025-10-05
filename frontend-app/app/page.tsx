/**
 * Main Page Component - User Management Dashboard
 *
 * This is a Next.js 15 client-side component that provides a full-featured UI for:
 * - Creating user profiles
 * - Viewing all users
 * - Deleting users
 * - Getting random inspirational quotes
 * - Viewing API statistics
 *
 * Uses Next.js "use client" directive to enable React hooks and client-side interactivity.
 * Communicates with AWS Lambda functions via API Gateway HTTP API.
 */
"use client";

// ShadCN UI Button component from our components library
import { Button } from "@/components/ui/button";

// Axios HTTP client for making API requests with automatic JSON parsing
import axios from "axios";

// React hook for managing component state
import { useState } from "react";

/**
 * API Gateway endpoint URL
 * This is the AWS HTTP API Gateway that routes requests to Lambda functions
 * Format: https://{api-id}.execute-api.{region}.amazonaws.com
 */
const API_URL = "https://d3sae1vtuj.execute-api.us-east-2.amazonaws.com";

/**
 * User Interface
 * Defines the structure of a user object returned from the API
 */
interface User {
  id: string; // Random generated ID (e.g., "abc123")
  username: string; // User's chosen username
  email: string; // User's email (auto-generated if not provided)
  createdAt: string; // ISO 8601 timestamp of creation
}

/**
 * Quote Interface
 * Structure of a quote object from the random quote generator
 */
interface Quote {
  text: string; // The quote content
  author: string; // Who said the quote
}

/**
 * Stats Interface
 * API statistics returned from the /stats endpoint
 * Note: These are per-Lambda-container stats, not global
 */
interface Stats {
  totalRequests: number; // Total API requests to this container
  totalUsers: number; // Total users in this container's memory
  uptime: number; // Process uptime in seconds
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Home Component - Main Dashboard
 * Manages all state and API interactions for the user management UI
 */
export default function Home() {
  // State for general API response messages
  const [data, setData] = useState<string>("");

  // State for the list of users fetched from API
  const [users, setUsers] = useState<User[]>([]);

  // State for the current random quote (null if not yet fetched)
  const [quote, setQuote] = useState<Quote | null>(null);

  // State for API statistics (null if not yet fetched)
  const [stats, setStats] = useState<Stats | null>(null);

  // Form input state for username
  const [username, setUsername] = useState("");

  // Form input state for email
  const [email, setEmail] = useState("");

  // Loading state to disable buttons during API calls
  const [loading, setLoading] = useState(false);

  /**
   * GET / - Home Route
   * Fetches a welcome message from the home Lambda function
   * Updates the data state with the response message
   */
  const handleGetRequest = async () => {
    setLoading(true); // Disable buttons
    try {
      // Make GET request to root endpoint
      const response = await axios.get(`${API_URL}`);
      console.log(response.data); // Log full response for debugging
      setData(response.data.message); // Extract and display message
    } catch (error) {
      setData("Error fetching data");
      console.error("Error:", error);
    } finally {
      setLoading(false); // Re-enable buttons
    }
  };

  /**
   * POST /profile - Create User Profile
   * Creates a new user with username and optional email
   * Validates input and handles response
   */
  const handlePostRequest = async () => {
    // Validate that username is not empty or just whitespace
    if (!username.trim()) {
      setData("Please enter a username!");
      return; // Exit early without making API call
    }

    setLoading(true);
    try {
      // Make POST request with JSON body
      const response = await axios.post(`${API_URL}/profile`, {
        username: username,
        email: email || undefined, // Send undefined if email is empty (API will generate default)
      });
      console.log(response.data); // Log full response
      setData(response.data.message); // Display success message

      // Clear form inputs after successful creation
      setUsername("");
      setEmail("");

      // Automatically refresh the user list to show the new user
      handleGetUsers();
    } catch (error) {
      setData("Error posting data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * GET /users - Fetch All Users
   * Retrieves the list of all users from the Lambda's in-memory storage
   * Updates the users array state with the response
   * Note: Only returns users from the current Lambda container
   */
  const handleGetUsers = async () => {
    setLoading(true);
    try {
      // Make GET request to /users endpoint
      const response = await axios.get(`${API_URL}/users`);
      console.log(response.data);

      // Extract users array (default to empty array if undefined)
      setUsers(response.data.users || []);

      // Show count in the message area
      setData(`Found ${response.data.count} users`);
    } catch (error) {
      setData("Error fetching users");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * DELETE /users/{id} - Delete User by ID
   * Removes a user from the Lambda's in-memory storage
   * Automatically refreshes the user list after successful deletion
   *
   * @param userId - The unique ID of the user to delete
   */
  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    try {
      // Make DELETE request with userId in the path
      const response = await axios.delete(`${API_URL}/users/${userId}`);
      console.log(response.data);
      setData(response.data.message); // Show success message

      // Refresh user list to remove deleted user from UI
      handleGetUsers();
    } catch (error) {
      setData("Error deleting user");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * GET /quote - Get Random Quote
   * Fetches a random inspirational quote from the Lambda function
   * Updates the quote state with the response
   */
  const handleGetQuote = async () => {
    setLoading(true);
    try {
      // Make GET request to /quote endpoint
      const response = await axios.get(`${API_URL}/quote`);
      console.log(response.data);

      // Update quote state with the random quote object
      setQuote(response.data.quote);
      setData("New quote loaded! ✨");
    } catch (error) {
      setData("Error fetching quote");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * GET /stats - Get API Statistics
   * Fetches runtime statistics from the Lambda function
   * Shows total requests, users, uptime, and memory usage
   * Note: These stats are per-Lambda-container, not global
   */
  const handleGetStats = async () => {
    setLoading(true);
    try {
      // Make GET request to /stats endpoint
      const response = await axios.get(`${API_URL}/stats`);
      console.log(response.data);

      // Update stats state with the response data
      setStats(response.data);
      setData("Stats updated! 📊");
    } catch (error) {
      setData("Error fetching stats");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== UI RENDERING ==========
  // The return statement renders the JSX UI with all components
  return (
    // Main container with gradient background and responsive padding
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      {/* Center content with max width and vertical spacing */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ===== HEADER SECTION ===== */}
        <div className="text-center space-y-2">
          {/* Title with gradient text effect using Tailwind's bg-clip-text */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AWS Lambda API Dashboard 🚀
          </h1>
          <p className="text-gray-600">Powered by CDK, Lambda & Next.js</p>
        </div>

        {/* ===== STATUS DISPLAY CARD ===== */}
        {/* Shows API response messages and errors */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            📢 Status
          </h2>
          {/* Pre-formatted text to preserve whitespace and line breaks */}
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
            {data || "Ready to make requests..."}
          </pre>
        </div>

        {/* ===== GRID LAYOUT FOR MAIN FEATURES ===== */}
        {/* Responsive grid: 1 column on mobile, 2 columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ===== BASIC OPERATIONS CARD ===== */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              🎯 Basic Operations
            </h2>

            {/* Button group for main API operations */}
            <div className="flex gap-3">
              {/* Home button - GET / */}
              <Button
                onClick={handleGetRequest}
                disabled={loading} // Disable during API calls
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "⏳" : "🏠"} Home
              </Button>

              {/* Stats button - GET /stats */}
              <Button
                onClick={handleGetStats}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? "⏳" : "📊"} Stats
              </Button>

              {/* Quote button - GET /quote */}
              <Button
                onClick={handleGetQuote}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "⏳" : "💭"} Quote
              </Button>
            </div>
          </div>

          {/* ===== QUOTE DISPLAY CARD ===== */}
          {/* Only renders when quote state is not null (conditional rendering with &&) */}
          {quote && (
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-6 border border-purple-200">
              <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                💡 Inspiration
              </h2>
              {/* Blockquote with italic styling */}
              <blockquote className="text-lg italic text-gray-700 mb-2">
                &ldquo;{quote.text}&rdquo; {/* Left double quote HTML entity */}
              </blockquote>
              {/* Author attribution aligned right */}
              <p className="text-right text-purple-600 font-medium">
                — {quote.author}
              </p>
            </div>
          )}

          {/* ===== STATS DISPLAY CARD ===== */}
          {/* Only renders when stats state is not null */}
          {stats && (
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-lg p-6 border border-blue-200">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">
                📈 API Statistics
              </h2>
              {/* Grid layout for stat items: 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Requests stat */}
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.totalRequests}
                  </p>
                </div>
                {/* Total Users stat */}
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.totalUsers}
                  </p>
                </div>
                {/* Uptime stat - spans both columns */}
                <div className="bg-white/50 p-3 rounded-lg col-span-2">
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-xl font-bold text-purple-700">
                    {/* toFixed(2) formats number to 2 decimal places */}
                    {stats.uptime.toFixed(2)}s
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== CREATE USER FORM CARD ===== */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              ➕ Create User
            </h2>
            <div className="space-y-3">
              {/* Username input - controlled component */}
              <input
                type="text"
                placeholder="Username"
                value={username} // Controlled by username state
                onChange={(e) => setUsername(e.target.value)} // Update state on change
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Email input - controlled component (optional field) */}
              <input
                type="email"
                placeholder="Email (optional)"
                value={email} // Controlled by email state
                onChange={(e) => setEmail(e.target.value)} // Update state on change
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Submit button with gradient background */}
              <Button
                onClick={handlePostRequest} // Calls POST /profile
                disabled={loading} // Disable while loading
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {/* Conditional text based on loading state */}
                {loading ? "Creating..." : "Create Profile 🎉"}
              </Button>
            </div>
          </div>

          {/* ===== USER LIST CARD ===== */}
          {/* Spans 2 columns on large screens with lg:col-span-2 */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4 lg:col-span-2">
            {/* Header with title and refresh button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                👥 User Management
              </h2>
              {/* Refresh button to reload user list */}
              <Button
                onClick={handleGetUsers} // Calls GET /users
                disabled={loading}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {loading ? "⏳" : "🔄"} Refresh
              </Button>
            </div>

            {/* Conditional rendering: Show message if no users, otherwise show grid */}
            {users.length === 0 ? (
              // Empty state message
              <p className="text-gray-500 text-center py-8">
                No users yet. Create one above! 👆
              </p>
            ) : (
              // User grid - responsive: 1 column mobile, 2 on tablet, 3 on desktop
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Map through users array to create a card for each user */}
                {users.map((user) => (
                  <div
                    key={user.id} // Unique key required for React lists
                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Flex container for user info and delete button */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {/* Username */}
                        <h3 className="font-semibold text-gray-800">
                          {user.username}
                        </h3>
                        {/* Email */}
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {/* Created timestamp - convert ISO string to readable format */}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(user.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {/* Delete button */}
                      <Button
                        onClick={() => handleDeleteUser(user.id)} // Pass user ID to delete handler
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
