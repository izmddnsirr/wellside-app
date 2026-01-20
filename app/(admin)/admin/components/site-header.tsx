import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type SiteHeaderProps = {
  title?: string;
  meta?: React.ReactNode;
};

export function SiteHeader({ title, meta }: SiteHeaderProps) {
  const todayLabel = new Intl.DateTimeFormat("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date());

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title || "Administrator"}</h1>
        <div className="ml-auto flex items-center gap-3 text-right">
          {meta ? <div className="flex items-center">{meta}</div> : null}
          <p className="text-sm font-semibold text-foreground">{todayLabel}</p>
        </div>
      </div>
    </header>
  );
}
