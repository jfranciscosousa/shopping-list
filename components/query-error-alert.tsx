import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function QueryErrorAlert({ retry }: { retry: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>Some data could not be refreshed. Existing data may be out of date.</span>
        <Button type="button" variant="outline" size="sm" onClick={retry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
