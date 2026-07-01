export function DrawerHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: React.ReactNode }) {
    return (
        <div className="-mx-6 mb-5 border-b px-6 pb-4 pr-12">
            <h3 className="text-lg font-semibold">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            {badge && <div className="mt-2">{badge}</div>}
        </div>
    );
}