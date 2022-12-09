import { useRouter } from 'next/router';
import { useCompany } from './CompanyContext';
import { useCampaign } from './CampaignContext';

export default function setupStepCheck(type) {
  const router = useRouter();
  const { activeCompany } = useCompany();
  const { userCampaignDetails } = useCampaign();

  const replaceUrl = (url) => {
    if(router.asPath === `/dashboard/${router?.query?.companyId}${url}`) return false;

    console.log('ok')
    console.log(`/dashboard/${router?.query?.companyId}${url}`)

    router.replace(`/dashboard/${router?.query?.companyId}${url}`);
  }

  if(activeCompany){
    if(type === 'light'){
      if(activeCompany?.payment_integration_type === null){
        replaceUrl('/setup/payment-processor');
      }
    
      if(activeCompany?.payment_integration_type !== null && activeCompany?.company_currency === null){
        replaceUrl('/setup/currency');
      }

    } else {
      if(activeCompany?.payment_integration_type === null){
        replaceUrl('/setup/payment-processor');
      }
    
      if(activeCompany?.payment_integration_type !== null && activeCompany?.company_currency === null){
        replaceUrl('/setup/currency');
      }
    
      if(activeCompany?.payment_integration_type !== null && activeCompany?.company_currency !== null && userCampaignDetails?.length === 0){
        replaceUrl('/setup/campaign');
      }
    
      if(activeCompany?.payment_integration_type !== null && activeCompany?.company_currency !== null && userCampaignDetails !== null && userCampaignDetails?.length > 0 && activeCompany?.domain_verified !== true){
        replaceUrl('/setup/add');
      }
  
      if(activeCompany?.domain_verified === true){
        replaceUrl('/setup/verify');
      }
    }
  }
}