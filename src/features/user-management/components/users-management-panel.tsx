"use client";

import { Eye, Filter, Pencil, Search, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteManagedUser,updateManagedUser } from "@/features/user-management/actions/manage-users";
import type { ManagedUserRow, UsersManagementData } from "@/features/user-management/server/get-users-management-data";

type UsersManagementPanelProps = {
  data: UsersManagementData;
};

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "admin") {
    return "default";
  }

  if (role === "teacher") {
    return "secondary";
  }

  return "outline";
}

export function UsersManagementPanel({ data }: UsersManagementPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<ManagedUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    router.push(`/admin/users?${params.toString()}`);
  };

  const openEditDialog = (user: ManagedUserRow) => {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditStatus(user.status);
  };

  const handleUpdateUser = () => {
    if (!editingUser) {
      return;
    }

    startTransition(async () => {
      const result = await updateManagedUser({
        userId: editingUser.id,
        fullName: editName,
        isActive: editStatus === "active",
      });

      if (!result.success) {
        toast.error("Failed to update user", {
          description: result.error,
        });
        return;
      }

      toast.success("User updated");
      router.refresh();
      setEditingUser(null);
    });
  };

  const handleDeleteUser = (user: ManagedUserRow) => {
    startTransition(async () => {
      const result = await deleteManagedUser({ userId: user.id });
      if (!result.success) {
        toast.error("Failed to delete user", {
          description: result.error,
        });
        return;
      }

      toast.success("User deleted");
      router.refresh();
    });
  };

  return (
    <Card className="border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-brand-ink">
              <Users className="size-5" />
              User management
            </CardTitle>
            <CardDescription>
              Manage students, teachers, and admins with school-aware filters and profile actions.
            </CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-[0.12em] uppercase">
            {data.totalCount} total users
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form className="grid gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3 md:grid-cols-2 xl:grid-cols-8" method="get" action="/admin/users">
          <div className="xl:col-span-2">
            <Label htmlFor="search" className="sr-only">Search users</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="search" name="search" defaultValue={data.filters.search} placeholder="Search name, email, ID" className="pl-9" />
            </div>
          </div>

          <div>
            <select
              name="role"
              defaultValue={data.filters.role}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <select
              name="status"
              defaultValue={data.filters.status}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              name="grade"
              defaultValue={data.filters.grade || "all"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All grades</option>
              {data.options.grades.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              name="section"
              defaultValue={data.filters.section || "all"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All sections</option>
              {data.options.sections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              name="academicYear"
              defaultValue={data.filters.academicYear || "all"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All years</option>
              {data.options.academicYears.map((academicYear) => (
                <option key={academicYear} value={academicYear}>{academicYear}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="pageSize" value={String(data.pageSize)} />
            <Button type="submit" className="flex-1">
              <Filter className="size-4" />
              Apply
            </Button>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Identity</TableHead>
                <TableHead>Grade / Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-brand-ink">{user.fullName}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                    <TableCell>{user.identityNumber || "-"}</TableCell>
                    <TableCell>{user.grade ? `${user.grade} / ${user.section || "-"}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "secondary" : "outline"} className="capitalize">
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger className={buttonVariants({ variant: "outline", size: "icon" })}>
                            <Eye className="size-4" />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{user.fullName}</DialogTitle>
                              <DialogDescription>Full user profile details</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-3 text-sm">
                              <p><span className="font-medium">Role:</span> {user.role}</p>
                              <p><span className="font-medium">Email:</span> {user.email || "-"}</p>
                              <p><span className="font-medium">Identity:</span> {user.identityNumber || "-"}</p>
                              <p><span className="font-medium">Grade:</span> {user.grade || "-"}</p>
                              <p><span className="font-medium">Section:</span> {user.section || "-"}</p>
                              <p><span className="font-medium">Academic year:</span> {user.academicYear || "-"}</p>
                              <p><span className="font-medium">Status:</span> {user.status}</p>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => {
                          if (!open) {
                            setEditingUser(null);
                          } else {
                            openEditDialog(user);
                          }
                        }}>
                          <DialogTrigger className={buttonVariants({ variant: "outline", size: "icon" })}>
                            <Pencil className="size-4" />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit user</DialogTitle>
                              <DialogDescription>
                                Update display details and activation status.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-full-name">Full name</Label>
                                <Input
                                  id="edit-full-name"
                                  value={editName}
                                  onChange={(event) => setEditName(event.target.value)}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={editStatus} onValueChange={(value) => setEditStatus(value as "active" | "inactive") }>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                                Cancel
                              </Button>
                              <Button type="button" onClick={handleUpdateUser} disabled={isPending}>
                                Save changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger className={buttonVariants({ variant: "outline", size: "icon" })}>
                            <Trash2 className="size-4" />
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete user</DialogTitle>
                              <DialogDescription>
                                This removes the profile record for this user.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button type="button" variant="outline">
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isPending}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.currentPage} of {data.totalPages} ({data.totalCount} users)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.max(1, data.currentPage - 1))}
              disabled={data.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(Math.min(data.totalPages, data.currentPage + 1))}
              disabled={data.currentPage === data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
