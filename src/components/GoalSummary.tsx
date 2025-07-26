
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, Calendar, IndianRupee, TrendingUp } from "lucide-react";
import type { GoalFormValues, FinancialPlan } from '@/lib/schemas';
import { format } from 'date-fns';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';

const formatCurrency = (value: number | string | undefined, fallback: string = "N/A") => {
    if (value === undefined) return fallback;
    let numberValue: number;

    if (typeof value === 'string') {
        numberValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    } else {
        numberValue = value;
    }

    if (isNaN(numberValue)) {
        return fallback;
    }
    
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numberValue);
};

export function GoalSummary() {
    const [goal, setGoal] = useState<GoalFormValues | null>(null);
    const [plan, setPlan] = useState<FinancialPlan | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const savedGoal = localStorage.getItem('userGoal');
            const savedPlan = localStorage.getItem('financialPlan');
            if (savedGoal) {
                const parsedGoal = JSON.parse(savedGoal);
                // The date will be a string, so we need to convert it back to a Date object
                if (parsedGoal.deadline) {
                    parsedGoal.deadline = new Date(parsedGoal.deadline);
                }
                setGoal(parsedGoal);
            }
            if (savedPlan) {
                setPlan(JSON.parse(savedPlan));
            }
        } catch (error) {
            console.error("Failed to load goal from localStorage", error);
        }
    }, []);

    if (!isMounted) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (!goal || !plan) {
        return null; // Don't show the card if there's no goal saved
    }

    const targetAmount = goal.goalAmount;
    // For simplicity, let's assume a dummy current progress. 
    // In a real app, this would come from the user's actual portfolio value.
    const currentAmount = targetAmount * 0.25; 
    const progressPercentage = (currentAmount / targetAmount) * 100;

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-2xl font-bold">{goal.title}</CardTitle>
                        <CardDescription>Your active financial goal. Keep it up!</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Target Amount</p>
                            <p className="font-bold">{formatCurrency(targetAmount)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-bold">{format(goal.deadline, 'MMM yyyy')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Monthly SIP</p>
                            <p className="font-bold">{formatCurrency(plan.requiredMonthlyInvestment)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Risk Profile</p>
                            <p className="font-bold">{goal.risk}</p>
                        </div>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                     <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                        <span>{formatCurrency(currentAmount)}</span>
                        <span>{formatCurrency(targetAmount)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
