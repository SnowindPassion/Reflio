import { useRouter } from 'next/router';
import { useCompany } from '@/utils/CompanyContext';
import LoadingTile from '@/components/LoadingTile';
import { SEOMeta } from '@/templates/SEOMeta'; 

export default function InnerDashboardPage() {
  const router = useRouter();
  const { activeCompany } = useCompany();

  if(activeCompany?.payment_integration_type === null){
    router.replace(`/dashboard/${router?.query?.companyId}/setup`);
  } else {
    router.replace(`/dashboard/${router?.query?.companyId}/campaigns`);
  }
  
  return (
    <>
      <SEOMeta title="Dashboard"/>
      <div className="pt-12 wrapper">
        <LoadingTile/>
      </div>
    </>
  );
}