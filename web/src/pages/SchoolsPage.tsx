import { useState } from "react";
import { useApplyToSchool, useSchools, useStudentDashboard } from "@/hooks/useApiQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const SchoolsPage = () => {
  const { data: schools } = useSchools();
  const { data: dashboard } = useStudentDashboard();
  const apply = useApplyToSchool();
  const [grade, setGrade] = useState(6);

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">Directory</p>
        <h1 className="mt-2 font-display text-5xl">Schools</h1>
        <p className="mt-3 text-muted-foreground">Apply to a school. Staff will enroll you in classes for your grade.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">Grade</span>
        <Input type="number" className="w-24" value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
      </div>
      {(dashboard?.applications || []).length ? (
        <div className="space-y-2">
          <h2 className="font-display text-2xl">Your applications</h2>
          {dashboard?.applications?.map((item) => (
            <div key={item.id} className="flex justify-between rounded-xl border border-border/80 p-3">
              <span>{item.school_name}</span>
              <Badge>{item.status}</Badge>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4">
        {(schools || []).map((school) => (
          <Card key={school.id} variant="interactive">
            <CardHeader>
              <CardTitle>{school.name}</CardTitle>
              <CardDescription>{school.description || school.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => apply.mutate({ schoolId: school.id, grade_level: grade })} disabled={apply.isPending}>
                Apply
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
