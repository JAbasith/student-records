"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmActionDialog } from "@/features/academic-setup/components/ConfirmActionDialog";
import {
  createClassSectionAction,
  createGradeLevelAction,
  deleteClassSectionAction,
  deleteGradeLevelAction,
} from "@/features/academic-setup/features/academic-structure/actions/index";
import type { ClassSection, GradeLevel } from "@/features/academic-setup/shared/types";

type AcademicStructureCardProps = {
  classSections: ClassSection[];
  gradeLevels: GradeLevel[];
};

export function AcademicStructureCard({ classSections, gradeLevels }: Readonly<AcademicStructureCardProps>) {
  const [isPending, startTransition] = useTransition();
  const [gradeName, setGradeName] = useState("");
  const [gradeCategory, setGradeCategory] = useState("");
  const [gradeSortOrder, setGradeSortOrder] = useState("");

  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [gradeDeleteSearch, setGradeDeleteSearch] = useState("");
  const [gradeToDeleteId, setGradeToDeleteId] = useState<string | null>(null);
  const [sectionDeleteSearch, setSectionDeleteSearch] = useState("");
  const [sectionToDeleteId, setSectionToDeleteId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { id: string; kind: "grade" | "section"; label: string } | null
  >(null);

  const filteredGradeDeleteOptions = useMemo(() => {
    const term = gradeDeleteSearch.trim().toLowerCase();
    if (!term) {
      return gradeLevels;
    }
    return gradeLevels.filter((grade) => grade.name.toLowerCase().includes(term));
  }, [gradeDeleteSearch, gradeLevels]);

  const filteredSectionDeleteOptions = useMemo(() => {
    const term = sectionDeleteSearch.trim().toLowerCase();
    if (!term) {
      return classSections;
    }
    return classSections.filter((section) => section.label.toLowerCase().includes(term));
  }, [sectionDeleteSearch, classSections]);

  const selectedGradeToDeleteName =
    gradeLevels.find((grade) => grade.id.toString() === gradeToDeleteId)?.name || "";
  const selectedSectionToDeleteLabel =
    classSections.find((section) => section.id.toString() === sectionToDeleteId)?.label || "";

  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gradeName.trim()) {
      toast.error("Grade name is required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", gradeName.trim());
      formData.set("category", gradeCategory.trim());
      formData.set("sortOrder", gradeSortOrder.trim());
      const result = await createGradeLevelAction(formData);

      if (result.success) {
        toast.success(result.message || "Grade level created");
        setGradeName("");
        setGradeCategory("");
        setGradeSortOrder("");
      } else {
        toast.error(result.message || "Failed to create grade level");
      }
    });
  };

  const handleDeleteGrade = () => {
    if (!gradeToDeleteId) {
      toast.error("Select a grade level to delete");
      return;
    }

    setConfirmDelete({
      id: gradeToDeleteId,
      kind: "grade",
      label: selectedGradeToDeleteName || "selected grade level",
    });
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGradeLevelId) {
      toast.error("Select a grade level");
      return;
    }

    if (!sectionName.trim()) {
      toast.error("Class section name is required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("gradeLevelId", selectedGradeLevelId);
      formData.set("name", sectionName.trim());
      const result = await createClassSectionAction(formData);

      if (result.success) {
        toast.success(result.message || "Class section created");
        setSectionName("");
      } else {
        toast.error(result.message || "Failed to create class section");
      }
    });
  };

  const handleDeleteSection = () => {
    if (!sectionToDeleteId) {
      toast.error("Select a class section to delete");
      return;
    }

    setConfirmDelete({
      id: sectionToDeleteId,
      kind: "section",
      label: selectedSectionToDeleteLabel || "selected class section",
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      if (confirmDelete.kind === "grade") {
        formData.set("gradeLevelId", confirmDelete.id);
        const result = await deleteGradeLevelAction(formData);

        if (result.success) {
          toast.success(result.message || "Grade level deleted");
          setGradeToDeleteId(null);
          setConfirmDelete(null);
        } else {
          toast.error(result.message || "Failed to delete grade level");
        }
        return;
      }

      formData.set("classSectionId", confirmDelete.id);
      const result = await deleteClassSectionAction(formData);

      if (result.success) {
        toast.success(result.message || "Class section deleted");
        setSectionToDeleteId(null);
        setConfirmDelete(null);
      } else {
        toast.error(result.message || "Failed to delete class section");
      }
    });
  };

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle className="text-brand-ink">Academic Structure</CardTitle>
        <CardDescription>Create and delete grade levels and class sections for setup.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grades" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grades">Grade Levels</TabsTrigger>
            <TabsTrigger value="sections">Class Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="space-y-4 pt-4">
            <form className="space-y-3" onSubmit={handleCreateGrade}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="grade-name">Grade name</Label>
                  <Input
                    id="grade-name"
                    value={gradeName}
                    onChange={(e) => setGradeName(e.target.value)}
                    placeholder="Grade 10"
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="grade-order">Sort order</Label>
                  <Input
                    id="grade-order"
                    value={gradeSortOrder}
                    onChange={(e) => setGradeSortOrder(e.target.value)}
                    placeholder="10"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grade-category">Category (optional)</Label>
                <Input
                  id="grade-category"
                  value={gradeCategory}
                  onChange={(e) => setGradeCategory(e.target.value)}
                  placeholder="Secondary"
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending}>Create grade level</Button>
            </form>

            <div className="space-y-3">
              <p className="text-sm font-medium text-brand-ink">Delete grade level</p>
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="grid gap-2">
                  <Label htmlFor="grade-delete-search">Search grade</Label>
                  <Input
                    id="grade-delete-search"
                    value={gradeDeleteSearch}
                    onChange={(e) => setGradeDeleteSearch(e.target.value)}
                    placeholder="Search grade"
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Select grade</Label>
                  <Select value={gradeToDeleteId || ""} onValueChange={(value) => setGradeToDeleteId(value ?? null)} disabled={isPending}>
                    <SelectTrigger className="w-full min-w-[18rem]">
                      <SelectValue placeholder="Choose grade">{selectedGradeToDeleteName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[18rem] max-h-72">
                      {filteredGradeDeleteOptions.length > 0 ? (
                        filteredGradeDeleteOptions.map((grade) => (
                          <SelectItem key={grade.id} value={String(grade.id)}>
                            {grade.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No grade found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="destructive" disabled={isPending || !gradeToDeleteId} onClick={handleDeleteGrade}>
                  <Trash2 className="mr-1 size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 pt-4">
            <form className="space-y-3" onSubmit={handleCreateSection}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Grade level</Label>
                  <Select
                    value={selectedGradeLevelId || ""}
                    onValueChange={(value) => setSelectedGradeLevelId(value ?? null)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full min-w-[20rem]">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[20rem]">
                      {gradeLevels.map((grade) => (
                        <SelectItem key={grade.id} value={String(grade.id)}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="section-name">Section name</Label>
                  <Input
                    id="section-name"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="A"
                    disabled={isPending}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isPending}>Create class section</Button>
            </form>

            <div className="space-y-3">
              <p className="text-sm font-medium text-brand-ink">Delete class section</p>
              <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="grid gap-2">
                  <Label htmlFor="section-delete-search">Search section</Label>
                  <Input
                    id="section-delete-search"
                    value={sectionDeleteSearch}
                    onChange={(e) => setSectionDeleteSearch(e.target.value)}
                    placeholder="Search section"
                    disabled={isPending}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Select section</Label>
                  <Select value={sectionToDeleteId || ""} onValueChange={(value) => setSectionToDeleteId(value ?? null)} disabled={isPending}>
                    <SelectTrigger className="w-full min-w-[18rem]">
                      <SelectValue placeholder="Choose section">{selectedSectionToDeleteLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[18rem] max-h-72">
                      {filteredSectionDeleteOptions.length > 0 ? (
                        filteredSectionDeleteOptions.map((section) => (
                          <SelectItem key={section.id} value={String(section.id)}>
                            {section.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No section found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="destructive" disabled={isPending || !sectionToDeleteId} onClick={handleDeleteSection}>
                  <Trash2 className="mr-1 size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <ConfirmActionDialog
          open={Boolean(confirmDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDelete(null);
            }
          }}
          title={confirmDelete?.kind === "grade" ? "Delete Grade Level" : "Delete Class Section"}
          description={`Are you sure you want to delete \"${confirmDelete?.label || "selected item"}\"? This action cannot be undone.`}
          confirmLabel="Delete"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
        />
      </CardContent>
    </Card>
  );
}
