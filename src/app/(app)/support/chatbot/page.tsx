
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert, HelpCircle } from "lucide-react";

export default function ChatbotPageRemoved() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center">
      <Card className="w-full max-w-lg shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold mt-4">Page Merged</CardTitle>
          <CardDescription className="text-lg">
            The standalone Chatbot page has been merged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Its functionality is now available on the more comprehensive <strong>FAQ &amp; Chatbot</strong> page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support/faq" passHref legacyBehavior>
              <Button>
                <HelpCircle className="mr-2 h-4 w-4" />
                Go to FAQ &amp; Chatbot
              </Button>
            </Link>
            <Link href="/dashboard" passHref legacyBehavior>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
