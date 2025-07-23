"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialDashboardProps {
  fetchNetWorthAction: () => Promise<{ success: boolean; rawResponse?: string; error?: string }>;
  onDataError: (error: string) => void;
}

export function FinancialDashboard({ fetchNetWorthAction, onDataError }: FinancialDashboardProps) {
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchNetWorthAction();
      if (result.success && result.rawResponse) {
        setRawResponse(result.rawResponse);
      } else if (result.error) {
        onDataError(result.error);
        setRawResponse(`Error: ${result.error}`);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fetchNetWorthAction, onDataError]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Raw API Response</CardTitle>
          <CardDescription>
            This is the raw text received from the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-secondary rounded-md text-sm overflow-auto">
            {rawResponse || "No response received."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
