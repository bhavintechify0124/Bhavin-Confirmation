const axios = require("axios");

// Configuration - Update these values
const MINTLIFY_API_KEY = process.env.MINTLIFY_API_KEY || "mint_3ZfuhXwisq1YcWWvxFacC3U6"; // Your admin API key
const PROJECT_ID = process.env.MINTLIFY_PROJECT_ID || "6936767df3780b811fa878ab"; // Your Mintlify project ID

const createMintlifyJob = async () => {
  // Validate configuration
  if (PROJECT_ID === "YOUR_PROJECT_ID") {
    console.error("❌ Error: Please set MINTLIFY_PROJECT_ID environment variable or update PROJECT_ID in the script");
    console.error("   You can find your Project ID in your Mintlify dashboard");
    process.exit(1);
  }

  try {
    const response = await axios.post(
      `https://api.mintlify.com/v1/agent/${PROJECT_ID}/job`,
      {
        branch: "update-docs", // Branch name for the PR
        messages: [
          {
            role: "system",
            content: `Scan the provided code changes and automatically update or create API documentation according to these rules:

1. Detect all new API endpoints, routes, controllers, and handlers.
2. Detect updates to existing APIs (new params, response fields, renamed variables, logic changes).
3. For each endpoint, generate:
   - Title
   - HTTP method + full route path
   - Description
   - Request params (path, query, body)
   - Request JSON schema
   - Response JSON schema
   - Example request
   - Example response
   - Error responses (400/401/403/404/500)
4. Keep formatting consistent with existing Mintlify docs (headings, tables, code blocks).
5. Create pages for new endpoints if needed.
6. Mark removed endpoints as deprecated.`
          }
        ],
        asDraft: true // Set to false to create a regular PR instead of a draft
      },
      {
        headers: {
          Authorization: `Bearer ${MINTLIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Mintlify Agent Job Created Successfully");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Error creating Mintlify Agent Job");
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      // Handle specific error cases with user-friendly messages
      if (status === 401) {
        console.error("\n🔒 Authentication Error (401 Unauthorized)");
        if (errorData?.error?.includes("upgrade")) {
          console.error("   The Mintlify Writing Agent API requires the Popular plan ($300/month) or higher.");
          console.error("   The Writing Agent feature is not available on the Hobby plan.");
          console.error("   Please upgrade your Mintlify plan to access this feature.");
          console.error("   Visit: https://dashboard.mintlify.com/settings/billing");
        } else {
          console.error("   Invalid API key or authentication failed.");
          console.error("   Please verify your MINTLIFY_API_KEY is correct.");
          console.error("   You can generate a new API key at: https://dashboard.mintlify.com/settings/api-keys");
        }
      } else if (status === 404) {
        console.error("\n🔍 Not Found (404)");
        console.error("   The endpoint or project ID may be incorrect.");
        console.error(`   Project ID used: ${PROJECT_ID}`);
        console.error("   Please verify your PROJECT_ID is correct in your Mintlify dashboard.");
      } else if (status === 403) {
        console.error("\n🚫 Forbidden (403)");
        console.error("   You don't have permission to access this resource.");
        console.error("   Please check your API key permissions.");
      } else if (status >= 500) {
        console.error("\n⚠️  Server Error (5xx)");
        console.error("   Mintlify's API is experiencing issues. Please try again later.");
      }
      
      // Always show the detailed error for debugging
      console.error("\n📋 Error Details:");
      console.error("   Status:", status);
      console.error("   Status Text:", error.response.statusText);
      console.error("   Response:", JSON.stringify(errorData, null, 2));
    } else if (error.request) {
      console.error("\n🌐 Network Error");
      console.error("   Request was made but no response was received.");
      console.error("   Please check your internet connection and try again.");
    } else {
      console.error("\n❌ Unexpected Error");
      console.error("   Error:", error.message);
    }
    
    process.exit(1);
  }
};

createMintlifyJob();
