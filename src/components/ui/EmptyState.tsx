import Link from 'next/link';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string; // Optional: Provide link for action 
    onAction?: () => void; // Optional: Provide handler for action (e.g., reset filters)
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    actionLink,
    onAction
}: EmptyStateProps) {
    return (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="text-5xl mb-4 text-gray-300">{icon}</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
                {description}
            </p>

            {actionLabel && (
                actionLink ? (
                    <Link
                        href={actionLink}
                        className="text-[#800000] font-medium hover:underline px-4 py-2"
                    >
                        {actionLabel}
                    </Link>
                ) : onAction ? (
                    <button
                        onClick={onAction}
                        className="text-[#800000] font-medium hover:underline px-4 py-2"
                    >
                        {actionLabel}
                    </button>
                ) : null
            )}
        </div>
    );
}
