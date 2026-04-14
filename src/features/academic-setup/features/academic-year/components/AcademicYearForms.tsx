"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmActionDialog } from "@/features/academic-setup/components/ConfirmActionDialog";
import {
  createAcademicYearAndActivate,
  deleteAcademicYearAction,
  setActiveAcademicYearAction,
} from "@/features/academic-setup/features/academic-year/actions/index";
import type { AcademicYear } from "@/features/academic-setup/shared/types";

type AcademicYearFormsProps = {
  activeYearId?: number | null;
  academicYears?: AcademicYear[];
  onSuccess: () => void;
};

export function AcademicYearForms({
  activeYearId,
  academicYears = [],
  onSuccess,
}: Readonly<AcademicYearFormsProps>) {
  const [isTransitioning, startTransition] = useTransition();
  const [selectedYearId, setSelectedYearId] = useState<string | null>(() => {
    if (activeYearId) return activeYearId.toString();
    const activeFromList = academicYears.find((year) => year.isActive);
    return activeFromList ? activeFromList.id.toString() : null;
  });
  const [newYearName, setNewYearName] = useState("");
  const [newYearStartDate, setNewYearStartDate] = useState("");
  const [newYearEndDate, setNewYearEndDate] = useState("");
  const [yearDeleteSearch, setYearDeleteSearch] = useState("");
  const [yearToDeleteId, setYearToDeleteId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const selectedYearName = academicYears.find((year) => year.id.toString() === selectedYearId)?.name;
  const selectedYearToDelete = academicYears.find((year) => year.id.toString() === yearToDeleteId);

  const filteredYearDeleteOptions = useMemo(() => {
    const term = yearDeleteSearch.trim().toLowerCase();
    if (!term) {
      return academicYears;
    }
    return academicYears.filter((year) => year.name.toLowerCase().includes(term));
  }, [yearDeleteSearch, academicYears]);

  const isLoading = isTransitioning;

  const handleSetActiveYear = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedYearId) {
      toast.error("Select an academic year");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("academicYearId", selectedYearId);
      const result = await setActiveAcademicYearAction(formData);

      if (result.success) {
        toast.success(result.message || "Academic year updated");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to update academic year");
      }
    });
  };

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newYearName.trim() || !newYearStartDate || !newYearEndDate) {
      toast.error("Please fill in all fields");
      return;
    }

    if (new Date(newYearStartDate) >= new Date(newYearEndDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", newYearName.trim());
      formData.set("startDate", newYearStartDate);
      formData.set("endDate", newYearEndDate);
      const result = await createAcademicYearAndActivate(formData);

      if (result.success) {
        toast.success(result.message || "Academic year created and activated");
        setNewYearName("");
        setNewYearStartDate("");
        setNewYearEndDate("");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to create academic year");
      }
    });
  };

  const handleDeleteYear = () => {
    if (!yearToDeleteId) {
      toast.error("Select an academic year to delete");
      return;
    }

    const selected = academicYears.find((year) => year.id.toString() === yearToDeleteId);
    if (!selected) {
      toast.error("Selected academic year was not found");
      return;
    }

    const { isActive } = selected;
    if (isActive) {
      toast.error("Cannot delete active academic year");
      return;
    }

    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteYear = () => {
    const selected = academicYears.find((year) => year.id.toString() === yearToDeleteId);
    if (!selected) {
      toast.error("Selected academic year was not found");
      return;
    }

    const { id: yearId, isActive } = selected;
    if (isActive) {
      toast.error("Cannot delete active academic year");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("academicYearId", String(yearId));
      const result = await deleteAcademicYearAction(formData);

      if (result.success) {
        toast.success(result.message || "Academic year deleted");
        setYearToDeleteId(null);
        setConfirmDeleteOpen(false);
      } else {
        toast.error(result.message || "Failed to delete academic year");
      }
    });
  };

  return (
    <Tabs defaultValue="select" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="select">Select Existing</TabsTrigger>
        <TabsTrigger value="create">Create New</TabsTrigger>
      </TabsList>

      <TabsContent value="select" className="space-y-4">
        <form onSubmit={handleSetActiveYear} className="space-y-4">
          <div className="space-y-2">
            <Label>Choose academic year</Label>
            <Select value={selectedYearId || ""} onValueChange={setSelectedYearId} disabled={isLoading}>
              <SelectTrigger className="w-full min-w-[20rem]">
                <SelectValue placeholder="Select a year">{selectedYearName}</SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-[20rem]">
                {academicYears && academicYears.length > 0 ? (
                  academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      <div className="flex items-center gap-2">
                        {year.name}
                        {year.isActive && <Badge variant="secondary" className="ml-2">Active</Badge>}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No academic years found</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            Set as Active
          </Button>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-brand-ink">Delete academic year</p>
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="year-delete-search">Search year</Label>
                <Input
                  id="year-delete-search"
                  value={yearDeleteSearch}
                  onChange={(e) => setYearDeleteSearch(e.target.value)}
                  placeholder="Search academic year"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label>Select year</Label>
                <Select value={yearToDeleteId || ""} onValueChange={(value) => setYearToDeleteId(value ?? null)} disabled={isLoading}>
                  <SelectTrigger className="w-full min-w-[18rem]">
                    <SelectValue placeholder="Choose academic year">{selectedYearToDelete?.name || ""}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[18rem] max-h-72">
                    {filteredYearDeleteOptions.length > 0 ? (
                      filteredYearDeleteOptions.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          <div className="flex items-center gap-2">
                            {year.name}
                            {year.isActive && <Badge variant="secondary">Active</Badge>}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No year found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="destructive" disabled={isLoading || !yearToDeleteId} onClick={handleDeleteYear}>
                <Trash2 className="mr-1 size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="create" className="space-y-4">
        <form onSubmit={handleCreateYear} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year-name">Academic Year Name</Label>
            <Input
              id="year-name"
              placeholder="e.g., 2025/2026"
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={newYearStartDate}
                onChange={(e) => setNewYearStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={newYearEndDate}
                onChange={(e) => setNewYearEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            Create & Activate
          </Button>
        </form>
      </TabsContent>

      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Academic Year"
        description={`Are you sure you want to delete \"${selectedYearToDelete?.name || "selected academic year"}\"? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={isLoading}
        onConfirm={handleConfirmDeleteYear}
      />
    </Tabs>
  );
}
