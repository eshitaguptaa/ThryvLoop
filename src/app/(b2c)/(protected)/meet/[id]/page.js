'use client';

import { useParams } from 'next/navigation';
import MeetRoom from '@/components/workspace/MeetRoom';

export default function MeetPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : null;
  return <MeetRoom meetingId={id} />;
}
