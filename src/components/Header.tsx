import { Flame, User, LayoutDashboard, Landmark, FileText, PiggyBank, CandlestickChart, ArrowRightLeft, Bot, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              GoalQuest
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm lg:gap-6">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
             <Link
              href="/dashboard/advice"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Advice
            </Link>
            <Link
              href="/dashboard/analysis"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Analysis
            </Link>
            <Link
              href="/dashboard/transactions"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Transactions
            </Link>
            <Link
              href="/dashboard/credit-report"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Credit Report
            </Link>
            <Link
              href="/dashboard/mf-transactions"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              MF Trades
            </Link>
            <Link
              href="/dashboard/stock-transactions"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Stock Trades
            </Link>
             <Link
              href="/dashboard/epf"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              EPF
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage data-ai-hint="person portrait" src="https://placehold.co/100x100.png" alt="User avatar" />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Jane Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    jane.doe@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
