
"use client";

import React, { useEffect, useState } from 'react';
import { fetchMarketNewsAction } from '@/app/dashboard/actions';
import { useToast } from '@/hooks/use-toast';
import type { MarketNewsArticle } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Newspaper, ExternalLink, KeyRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Button } from './ui/button';

export function MarketNews() {
  const { toast } = useToast();
  const [news, setNews] = useState<MarketNewsArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const result = await fetchMarketNewsAction();
      if (result.success && result.data) {
        setNews(result.data);
      } else if (result.error) {
        setError(result.error);
        setNews(null);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
            <div className='flex items-center gap-2'>
                <Newspaper className='h-6 w-6 text-primary' />
                <CardTitle>The Market Tea</CardTitle>
            </div>
            <CardDescription>Stay in the loop with the latest money moves.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-24 w-24 rounded-md" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error && error.includes("Finnhub API key is not configured")) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[300px] text-center border-dashed">
        <CardHeader>
           <div className="mx-auto bg-amber-500/10 p-3 rounded-full">
            <KeyRound className="h-8 w-8 text-amber-500" />
          </div>
          <CardTitle className="mt-4">Configure Market News</CardTitle>
          <CardDescription>
            To see the latest market news, please add your Finnhub API key to the `.env` file.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer">
             <Button>Get a Free API Key</Button>
           </a>
        </CardContent>
      </Card>
    );
  }

  if (!news || news.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[300px] text-center border-dashed">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">No News Found</CardTitle>
          <CardDescription>
            Could not retrieve any market news. <br />
            This might be due to an API issue or network problem.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
            <Newspaper className='h-6 w-6 text-primary' />
            <CardTitle>The Market Tea</CardTitle>
        </div>
        <CardDescription>Stay in the loop with the latest money moves.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {news.map(article => (
          <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="flex gap-4 items-start group hover:bg-muted/50 p-2 rounded-lg transition-colors">
            {article.image ? (
                <Image
                    src={article.image}
                    alt={article.headline}
                    width={100}
                    height={100}
                    className="rounded-md object-cover aspect-square"
                />
            ) : (
                <div className="w-[100px] h-[100px] bg-secondary rounded-md flex items-center justify-center">
                    <Newspaper className="w-8 h-8 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{article.source} &bull; {formatDistanceToNow(new Date(article.datetime * 1000), { addSuffix: true })}</p>
              <h3 className="font-semibold group-hover:underline">{article.headline}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
