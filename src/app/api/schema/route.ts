import { NextResponse } from "next/server";

export function GET() {
  // Returns the expected Google Sheets tab schema for user reference
  return NextResponse.json({
    sheets: {
      Funders: ["id", "name", "type", "priority", "owner"],
      Contributions: [
        "id",
        "funderId",
        "stateCode",
        "schoolId",
        "fiscalYear",
        "date",
        "initiative",
        "amount"
      ],
      StateTargets: ["stateCode", "fiscalYear", "targetAmount"],
      Prospects: [
        "id",
        "stateCode", 
        "funderName",
        "stage",
        "estimatedAmount",
        "probability",
        "nextAction",
        "dueDate",
        "owner",
        "description",
        "documents",
        "tags",
        "contactPerson",
        "contactEmail",
        "contactPhone",
        "lastContact",
        "notes"
      ],
      States: ["code", "name", "coordinator"],
      Schools: ["id", "stateCode", "name", "program"],
    }
  });
}



