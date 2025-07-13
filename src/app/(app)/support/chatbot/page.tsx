
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportChat } from "@/components/SupportChat";
import { MessageSquareQuote } from "lucide-react"; // Changed from MessageSquareQuestion

export default function ChatbotPageRemoved() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquareQuote className="h-8 w-8 text-primary" /> 
            <CardTitle className="text-3xl font-bold">NutriPlan Support Chat</CardTitle>
          </div>
          <CardDescription>
            Have questions about how to use NutriPlan? Ask our support bot below!
            It can help you navigate features, understand tools, and make the most of your personalized nutrition journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Its functionality is now available on the more comprehensive <strong>FAQ &amp; Chatbot</strong> page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support/faq" passHref>
              <Button>
                <HelpCircle className="mr-2 h-4 w-4" />
                Go to FAQ &amp; Chatbot
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
