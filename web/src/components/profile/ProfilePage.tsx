import { useStudentProfile, useUpdateUserProfile, useUpdateStudentProfile, useLanguages } from "@/hooks/useApiQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "../navigation/Navbar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const userProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});



export const ProfilePage = () => {
  const { data: profile, isLoading, error } = useStudentProfile();
  const { data: languages } = useLanguages();
  const updateUserProfileMutation = useUpdateUserProfile();
  const updateStudentProfileMutation = useUpdateStudentProfile();

  const { register: registerUser, handleSubmit: handleUserSubmit, formState: { errors: userErrors } } = useForm({
    resolver: zodResolver(userProfileSchema),
    values: {
      first_name: profile?.user.first_name || "",
      last_name: profile?.user.last_name || "",
      email: profile?.user.email || "",
    },
  });

  

  const onUserSubmit = (data: any) => {
    updateUserProfileMutation.mutate(data);
  };

  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-6">
        <div className="max-w-4xl mx-auto py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error loading profile data.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Username</Label>
                  <p className="text-lg font-semibold">{profile.user.username}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <p className="text-lg">{profile.user.account_type}</p>
                </div>
                {profile.student_profile && (
                  <>
                    <div>
                      <Label>Language</Label>
                      <p className="text-lg">{profile.student_profile.language}</p>
                    </div>
                    <div>
                      <Label>Current Grade</Label>
                      <p className="text-lg">
                        {profile.student_profile.current_grade}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Edit User Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit(onUserSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      {...registerUser("first_name")}
                    />
                    {userErrors.first_name && (
                      <p className="text-red-500 dark:text-red-400 text-sm">
                        {userErrors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      {...registerUser("last_name")}
                    />
                    {userErrors.last_name && (
                      <p className="text-red-500 dark:text-red-400 text-sm">
                        {userErrors.last_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerUser("email")}
                    />
                    {userErrors.email && (
                      <p className="text-red-500 dark:text-red-400 text-sm">
                        {userErrors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={updateUserProfileMutation.isPending}>
                    {updateUserProfileMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </div>
    </div>
  );
};
