"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";

const API_URL = "https://d3sae1vtuj.execute-api.us-east-2.amazonaws.com";

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface Quote {
  text: string;
  author: string;
}

interface Stats {
  totalRequests: number;
  totalUsers: number;
  uptime: number;
  timestamp: string;
}

export default function Home() {
  const [data, setData] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetRequest = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}`);
      console.log(response.data);
      setData(response.data.message);
    } catch (error) {
      setData("Error fetching data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = async () => {
    if (!username.trim()) {
      setData("Please enter a username!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/profile`, {
        username: username,
        email: email || undefined,
      });
      console.log(response.data);
      setData(response.data.message);
      setUsername("");
      setEmail("");
      // Refresh user list
      handleGetUsers();
    } catch (error) {
      setData("Error posting data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users`);
      console.log(response.data);
      setUsers(response.data.users || []);
      setData(`Found ${response.data.count} users`);
    } catch (error) {
      setData("Error fetching users");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/users/${userId}`);
      console.log(response.data);
      setData(response.data.message);
      // Refresh user list
      handleGetUsers();
    } catch (error) {
      setData("Error deleting user");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetQuote = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/quote`);
      console.log(response.data);
      setQuote(response.data.quote);
      setData("New quote loaded! ✨");
    } catch (error) {
      setData("Error fetching quote");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stats`);
      console.log(response.data);
      setStats(response.data);
      setData("Stats updated! 📊");
    } catch (error) {
      setData("Error fetching stats");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AWS Lambda API Dashboard 🚀
          </h1>
          <p className="text-gray-600">Powered by CDK, Lambda & Next.js</p>
        </div>

        {/* Status Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            📢 Status
          </h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
            {data || "Ready to make requests..."}
          </pre>
        </div>

        {/* Grid Layout for Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Operations */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              🎯 Basic Operations
            </h2>
            <div className="flex gap-3">
              <Button
                onClick={handleGetRequest}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "⏳" : "🏠"} Home
              </Button>
              <Button
                onClick={handleGetStats}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? "⏳" : "📊"} Stats
              </Button>
              <Button
                onClick={handleGetQuote}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "⏳" : "💭"} Quote
              </Button>
            </div>
          </div>

          {/* Quote Display */}
          {quote && (
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-6 border border-purple-200">
              <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                💡 Inspiration
              </h2>
              <blockquote className="text-lg italic text-gray-700 mb-2">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <p className="text-right text-purple-600 font-medium">
                — {quote.author}
              </p>
            </div>
          )}

          {/* Stats Display */}
          {stats && (
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-lg p-6 border border-blue-200">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">
                📈 API Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.totalRequests}
                  </p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg col-span-2">
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-xl font-bold text-purple-700">
                    {stats.uptime.toFixed(2)}s
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create User Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              ➕ Create User
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handlePostRequest}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? "Creating..." : "Create Profile 🎉"}
              </Button>
            </div>
          </div>

          {/* User List */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                👥 User Management
              </h2>
              <Button
                onClick={handleGetUsers}
                disabled={loading}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {loading ? "⏳" : "🔄"} Refresh
              </Button>
            </div>

            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No users yet. Create one above! 👆
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(user.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
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
