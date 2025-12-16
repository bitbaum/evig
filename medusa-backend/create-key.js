// Script to create a publishable API key for Medusa
const { Medusa } = require("@medusajs/js-sdk");

async function createPublishableKey() {
  try {
    const medusa = new Medusa({
      baseUrl: "http://localhost:9000",
      // Use admin credentials to create the key
      apiKey: process.env.MEDUSA_API_KEY, // This might not work
    });

    // Try to create a publishable API key (v2 uses consolidated /admin/api-keys)
    const response = await fetch("http://localhost:9000/admin/api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // We need admin authentication here
      },
      body: JSON.stringify({
        title: "RevampIT Frontend Key",
        type: "publishable",
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Created publishable API key:", data.api_key?.id || data.api_key?.token);
      console.log("Key:", data.api_key?.id || data.api_key?.token);
    } else {
      console.error("Failed to create key:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

createPublishableKey();


