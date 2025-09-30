import { useNavigate } from "react-router-dom";
import ActionButton from './ActionButton';

export default function ReportButton({ targetId, targetType, ownerId, currentUserId }) {
  const navigate = useNavigate();

  const isOwner = ownerId && currentUserId && String(ownerId) === String(currentUserId);

  // If the current user is the owner, don't render a report button at all (per UX requirement)
  if (isOwner) return null;

  const handleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/report?type=${targetType}&id=${targetId}`, { state: targetType === 'post' ? { postIdOwner: ownerId } : { commentIdOwner: ownerId } });
  };

  return (
    <ActionButton variant="ghost" size="sm" onClick={handleClick} className="ml-2 text-red-600" title={'รายงาน'}>รายงาน</ActionButton>
  );
}
