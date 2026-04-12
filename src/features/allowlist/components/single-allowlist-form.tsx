"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserRole } from "@/features/access-control/access-control.types";

import { addToAllowlist } from "../actions/add-to-allowlist";

export function SingleAllowlistForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "student" as UserRole,
    identityNumber: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id.replace("allowlist-single-", "")]: value,
    }));
  };

  const handleRoleChange = (value: string | null) => {
    if (value) {
      setFormData((prev) => ({
        ...prev,
        role: value as UserRole,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Add a full name", {
        description: "We use this for the profile record and dashboard display.",
      });
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Add an email address", {
        description: "This is the login email that will be checked against the allowlist.",
      });
      return;
    }
    if (!formData.identityNumber.trim()) {
      toast.error("Add the identity number", {
        description: formData.role === "student"
          ? "Use the admission number for students."
          : formData.role === "teacher"
            ? "Use the employee number for teachers."
            : "Admins do not need a staff or admission number.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await addToAllowlist({
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        role: formData.role,
        identityNumber: formData.identityNumber.trim(),
      });

      if (result.success) {
        toast.success("User added to allowlist", {
          description: `${formData.fullName.trim()} is ready to sign in as ${formData.role}.`,
        });
        setFormData({
          fullName: "",
          email: "",
          role: "student",
          identityNumber: "",
        });
      } else {
        toast.error("Could not add the user", {
          description: result.error || "Please check the details and try again.",
        });
      }
    } catch (error) {
      toast.error("Unexpected error", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Single entry
          </Badge>
        </div>
        <CardTitle className="text-brand-ink">Add one user to allowlist</CardTitle>
        <CardDescription>
          Use this for adding an individual teacher, student, or admin account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="allowlist-single-fullName">Full name</Label>
              <Input
                id="allowlist-single-fullName"
                placeholder="Amali Perera"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allowlist-single-email">Email</Label>
              <Input
                id="allowlist-single-email"
                type="email"
                placeholder="teacher@school.edu"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="role-select">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allowlist-single-identityNumber">Identity number</Label>
              <Input
                id="allowlist-single-identityNumber"
                placeholder="EMP-1044 or ADM-2201"
                value={formData.identityNumber}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={isLoading} className="sm:w-auto">
              <UserPlus className="size-4" />
              {isLoading ? "Adding..." : "Add to allowlist"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}