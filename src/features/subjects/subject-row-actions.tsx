"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SubjectRowActionsProps = {
  grade: string;
  marksText: string;
  subjectName: string;
  teacherEmployeeNo: string | null;
  teacherName: string;
};

function TriggerButton({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Button variant="outline" size="sm" className="rounded-full">
      {children}
    </Button>
  );
}

export function SubjectRowActions({ grade, marksText, subjectName, teacherEmployeeNo, teacherName }: Readonly<SubjectRowActionsProps>) {
  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <DialogTrigger render={<TriggerButton>Teacher details</TriggerButton>} />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Teacher details</DialogTitle>
            <DialogDescription>{subjectName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Teacher</p>
              <p className="mt-1 font-medium text-brand-ink">{teacherName}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Staff no</p>
              <p className="mt-1 font-medium text-brand-ink">{teacherEmployeeNo || "Not available"}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <DialogClose render={<Button variant="outline">Close</Button>} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger render={<TriggerButton>Marks</TriggerButton>} />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Latest marks</DialogTitle>
            <DialogDescription>{subjectName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Result</p>
              <p className="mt-1 font-medium text-brand-ink">{marksText}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Grade</p>
              <Badge variant="outline" className="mt-2 rounded-full border-border/70 bg-background/80 px-3 py-1 text-xs">
                {grade}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end">
            <DialogClose render={<Button variant="outline">Close</Button>} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
