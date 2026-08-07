import { Download, Lock, LockOpen } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@config/app";
import { isPasswordProtectionEnabled } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const passwordProtected = isPasswordProtectionEnabled();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          App info, data export, and access — see the README for full
          configuration details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App info</CardTitle>
          <CardDescription>
            Configured via environment variables — see{" "}
            <code className="text-xs">.env.example</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{APP_CONFIG.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Description</span>
            <span className="font-medium">{APP_CONFIG.shortDescription}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export data</CardTitle>
          <CardDescription>
            Download every project, report, risk, and checklist submission
            as a single JSON file — useful as a backup before resetting the
            database or moving to a new environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/api/export"
            download
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Download className="size-4" />
            Export data
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>
            Set <code className="text-xs">APP_PASSWORD</code> in{" "}
            <code className="text-xs">.env</code> to require a password
            before anyone can open the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordProtected ? (
            <Badge variant="default" className="gap-1.5">
              <Lock className="size-3.5" />
              Password protection enabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <LockOpen className="size-3.5" />
              Open — no password set
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
