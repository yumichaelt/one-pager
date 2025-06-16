import React from 'react';

type SideBySideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  originalContent: string;
  suggestedContent: string;
  fieldName: string;
};

const SideBySideModal: React.FC<SideBySideModalProps> = ({ isOpen, onClose, onAccept, originalContent, suggestedContent, fieldName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full flex flex-col max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4">Review AI Suggestion for "{fieldName}"</h2>
        <div className="grid grid-cols-2 gap-6 overflow-y-auto">
          <div>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">Original</h3>
            <div className="prose max-w-none p-2 bg-gray-50 rounded-md whitespace-pre-wrap">{originalContent}</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">AI Suggestion</h3>
            <div className="prose max-w-none p-2 bg-green-50 rounded-md whitespace-pre-wrap">{suggestedContent}</div>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded text-gray-700 bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700"
          >
            Accept Suggestion
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideBySideModal; 