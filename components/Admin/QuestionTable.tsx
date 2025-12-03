import React, { useState } from 'react';
import { Edit2, Trash2, Eye, Search } from 'lucide-react';
import { KnowledgeItem } from '../../types';
import { deleteItem } from '../../services/api';

interface Props {
    data: KnowledgeItem[];
    onEdit: (item: KnowledgeItem) => void;
    onDelete: () => void;
}

export const QuestionTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
    const [filter, setFilter] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const filteredData = data.filter(item =>
        item.question.toLowerCase().includes(filter.toLowerCase()) ||
        item.category.toLowerCase().includes(filter.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            setIsDeleting(id);
            await deleteItem(id);
            setIsDeleting(null);
            onDelete();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header / Filter */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">All Questions ({data.length})</h3>
                <div className="relative w-64">
                    <Search className="absolute top-2.5 left-3 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Question</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Views</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 max-w-md truncate">
                                        {item.question}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.category}
                                        </span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-gray-500">{item.subcategory}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3 text-gray-400" />
                                            {item.views}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={isDeleting === item.id}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {isDeleting === item.id ? (
                                                    <span className="w-4 h-4 block rounded-full border-2 border-red-600 border-t-transparent animate-spin"></span>
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No questions found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
