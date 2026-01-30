import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="bg-[#f5f5f5] border-b border-gray-200">
            <div className="container mx-auto px-4 py-2">
                <ol className="flex items-center gap-2 text-sm">
                    <li>
                        <Link href="/" className="text-[#800000] hover:underline">
                            Home
                        </Link>
                    </li>
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <span className="text-gray-400">/</span>
                            {item.href ? (
                                <Link href={item.href} className="text-[#800000] hover:underline">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-gray-600">{item.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </nav>
    );
}
