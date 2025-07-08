import { useState } from 'react';
import { FaPen } from 'react-icons/fa';

interface WorkspaceNameProps {
  workspace: string;
  updateWorkspaceName: (newName: string) => void;
}

export default function WorkspaceName({
  workspace,
  updateWorkspaceName,
}: WorkspaceNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(workspace);

  const handleSave = () => {
    if (newName.trim() !== workspace) {
      updateWorkspaceName(newName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="mb-6 text-gray-500">
      Workspace:{' '}
      {isEditing ? (
        <span className="inline-flex items-center gap-2">
          <input
            className="border-b border-gray-400 bg-transparent focus:outline-none text-gray-800 font-semibold"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
          />
          <button className="text-sm text-teal-600" onClick={handleSave}>
            บันทึก
          </button>
          <button
            className="text-sm text-gray-400"
            onClick={() => {
              setIsEditing(false);
              setNewName(workspace);
            }}
          >
            ยกเลิก
          </button>
        </span>
      ) : (
        <span className="font-semibold text-gray-800 inline-flex items-center gap-2">
          {workspace || 'ไม่พบ'}
          <FaPen
            className="text-xs cursor-pointer text-gray-400 hover:text-teal-600"
            onClick={() => setIsEditing(true)}
          />
        </span>
      )}
    </div>
  );
}
