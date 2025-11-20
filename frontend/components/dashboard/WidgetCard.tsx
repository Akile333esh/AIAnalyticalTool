import { ReactNode } from "react";
import { Card } from "../ui/Card";

interface Props {
  title: string;
  children: ReactNode;
}

export function WidgetCard({ title, children }: Props) {
  return (
    <Card className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="text-xs text-slate-300">{children}</div>
    </Card>
  );
}
