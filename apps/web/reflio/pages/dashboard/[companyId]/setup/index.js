import setupStepCheck from '@/utils/setupStepCheck';
import LoadingTile from '@/components/ui/LoadingTile'; 

export default function SetupPage() {
  setupStepCheck();

  return (
    <div className="pt-12 wrapper">
      <LoadingTile/>
    </div>
  );
}