import { NextResponse } from "next/server";
import { getTicketFormFields } from "@/lib/clickup-fields";

export async function GET() {
  try {
    const fields = await getTicketFormFields();

    // Transform to a format that's easy to use in the frontend
    return NextResponse.json({
      typeVraag: fields.typeVraag.options.map((opt) => ({
        value: opt.id || opt.orderindex.toString(),
        label: opt.name,
      })),
      gebouw: fields.gebouw.options.map((opt) => ({
        value: opt.id || opt.orderindex.toString(),
        label: opt.name,
      })),
      toepassingsgebied: fields.toepassingsgebied.options.map((opt) => ({
        value: opt.id || opt.orderindex.toString(),
        label: opt.name,
      })),
      fieldIds: {
        typeVraag: fields.typeVraag.field?.id,
        gebouw: fields.gebouw.field?.id,
        toepassingsgebied: fields.toepassingsgebied.field?.id,
        requesterEmail: fields.requesterEmail.field?.id,
      },
    });
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    // Return empty arrays so the form still works with fallback values
    return NextResponse.json({
      typeVraag: [],
      gebouw: [],
      toepassingsgebied: [],
      fieldIds: {},
    });
  }
}

