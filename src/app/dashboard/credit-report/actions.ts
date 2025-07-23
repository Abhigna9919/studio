"use server";

import { creditReportResponseSchema, type CreditReportResponse } from "@/lib/schemas";

// Helper function to find and parse JSON from a streaming text response
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

const getAccountType = (type: string) => {
    // This is a simplified mapping based on common account types.
    // It may need to be expanded based on the full list of type codes from Experian.
    switch (type) {
        case '01': return 'Auto Loan';
        case '02': return 'Housing Loan';
        case '03': return 'Property Loan';
        case '04': return 'Loan Against Shares/Securities';
        case '05': return 'Personal Loan';
        case '06': return 'Consumer Loan';
        case '10': return 'Credit Card';
        case '11': return 'Leasing';
        case '17': return 'Two-wheeler Loan';
        case '31': return 'Business Loan – General';
        case '51': return 'Overdraft';
        case '53': return 'Loan on Credit Card';
        default: return 'Other';
    }
};

const getAccountStatus = (status: string) => {
    // A mapping from Experian's numeric codes to human-readable statuses.
    // This is a partial list and can be expanded.
    const statusMap: { [key: string]: string } = {
        '11': 'Active', // Standard
        '71': 'Settled', // Settled
        '78': 'Restructured', // Restructured
        '82': 'Written-off', // Written-off
        '83': 'Suit Filed', // Suit Filed (Wilful Default)
    };
    return statusMap[status] || 'Unknown';
}


export async function fetchCreditReportAction(): Promise<{
  success: boolean;
  data?: CreditReportResponse;
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
          params: { name: "fetch_credit_report", arguments: {} },
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
    const reportData = rawData.creditReports[0].creditReportData;
    
    // Transform the raw Experian data into the structure our components expect
    const transformedData: CreditReportResponse = {
        scores: [{
            bureau: rawData.creditReports[0].vendor,
            score: parseInt(reportData.score.bureauScore, 10),
            rank: 0, // Not available in this response
            totalRanks: 0, // Not available
            rating: "Good", // This can be derived based on score ranges
            factors: ["Payment history is clean.", "Credit utilization is moderate."] // Placeholder factors
        }],
        scoreHistory: [
            // Dummy data as history is not in the response
            { month: "2023-01-01T00:00:00Z", score: 720 },
            { month: "2023-02-01T00:00:00Z", score: 735 },
            { month: "2023-03-01T00:00:00Z", score: 740 },
            { month: "2023-04-01T00:00:00Z", score: 750 },
            { month: "2023-05-01T00:00:00Z", score: 746 },
        ],
        openAccounts: reportData.creditAccount.creditAccountDetails
            .filter((acc: any) => getAccountStatus(acc.accountStatus) === 'Active')
            .map((acc: any) => ({
                accountType: getAccountType(acc.accountType),
                lender: acc.subscriberName,
                totalBalance: { units: acc.currentBalance },
                sanctionedAmount: { units: acc.highestCreditOrOriginalLoanAmount },
                accountStatus: getAccountStatus(acc.accountStatus)
            })),
        closedAccounts: reportData.creditAccount.creditAccountDetails
            .filter((acc: any) => getAccountStatus(acc.accountStatus) !== 'Active')
            .map((acc: any) => ({
                accountType: getAccountType(acc.accountType),
                lender: acc.subscriberName,
                totalBalance: { units: acc.currentBalance },
                sanctionedAmount: { units: acc.highestCreditOrOriginalLoanAmount },
                accountStatus: getAccountStatus(acc.accountStatus)
            })),
    };
    
    const validatedData = creditReportResponseSchema.parse(transformedData);
    
    return { success: true, data: validatedData };

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("fetchCreditReportAction error:", errorMessage);
    return { success: false, error: `Failed to fetch credit report: ${errorMessage}` };
  }
}
