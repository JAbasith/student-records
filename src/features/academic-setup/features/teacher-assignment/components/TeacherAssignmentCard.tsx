"use client";

import { Users } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignTeacherToOffering } from "@/features/academic-setup/features/teacher-assignment/actions/index";
import type { Offering, Teacher } from "@/features/academic-setup/shared/types";

type TeacherAssignmentCardProps = {
  offerings: Offering[];
  teachers: Teacher[];
};

export function TeacherAssignmentCard({ offerings, teachers }: Readonly<TeacherAssignmentCardProps>) {
  const [isPending, startTransition] = useTransition();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacherId || !selectedOfferingId) {
      toast.error("Select both teacher and offering");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("teacherId", selectedTeacherId);
      formData.set("offeringId", selectedOfferingId);
      const result = await assignTeacherToOffering(formData);

      if (result.success) {
        toast.success(result.message || "Teacher assigned");
        setSelectedTeacherId(null);
        setSelectedOfferingId(null);
      } else {
        toast.error(result.message || "Failed to assign teacher");
      }
    });
  };

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Users className="mr-1 size-3.5" />
            Teacher assignment
          </Badge>
        </div>
        <CardTitle className="text-brand-ink">Assign teachers to offerings</CardTitle>
        <CardDescription>Map teachers to subject offerings in class sections.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleAssignTeacher}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Teacher</Label>
              <Select value={selectedTeacherId || ""} onValueChange={setSelectedTeacherId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={String(teacher.id)}>
                      {teacher.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Offering</Label>
              <Select value={selectedOfferingId || ""} onValueChange={setSelectedOfferingId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select offering" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((offering) => (
                    <SelectItem key={offering.id} value={String(offering.id)}>
                      {offering.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            Assign teacher
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
