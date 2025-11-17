/**
 * Script to get ClickUp custom field IDs
 * Run with: npx tsx scripts/get-custom-fields.ts
 */

const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_LIST_ID = process.env.CLICKUP_LIST_ID;

async function getCustomFields() {
  if (!CLICKUP_API_TOKEN || !CLICKUP_LIST_ID) {
    console.error("❌ Missing CLICKUP_API_TOKEN or CLICKUP_LIST_ID in environment variables");
    process.exit(1);
  }

  try {
    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/field`,
      {
        headers: {
          Authorization: CLICKUP_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log("\n📋 Custom Fields in your ClickUp List:\n");
    console.log("Copy these IDs to your .env.local file:\n");

    if (data.fields && data.fields.length > 0) {
      data.fields.forEach((field: any) => {
        console.log(`Field: ${field.name}`);
        console.log(`  ID: ${field.id}`);
        console.log(`  Type: ${field.type}`);
        if (field.type_config?.options) {
          console.log(`  Options:`);
          field.type_config.options.forEach((opt: any) => {
            console.log(`    - ${opt.name} (ID: ${opt.id || opt.orderindex})`);
          });
        }
        console.log("");
      });

      console.log("\n💡 Add these to your .env.local:");
      console.log("CLICKUP_FIELD_TYPE_VRAAG=<id>");
      console.log("CLICKUP_FIELD_GEBOUW=<id>");
      console.log("CLICKUP_FIELD_TOEPASSINGSGEBIED=<id>");
      console.log("CLICKUP_FIELD_REQUESTER_EMAIL=<id>");
    } else {
      console.log("⚠️  No custom fields found. Create them in ClickUp first!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

getCustomFields();

