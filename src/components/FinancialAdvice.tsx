"use client";

import React, { useEffect, useState } from 'react';
import { getFinancialAdviceAction } from '@/app/dashboard/advice/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface Advice {
    recommendations: string[];
    idealAssetTypes: string[];
    humor: string;
}

function parseAdvice(text: string): Advice | null {
    try {
        const jsonMatch = text.match(/{.*}/s);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        return null;
    }
}


export function FinancialAdvice() {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getFinancialAdviceAction();
      if (result.success && result.data) {
        const parsedAdvice = parseAdvice(result.data);
        if(parsedAdvice) {
            setAdvice(parsedAdvice);
        } else {
            setError(`Failed to parse the advice from the AI. Raw response: ${result.data}`);
        }
      } else {
        setError(result.error || "An unknown error occurred.");
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Fetching Advice</AlertTitle>
        <AlertDescription>
          <p>There was a problem getting your personalized financial advice.</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-md bg-destructive/10 p-2 font-mono text-xs">
            {error}
          </pre>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!advice) {
     return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Could Not Load Financial Advice</CardTitle>
          <CardDescription>
            The AI was unable to generate financial advice based on your data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }


  return (
    <Card className="bg-gradient-to-br from-card to-secondary/30 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="font-headline text-3xl font-black tracking-tighter">Your AI Financial Advisor</CardTitle>
                <CardDescription className="text-lg">Personalized insights, just for you.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" />Recommendations</h3>
            <ul className="list-disc list-inside space-y-2 rounded-lg border border-border/50 p-4 bg-background/30">
                {advice.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
        </section>
        <section>
            <h3 className="text-xl font-bold mb-3">Ideal Asset Types</h3>
            <div className="flex flex-wrap gap-2">
                {advice.idealAssetTypes.map((asset, i) => <div key={i} className="bg-secondary text-secondary-foreground font-medium px-3 py-1 rounded-full">{asset}</div>)}
            </div>
        </section>
        <section>
             <h3 className="text-xl font-bold mb-3">Your Financial Roast</h3>
             <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground bg-background/20 p-3 rounded-r-lg">
                "{advice.humor}"
             </blockquote>
        </section>
      </CardContent>
    </Card>
  );
}
