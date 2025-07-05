'use client';
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FirebaseInitError() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Firebase Configuration Error
          </CardTitle>
          <CardDescription>
            The connection to the database could not be established.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The Firebase environment variables required to run this application are missing.
          </p>
          <p>
            If you are deploying this project on a hosting platform like Vercel or Netlify, please ensure you have set the following environment variables in your project's settings:
          </p>
          <ul className="list-disc space-y-1 rounded-md bg-muted p-4 pl-8 text-sm font-mono">
            <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
            <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
            <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
            <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID</li>
            <li>GOOGLE_AI_API_KEY (for AI features)</li>
          </ul>
          <p>
            Once these are set, please redeploy your application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
