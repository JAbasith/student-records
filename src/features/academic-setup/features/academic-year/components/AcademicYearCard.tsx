"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AcademicYear } from "@/features/academic-setup/shared/types";

import { AcademicYearForms } from "./AcademicYearForms";

type AcademicYearCardProps = {
  activeYearName: string;
  activeYearId?: number | null;
  academicYears?: AcademicYear[];
};

export function AcademicYearCard({
  activeYearName,
  activeYearId,
  academicYears = [],
}: Readonly<AcademicYearCardProps>) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Card className="border-border/60 bg-card/90">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Active year</p>
              <p className="mt-1 text-lg font-semibold text-brand-ink">{activeYearName}</p>
              {activeYearName !== "Not set" && <Badge className="mt-2">Current</Badge>}
            </div>
            <DialogTrigger>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </DialogTrigger>
          </div>
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Academic Year</DialogTitle>
          <DialogDescription>Select an existing year or create a new one</DialogDescription>
        </DialogHeader>

        <AcademicYearForms
          activeYearId={activeYearId}
          academicYears={academicYears}
          onSuccess={() => setDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

