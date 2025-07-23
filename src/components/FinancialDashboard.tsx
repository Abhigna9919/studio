"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface FinancialDashboardProps {
  fetchNetWorthAction: () => Promise<{ success: boolean; data?: string; error?: string }>;
  onDataError: (error: string) => void;
}

export function FinancialDashboard({ fetchNetWorthAction, onDataError }: FinancialDashboardProps) {
  const [rawData, setRawData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await fetchNetWorthAction();
      if (result.success && result.data) {
        setRawData(result.data);
      } else if (result.error) {
        onDataError(result.error);
        setRawData(null); 
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fetchNetWorthAction, onDataError]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Fetching Data...</CardTitle></CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!rawData) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Failed to Load Data</CardTitle>
          <CardDescription>
            There was an error fetching the financial information. <br/>
            Please try refreshing the page or check the console for more details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Server Response</CardTitle>
        <CardDescription>This is the exact data returned from the API endpoint.</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap break-all">
          {rawData}
        </pre>
      </CardContent>
    </Card>
  );
}
