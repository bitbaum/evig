/**
 * Create a new admin API key for RevampIT
 *
 * Run with: npx medusa exec ./src/scripts/create-admin-api-key.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"

export default async function createAdminApiKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Creating new admin API key...")

  try {
    // Create a new secret API key using the workflow
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{
          title: "revampit-admin-new",
          type: "secret",
          created_by: "system"
        }]
      }
    })

    const apiKey = result[0]

    console.log("\n===========================================")
    console.log("NEW ADMIN API KEY CREATED SUCCESSFULLY!")
    console.log("===========================================")
    console.log(`Title: ${apiKey.title}`)
    console.log(`ID: ${apiKey.id}`)
    console.log(`Type: ${apiKey.type}`)
    console.log(`\nTOKEN (save this - it won't be shown again):`)
    console.log(`${apiKey.token}`)
    console.log("===========================================\n")

    logger.info(`Admin API key created: ${apiKey.id}`)

    return apiKey
  } catch (error) {
    logger.error("Failed to create API key:", error)
    throw error
  }
}
