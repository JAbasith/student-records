"use client";

import { GraduationCap } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  bulkEnrollSectionForOffering,
  enrollStudentToOffering,
} from "@/features/academic-setup/features/student-enrollment/actions/index";
import type { Offering, StudentEnrollment } from "@/features/academic-setup/shared/types";

type StudentEnrollmentCardProps = {
  offerings: Offering[];
  studentEnrollments: StudentEnrollment[];
};

export function StudentEnrollmentCard({ offerings, studentEnrollments }: Readonly<StudentEnrollmentCardProps>) {
  const [isPending, startTransition] = useTransition();

  // Single enrollment form
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);

  // Bulk enrollment form
  const [selectedBulkOfferingId, setSelectedBulkOfferingId] = useState<string | null>(null);

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId || !selectedOfferingId) {
      toast.error("Select both student and offering");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", selectedStudentId);
      formData.set("offeringId", selectedOfferingId);
      const result = await enrollStudentToOffering(formData);

      if (result.success) {
        toast.success(result.message || "Student enrolled");
        setSelectedStudentId(null);
        setSelectedOfferingId(null);
      } else {
        toast.error(result.message || "Failed to enroll student");
      }
    });
  };

  const handleBulkEnroll = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBulkOfferingId) {
      toast.error("Select an offering");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("offeringId", selectedBulkOfferingId);
      const result = await bulkEnrollSectionForOffering(formData);

      if (result.success) {
        toast.success(result.message || "Section enrolled");
        setSelectedBulkOfferingId(null);
      } else {
        toast.error(result.message || "Failed to enroll section");
      }
    });
  };

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <GraduationCap className="mr-1 size-3.5" />
            Student enrollment
          </Badge>
        </div>
        <CardTitle className="text-brand-ink">Enroll students in offerings</CardTitle>
        <CardDescription>Add students individually or enroll entire sections.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="single">Single enrollment</TabsTrigger>
            <TabsTrigger value="bulk">Bulk enrollment</TabsTrigger>
          </TabsList>

          {/* Single Enrollment */}
          <TabsContent value="single" className="space-y-3">
            <form onSubmit={handleEnrollStudent}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Student</Label>
                  <Select value={selectedStudentId || ""} onValueChange={setSelectedStudentId} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentEnrollments.map((enrollment) => (
                        <SelectItem key={enrollment.id} value={String(enrollment.id)}>
                          {enrollment.label}
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
              <Button type="submit" variant="outline" className="mt-3" disabled={isPending}>
                Enroll student
              </Button>
            </form>
          </TabsContent>

          {/* Bulk Enrollment */}
          <TabsContent value="bulk" className="space-y-3">
            <form onSubmit={handleBulkEnroll}>
              <div className="grid gap-2">
                <Label>Offering (entire section enrolls)</Label>
                <Select value={selectedBulkOfferingId || ""} onValueChange={setSelectedBulkOfferingId} disabled={isPending}>
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
              <Button type="submit" variant="outline" className="mt-3" disabled={isPending}>
                Enroll section
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
