export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}