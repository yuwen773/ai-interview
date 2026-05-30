import { VrmViewer } from '../components/VrmViewer';
import { AvatarInterviewCard } from '../components/AvatarInterviewCard';

export default function AvatarInterviewPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Avatar Interview</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">AI Avatar powered interview session</p>
      </div>
      <AvatarInterviewCard
        title="Your AI Interviewer"
        subtitle="Powered by VRM avatar"
      />
      <VrmViewer modelUrl="/models/avatar.vrm" />
    </div>
  );
}