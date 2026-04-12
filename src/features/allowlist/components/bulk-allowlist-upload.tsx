import { Download, FileUp, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function BulkAllowlistUpload() {
  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Bulk upload
          </Badge>
        </div>
        <CardTitle className="text-brand-ink">Upload users in one batch</CardTitle>
        <CardDescription>
          Upload a CSV file with name, email, role, and identity fields to add many users at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-ink">CSV template format</p>
              <p className="text-xs text-brand-muted">Columns: name, email, role, identity_number</p>
            </div>
            <Button type="button" variant="outline" className="sm:w-auto">
              <Download className="size-4" />
              Download template
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="allowlist-csv" className="text-sm font-medium text-brand-ink">
            CSV file
          </label>
          <Input id="allowlist-csv" type="file" accept=".csv" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="sm:w-auto">
            <FileUp className="size-4" />
            Validate file
          </Button>
          <Button type="button" className="sm:w-auto">
            <Upload className="size-4" />
            Upload users
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}