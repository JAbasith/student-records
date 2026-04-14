"use client";

import { AlertCircle, BookOpenCheck, Check, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog } from "@/features/academic-setup/components/ConfirmActionDialog";
import {
  createSubjectCatalogItem,
  createSubjectOffering,
  deleteSubjectCatalogItem,
  deleteSubjectOffering,
  getOfferedClassSectionIdsForSubject,
} from "@/features/academic-setup/features/subject-catalog/actions/index";
import type { ClassSection, Offering, Subject } from "@/features/academic-setup/shared/types";

type SubjectCatalogCardProps = {
  offerings: Offering[];
  subjects: Subject[];
  classSections: ClassSection[];
};

export function SubjectCatalogCard({ subjects, classSections, offerings }: Readonly<SubjectCatalogCardProps>) {
  const [isPending, startTransition] = useTransition();
  const [isCheckingSections, startCheckingSections] = useTransition();

  // Create subject form
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  // Create offering form
  const [offeringSubjectId, setOfferingSubjectId] = useState<string | null>(null);
  const [selectedClassSectionIds, setSelectedClassSectionIds] = useState<string[]>([]);
  const [classSectionSearch, setClassSectionSearch] = useState("");
  const [offeredSectionIds, setOfferedSectionIds] = useState<string[]>([]);
  const [deleteSubjectSearch, setDeleteSubjectSearch] = useState("");
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteOfferingSearch, setDeleteOfferingSearch] = useState("");
  const [deleteOfferingId, setDeleteOfferingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    { id: string; kind: "offering" | "subject"; label: string } | null
  >(null);

  // Get selected subject info
  const selectedSubject = subjects.find((subject) => subject.id.toString() === offeringSubjectId);
  const existingOfferingsSectionIds = useMemo(() => new Set(offeredSectionIds), [offeredSectionIds]);

  // Filter class sections: only show when subject is selected AND exclude already-used sections
  const availableClassSections = useMemo(() => {
    if (!offeringSubjectId) return [];
    
    return classSections.filter(
      (section) => !existingOfferingsSectionIds.has(section.id.toString())
    );
  }, [offeringSubjectId, classSections, existingOfferingsSectionIds]);

  // Filter available sections based on search
  const filteredClassSections = availableClassSections.filter((section) =>
    section.label.toLowerCase().includes(classSectionSearch.trim().toLowerCase()),
  );

  const selectedSectionLabels = classSections
    .filter((section) => selectedClassSectionIds.includes(section.id.toString()))
    .map((section) => section.label);

  const filteredSubjectDeleteOptions = useMemo(() => {
    const term = deleteSubjectSearch.trim().toLowerCase();
    if (!term) {
      return subjects;
    }
    return subjects.filter((subject) => subject.label.toLowerCase().includes(term));
  }, [deleteSubjectSearch, subjects]);

  const filteredOfferingDeleteOptions = useMemo(() => {
    const term = deleteOfferingSearch.trim().toLowerCase();
    if (!term) {
      return offerings;
    }
    return offerings.filter((offering) => offering.label.toLowerCase().includes(term));
  }, [deleteOfferingSearch, offerings]);

  const selectedSubjectToDeleteLabel =
    subjects.find((subject) => subject.id.toString() === deleteSubjectId)?.label || "";
  const selectedOfferingToDeleteLabel =
    offerings.find((offering) => offering.id.toString() === deleteOfferingId)?.label || "";

  const loadOfferedSectionsForSubject = (subjectIdValue: string) => {
    startCheckingSections(async () => {
      const subjectId = Number.parseInt(subjectIdValue, 10);
      const result = await getOfferedClassSectionIdsForSubject(subjectId);

      if (!result.success) {
        setOfferedSectionIds([]);
        toast.error(result.message || "Failed to load available class sections");
        return;
      }

      setOfferedSectionIds(result.classSectionIds.map((id) => id.toString()));
    });
  };

  const handleSubjectChange = (value: string | null) => {
    const nextSubjectId = value ?? null;
    setOfferingSubjectId(nextSubjectId);
    setSelectedClassSectionIds([]);
    setClassSectionSearch("");

    if (!nextSubjectId) {
      setOfferedSectionIds([]);
      return;
    }

    loadOfferedSectionsForSubject(nextSubjectId);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subjectName.trim()) {
      toast.error("Subject name is required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", subjectName.trim());
      formData.set("code", subjectCode.trim());
      const result = await createSubjectCatalogItem(formData);

      if (result.success) {
        toast.success(result.message || "Subject created");
        setSubjectName("");
        setSubjectCode("");
      } else {
        toast.error(result.message || "Failed to create subject");
      }
    });
  };

  const handleDeleteSubject = () => {
    if (!deleteSubjectId) {
      toast.error("Select a subject to delete");
      return;
    }

    setConfirmDelete({
      id: deleteSubjectId,
      kind: "subject",
      label: selectedSubjectToDeleteLabel || "selected subject",
    });
  };

  const handleCreateOffering = (e: React.FormEvent) => {
    e.preventDefault();

    if (!offeringSubjectId || selectedClassSectionIds.length === 0) {
      toast.error("Select subject and at least one class section");
      return;
    }

    // Validate that none of the selected sections already have this offering
    const alreadyOfferedSections = selectedClassSectionIds.filter((id) =>
      existingOfferingsSectionIds.has(id)
    );

    if (alreadyOfferedSections.length > 0) {
      const sectionLabels = classSections
        .filter((s) => alreadyOfferedSections.includes(s.id.toString()))
        .map((s) => s.label)
        .join(", ");
      toast.error(`This subject is already offered in: ${sectionLabels}`);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("subjectId", offeringSubjectId);
      selectedClassSectionIds.forEach((sectionId) => {
        formData.append("classSectionIds", sectionId);
      });
      const result = await createSubjectOffering(formData);

      if (result.success) {
        toast.success(result.message || "Offering created");

        setSelectedClassSectionIds([]);
        setClassSectionSearch("");

        // Re-sync from database so only remaining class sections are shown.
        loadOfferedSectionsForSubject(offeringSubjectId);
      } else {
        toast.error(result.message || "Failed to create offering");
      }
    });
  };

  const handleDeleteOffering = () => {
    if (!deleteOfferingId) {
      toast.error("Select a subject offering to delete");
      return;
    }

    setConfirmDelete({
      id: deleteOfferingId,
      kind: "offering",
      label: selectedOfferingToDeleteLabel || "selected offering",
    });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      if (confirmDelete.kind === "subject") {
        formData.set("subjectId", confirmDelete.id);
        const result = await deleteSubjectCatalogItem(formData);

        if (result.success) {
          toast.success(result.message || "Subject deleted");
          setDeleteSubjectId(null);
          setConfirmDelete(null);
        } else {
          toast.error(result.message || "Failed to delete subject");
        }
        return;
      }

      formData.set("offeringId", confirmDelete.id);
      const result = await deleteSubjectOffering(formData);

      if (result.success) {
        toast.success(result.message || "Subject offering deleted");
        setDeleteOfferingId(null);
        setConfirmDelete(null);
        if (offeringSubjectId) {
          loadOfferedSectionsForSubject(offeringSubjectId);
        }
      } else {
        toast.error(result.message || "Failed to delete subject offering");
      }
    });
  };

  const toggleClassSection = (sectionId: string) => {
    setSelectedClassSectionIds((current) =>
      current.includes(sectionId) ? current.filter((id) => id !== sectionId) : [...current, sectionId],
    );
  };

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <BookOpenCheck className="mr-1 size-3.5" />
            Subject catalog
          </Badge>
        </div>
        <CardTitle className="text-brand-ink">Create subject catalog and offerings</CardTitle>
        <CardDescription>Add a subject once, then map it to a class section as an offering.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Subject Form */}
        <form className="space-y-3" onSubmit={handleCreateSubject}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="subject-name">Subject name</Label>
              <Input
                id="subject-name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                disabled={isPending}
                placeholder="Mathematics"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject-code">Subject code (optional)</Label>
              <Input
                id="subject-code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                disabled={isPending}
                placeholder="MATH-101"
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            Create subject
          </Button>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-brand-ink">Delete subject</p>
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="subject-delete-search">Search subject</Label>
                <Input
                  id="subject-delete-search"
                  value={deleteSubjectSearch}
                  onChange={(e) => setDeleteSubjectSearch(e.target.value)}
                  placeholder="Search by subject name or code"
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label>Select subject</Label>
                <Select value={deleteSubjectId || ""} onValueChange={(value) => setDeleteSubjectId(value ?? null)} disabled={isPending}>
                  <SelectTrigger className="w-full min-w-[24rem]">
                    <SelectValue placeholder="Choose subject">{selectedSubjectToDeleteLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-md max-h-72">
                    {filteredSubjectDeleteOptions.length > 0 ? (
                      filteredSubjectDeleteOptions.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No subject found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <Button type="button" variant="destructive" disabled={isPending || !deleteSubjectId} onClick={handleDeleteSubject}>
                <Trash2 className="mr-1 size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </form>

        {/* Create Offering Form */}
        <form className="space-y-4" onSubmit={handleCreateOffering}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="offering-subject">Select subject to create offerings</Label>
              <Select value={offeringSubjectId || ""} onValueChange={handleSubjectChange} disabled={isPending || isCheckingSections}>
                <SelectTrigger className="w-full min-w-[20rem]" id="offering-subject">
                  <SelectValue placeholder="Choose a subject...">
                    {selectedSubject ? selectedSubject.label : "Choose a subject..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-[20rem]">
                  {subjects.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Create a subject first</div>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Class Sections Container - Only show when subject is selected */}
          {offeringSubjectId && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-linear-to-b from-brand/5 via-muted/30 to-muted/20 p-4">
              {/* Subject Name and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-brand-ink">{selectedSubject?.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {isCheckingSections ? "Checking..." : availableClassSections.length > 0 ? `${availableClassSections.length} available` : "All offered"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold text-brand-ink">Select class sections</Label>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isCheckingSections
                      ? "Checking existing offerings for this subject..."
                      : availableClassSections.length === 0
                      ? "This subject is already offered in all available sections"
                      : `Choose sections to add this subject (${selectedClassSectionIds.length} selected)`}
                  </p>
                </div>
                {selectedSectionLabels.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {selectedSectionLabels.slice(0, 2).map((label) => (
                      <Badge key={label} variant="secondary" className="whitespace-nowrap rounded-full text-xs">
                        {label}
                      </Badge>
                    ))}
                    {selectedSectionLabels.length > 2 && (
                      <Badge variant="secondary" className="whitespace-nowrap rounded-full text-xs">
                        +{selectedSectionLabels.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Empty state when all sections have offerings */}
              {isCheckingSections ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-background p-4">
                  <p className="text-sm text-muted-foreground">Checking existing offerings...</p>
                </div>
              ) : availableClassSections.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-background p-4">
                  <AlertCircle className="size-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-muted-foreground">
                    Subject is already offered in all available class sections.
                  </p>
                </div>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={classSectionSearch}
                      onChange={(e) => setClassSectionSearch(e.target.value)}
                      disabled={isPending}
                      placeholder="Search sections..."
                      className="pl-9"
                    />
                  </div>

                  {/* Class Sections Grid */}
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredClassSections.length > 0 ? (
                        filteredClassSections.map((section) => {
                          const isSelected = selectedClassSectionIds.includes(section.id.toString());

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => toggleClassSection(section.id.toString())}
                              disabled={isPending}
                              className={`group flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                                isSelected
                                  ? "border-brand/60 bg-brand/8 shadow-sm ring-1 ring-brand/30"
                                  : "border-border/60 bg-card hover:border-brand/40 hover:bg-muted/40"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-all ${
                                  isSelected
                                    ? "border-brand bg-brand text-white"
                                    : "border-border bg-background group-hover:border-brand/60"
                                }`}
                              >
                                {isSelected && <Check className="size-3" strokeWidth={3} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block whitespace-normal wrap-break-word text-sm font-medium leading-snug text-foreground">
                                  {section.label}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-full rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-center text-sm text-muted-foreground">
                          No sections match &ldquo;{classSectionSearch}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isPending || selectedClassSectionIds.length === 0}
                      className="min-w-fit"
                    >
                      Create {selectedClassSectionIds.length > 0 ? `offering${selectedClassSectionIds.length > 1 ? "s" : ""}` : "offering"} ({selectedClassSectionIds.length})
                    </Button>
                    {selectedClassSectionIds.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setSelectedClassSectionIds([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Helper text when no subject selected */}
          {!offeringSubjectId && (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              Select a subject above to see available class sections
            </div>
          )}
        </form>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="text-sm font-medium text-brand-ink">Delete subject offering</p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="offering-delete-search">Search offering</Label>
              <Input
                id="offering-delete-search"
                value={deleteOfferingSearch}
                onChange={(e) => setDeleteOfferingSearch(e.target.value)}
                placeholder="Search by subject or section"
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label>Select offering</Label>
              <Select value={deleteOfferingId || ""} onValueChange={(value) => setDeleteOfferingId(value ?? null)} disabled={isPending}>
                <SelectTrigger className="w-full min-w-[24rem]">
                  <SelectValue placeholder="Choose offering">{selectedOfferingToDeleteLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-md max-h-72">
                  {filteredOfferingDeleteOptions.length > 0 ? (
                    filteredOfferingDeleteOptions.map((offering) => (
                      <SelectItem key={offering.id} value={offering.id.toString()}>
                        {offering.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No offering found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            </div>
            <Button type="button" variant="destructive" disabled={isPending || !deleteOfferingId} onClick={handleDeleteOffering}>
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <ConfirmActionDialog
          open={Boolean(confirmDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDelete(null);
            }
          }}
          title={confirmDelete?.kind === "offering" ? "Delete Subject Offering" : "Delete Subject"}
          description={`Are you sure you want to delete \"${confirmDelete?.label || "selected item"}\"? This action cannot be undone.`}
          confirmLabel="Delete"
          isPending={isPending}
          onConfirm={handleConfirmDelete}
        />
      </CardContent>
    </Card>
  );
}
