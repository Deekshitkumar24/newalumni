import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumb({ items, className = "bg-[#1a1a2e] border-gray-800" }: BreadcrumbProps) {
    return (
        <nav className={`w-full border-b ${className}`}>
            <div className="container mx-auto px-4 py-3">
                <ol className="flex items-center gap-2 text-sm text-white/80">
                    <li>
                        <Link href="/" className="!text-white font-medium hover:!text-white/90 hover:underline transition-all">
                            Home
                        </Link>
                    </li>
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <span className="text-white">/</span>
                            {item.href ? (
                                <Link href={item.href} className="!text-white font-medium hover:!text-white/90 hover:underline transition-all">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-white font-normal cursor-default">{item.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </nav>
    );
}
