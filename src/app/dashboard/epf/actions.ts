
"use server";

import { epfDetailsResponseSchema, type EpfDetailsResponse } from "@/lib/schemas";

function extractAndParseJson(text: string): any {
  const jsonMatch = text.match(/{.*}/s);
  if (!jsonMatch) {
    throw new Error("No JSON object found in the response text.");
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch(e) {
    throw new Error(`Failed to parse the extracted JSON: ${e}`);
  }
}

// Helper to create dummy contribution data
const generateDummyContributions = () => [
  {
    month: "Jan 2024",
    employeeContribution: { units: "5000" },
    employerContribution: { units: "5000" },
    transactionDate: "2024-01-31T00:00:00Z",
  },
  {
    month: "Dec 2023",
    employeeContribution: { units: "5000" },
    employerContribution: { units: "5000" },
    transactionDate: "2023-12-31T00:00:00Z",
  },
];


export async function fetchEpfDetailsAction(): Promise<{
  success: boolean;
  data?: EpfDetailsResponse;
  error?: string;
}> {
  try {
    const response = await fetch(
      "https://add852513a89.ngrok-free.app/mcp/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Mcp-Session-Id": "mcp-session-594e48ea-fea1-40ef-8c52-7552dd9272af",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "fetch_epf_details", arguments: {} },
        }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}: ${responseText}`
      );
    }
    
    const rpcResponse = extractAndParseJson(responseText);

    if (rpcResponse.error || !rpcResponse.result || !rpcResponse.result.content) {
      throw new Error(`RPC error: ${JSON.stringify(rpcResponse.error) || 'Invalid RPC response structure'}`);
    }
    
    const nestedJsonString = rpcResponse.result.content[0]?.text;
    if (!nestedJsonString) {
        throw new Error("Could not find nested JSON in the RPC response.");
    }
    
    const rawData = JSON.parse(nestedJsonString);
    const uanAccount = rawData.uanAccounts[0];
    const rawDetails = uanAccount.rawDetails;

    // Transform the raw data into the structure our components expect
    const transformedData: EpfDetailsResponse = {
        uan: "100109986348", // Mock data as it's not in the response
        name: "Prateek Patnaik", // Mock data
        dateOfBirth: "2000-01-01T00:00:00Z", // Mock data
        accounts: rawDetails.est_details.map((est: any) => ({
            memberId: est.member_id,
            establishmentName: est.est_name,
            totalBalance: { units: est.pf_balance.net_balance },
            employeeShare: { units: est.pf_balance.employee_share.balance || est.pf_balance.employee_share.credit },
            employerShare: { units: est.pf_balance.employer_share.balance || est.pf_balance.employer_share.credit },
            contributions: generateDummyContributions(), // Dummy data as contributions are not in this response
        })),
    };
    
    const validatedData = epfDetailsResponseSchema.parse(transformedData);
    
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchEpfDetailsAction error:", errorMessage);
    return { success: false, error: `Failed to fetch EPF details: ${errorMessage}` };
  }
}
