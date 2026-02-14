'use client';

import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8 flex justify-center items-center gap-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 transition-all focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none active:scale-[0.98]"
            >
                Previous
            </button>

            <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none active:scale-[0.95] ${currentPage === page
                            ? 'bg-[#800000] text-white border-[#800000]'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 transition-all focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none active:scale-[0.98]"
            >
                Next
            </button>
        </div>
    );
}
