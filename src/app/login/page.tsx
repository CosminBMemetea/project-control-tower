import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { APP_CONFIG } from "@config/app";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="min-h-full w-full flex items-center justify-center px-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{APP_CONFIG.name}</CardTitle>
          <CardDescription>Enter the password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={login} className="space-y-4">
            <input type="hidden" name="from" value={from ?? "/"} />
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
