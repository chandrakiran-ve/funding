'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, RefreshCw, Shield, AlertCircle } from "lucide-react";
import { useUserContext } from "@/lib/user-context";

export function PendingApproval() {
  const { user, refreshUser, isLoading } = useUserContext();

  const handleRefresh = async () => {
    await refreshUser();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your access request is being reviewed by an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Requested:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(user.requestedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">What happens next?</p>
                <p className="text-blue-700">
                  An administrator will review your request and assign you appropriate access permissions. 
                  You'll be notified via email once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 mb-1">Need immediate access?</p>
                <p className="text-amber-700">
                  Contact your administrator at{" "}
                  <a href="mailto:admin@visionempowertrust.org" className="underline">
                    admin@visionempowertrust.org
                  </a>{" "}
                  for urgent requests.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
