"use client";

import { Download, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addBulkToAllowlist } from "@/features/allowlist/actions";
import { getAllowlistCsvTemplate } from "@/features/allowlist/constants/allowlist-csv-template";

export function BulkAllowlistUpload() {
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const readCsvFile = async (): Promise<string | null> => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a CSV file first");
      return null;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported");
      return null;
    }

    return file.text();
  };

  const toRowMessage = (row: number, message: string) => `Row ${row}: ${message}`;

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const csvContent = await readCsvFile();
      if (!csvContent) {
        return;
      }

      const result = await addBulkToAllowlist({ csvContent, validateOnly: true });
      if (!result.success) {
        const firstError = result.errors?.[0];
        toast.error(result.error || "Validation failed", {
          description: firstError ? toRowMessage(firstError.row, firstError.message) : undefined,
        });
        return;
      }

      toast.success("CSV validation passed", {
        description: `${result.totalRows} row(s) are ready to upload.`,
      });
    } catch (error) {
      toast.error("Validation failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const csvContent = await readCsvFile();
      if (!csvContent) {
        return;
      }

      const result = await addBulkToAllowlist({ csvContent });
      if (!result.success) {
        const firstError = result.errors?.[0];
        toast.error(result.error || "Upload failed", {
          description: firstError ? toRowMessage(firstError.row, firstError.message) : undefined,
        });
        return;
      }

      toast.success("Bulk upload completed", {
        description: `${result.insertedCount} of ${result.totalRows} row(s) uploaded.`,
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = getAllowlistCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "allowlist-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

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
              <p className="text-xs text-brand-muted">Columns: full_name, email, role, identity_number</p>
            </div>
            <Button type="button" variant="outline" className="sm:w-auto" onClick={handleDownloadTemplate}>
              <Download className="size-4" />
              Download template
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="allowlist-csv" className="text-sm font-medium text-brand-ink">
            CSV file
          </label>
          <Input id="allowlist-csv" type="file" accept=".csv" ref={inputRef} disabled={isValidating || isUploading} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="sm:w-auto"
            onClick={handleValidate}
            disabled={isValidating || isUploading}
          >
            <FileUp className="size-4" />
            {isValidating ? "Validating..." : "Validate file"}
          </Button>
          <Button type="button" className="sm:w-auto" onClick={handleUpload} disabled={isValidating || isUploading}>
            <Upload className="size-4" />
            {isUploading ? "Uploading..." : "Upload users"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}