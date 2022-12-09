import { useState } from 'react';
import { useRouter } from 'next/router';
import SetupProgress from '@/components/SetupProgress'; 
import Button from '@/components/Button'; 
import { useUser, continueWithoutProcessor, addPaymentIntegration } from '@/utils/useUser';
import { StripeConnect } from '@/components/Icons/StripeConnect'; 
import { useCompany } from '@/utils/CompanyContext';
import { SEOMeta } from '@/templates/SEOMeta'; 
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';

export default function StripeSetupPage() {
  const router = useRouter();
  const { session } = useUser();
  const { activeCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [altPayment, setAltPayment] = useState(null);
  
  const handleSkipProcessor = async () => {
    if (window.confirm('Are you sure you want to continue without adding Stripe? This means that payments will not be automatically be synced with your Stripe dashboard.')){
      const status = await continueWithoutProcessor(activeCompany?.company_id);

      if(status === "success"){
        router.replace(`/dashboard/${router?.query?.companyId}/setup/currency`)
      } else {
        toast.error("There was an error when trying to continue. Please contact support.");
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if(loading === true){
      return false;
    }
    
    const formData = new FormData(e.target);
    const data = {};
 
    for (let entry of formData.entries()) {
      data[entry[0]] = entry[1];
    }

    setLoading(true);

    await addPaymentIntegration(session, activeCompany?.company_id, altPayment, data).then((result) => {
      if(result === "error"){
        toast.error(`There was an error when trying to add ${altPayment}. Please contact support.`);
        return false;
      }

      router.reload();

      setLoading(false);
    });

  };

  return (
    <>
      <SEOMeta title="Connect Payment Processor"/>
      <div className="py-12 border-b-4 border-gray-300">
        <div className="wrapper">
          <SetupProgress/>
        </div>
      </div>
      <div className="pt-12 mb-6">
        <div className="wrapper">
          <h1 className="text-2xl sm:text-3xl tracking-tight font-extrabold mb-3">Firstly, connect your payment processor</h1>
          {/* <p className="text-base"><strong>NOTE: Reflio does not store any of your private information.</strong> When you receive a successful payment via your payment processor of choice, the payment processor will send us data about that transaction. With that data, we look to see if there is an associated Reflio referral ID in the transaction metadata. If there is, we then calculate the referral commission value based on the paid transaction value.</p> */}
        </div>
      </div>
      <div className="wrapper">
        <div className="rounded-xl bg-white max-w-2xl overflow-hidden shadow-lg border-4 border-gray-300 p-6">
          {
            activeCompany?.payment_integration_type !== null ?
              <div>
                {
                  activeCompany?.payment_integration_type === 'manual' ? 
                    <>
                      <p className="text-lg mb-3">You are not currently using a payment processor.</p>
                    </>
                  : 
                    activeCompany?.payment_integration_type === 'stripe' ? 
                    <>
                      <p className="text-lg mb-3">Your Stripe account is connected to Reflio.</p>
                      <div className="mb-3">
                        <p className="text-xl leading-6 font-semibold text-gray-900">Account name:</p>
                        <p>{activeCompany?.stripe_account_data?.business_profile?.name}</p>
                      </div>
                      <div className="mb-8 pb-8 border-b-4">
                        <p className="text-xl leading-6 font-semibold text-gray-900">Stripe ID:</p>
                        <p>{activeCompany?.stripe_id}</p>
                      </div>
                    </>
                  : activeCompany?.payment_integration_type === 'paddle' &&
                    <>
                      <p className="text-lg mb-3">Your Paddle account is connected to Reflio.</p>
                      {/* <div className="mb-3">
                        <p className="text-lg font-semibold">Paddle Vendor ID:</p>
                        <p>{activeCompany?.payment_integration_field_three}</p>
                      </div> */}
                      <div className="mb-8 pb-8 border-b-4">
                        <p className="text-lg font-semibold mb-1">Your unique Paddle webhook URL:</p>
                        <CopyToClipboard text={`https://reflio.com/api/payments/paddle/${activeCompany?.company_id}/webhooks`} onCopy={() => toast.success('URL copied to clipboard')}>
                          <input 
                            type="text"
                            className="flex w-full cursor-pointer min-w-0 p-3 rounded-xl focus:outline-none sm:text-md border-2 border-gray-300 bg-white"
                            value={`https://reflio.com/api/payments/paddle/${activeCompany?.company_id}/webhooks`}
                          />
                        </CopyToClipboard>
                      </div>
                    </>
                }
                  <Button
                    large
                    primary
                    href={`/dashboard/${router?.query?.companyId}/setup/currency`}
                  >
                    <span>Next Step</span>
                  </Button>
              </div>
            :
              <div>
                <div className="flex items-center space-x-5">
                  <a 
                    href={`https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_CLIENT_ID}&scope=read_write`}
                    target="_blank" rel="noreferrer"
                  >
                    <StripeConnect className="w-60 h-auto"/>
                  </a>
                  <button type="button" onClick={e=>{setAltPayment('paddle')}} className="py-3 px-5 bg-black text-white rounded-md flex items-center">
                    <span className="text-lg font-semibold">Connect with &nbsp;</span>
                    <svg className="w-20 h-auto" viewBox="0 0 1074 333" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 170.94V161.94C11.0242 161.938 21.5962 157.557 29.3915 149.762C37.1868 141.967 41.5673 131.395 41.57 120.37H49.89C49.8794 131.397 54.248 141.977 62.036 149.784C69.824 157.59 80.393 161.984 91.42 162V171C80.396 171.003 69.824 175.384 62.028 183.179C54.233 190.974 49.8526 201.546 49.85 212.57H41.57C41.5753 207.107 40.504 201.696 38.4175 196.647C36.3311 191.598 33.2702 187.009 29.4098 183.143C25.5494 179.277 20.9651 176.21 15.9189 174.116C10.8727 172.022 5.4634 170.943 0 170.94ZM41.57 104.76H113.07C147.99 104.76 172.94 129.7 172.94 166.29C172.94 202.88 148 227.81 113.07 227.81H41.57V332.57H71.5V254.42H113.07C163.29 254.42 202.87 214.84 202.87 166.29C202.87 117.74 163.29 78.15 113.07 78.15H41.57V104.76Z"/>
                      <path d="M310.29 77.82C336.56 77.82 359.84 91.12 374.47 112.08V83.14H404.4V249.43H374.47V220.49C359.47 241.49 336.23 254.75 310.29 254.75C261.06 254.75 219.49 215.84 219.49 166.29C219.49 116.74 261.06 77.82 310.29 77.82ZM310.29 228.14C348.86 228.14 374.47 201.54 374.47 166.29C374.47 130.7 349.2 104.43 310.29 104.43C275.7 104.43 249.42 129.37 249.42 166.29C249.42 203.21 275.7 228.14 310.29 228.14Z"/>
                      <path d="M515.14 77.82C541.42 77.82 564.7 91.12 579.33 112.08V0H609.26V249.43H579.33V220.49C564.7 241.49 541.42 254.75 515.14 254.75C465.92 254.75 424.35 215.84 424.35 166.29C424.35 116.74 465.92 77.82 515.14 77.82ZM515.14 228.14C554.05 228.14 579.33 201.87 579.33 166.29C579.33 130.71 554.05 104.43 515.14 104.43C480.56 104.43 454.28 129.37 454.28 166.29C454.28 203.21 480.56 228.14 515.14 228.14Z"/>
                      <path d="M723.33 77.82C749.6 77.82 772.88 91.12 787.52 112.08V0H817.45V249.43H787.52V220.49C772.88 241.49 749.6 254.75 723.33 254.75C674.11 254.75 632.54 215.84 632.54 166.29C632.54 116.74 674.11 77.82 723.33 77.82ZM723.33 228.14C762.24 228.14 787.52 201.87 787.52 166.29C787.52 130.71 762.24 104.43 723.33 104.43C688.74 104.43 662.47 129.37 662.47 166.29C662.47 203.21 688.74 228.14 723.33 228.14Z"/>
                      <path d="M847.37 249.43V0H877.31V249.43H847.37Z"/>
                      <path d="M988.05 78.15C1045.58 78.15 1073.18 123.05 1073.18 177.93H929.52C934.17 210.18 958.12 231.14 988.05 231.14C1008.67 231.14 1024.63 221.82 1036.6 203.53H1068.86C1057.55 229.14 1027.96 254.42 988.05 254.42C937.83 254.42 898.92 214.17 898.92 166.29C898.92 118.41 937.83 78.15 988.05 78.15ZM1043.25 154.65C1043.25 127.37 1019.97 101.43 988.05 101.43C958.12 101.43 934.17 122.43 929.52 154.65H1043.25Z"/>
                    </svg>
                  </button>
                </div>
                {
                  altPayment !== null &&
                    <form className="mt-7 pt-5 border-t-4 border-dashed" onSubmit={handleSubmit}>
                      {
                        altPayment === 'paddle' &&
                        <>
                          <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2">Step 1. Enter your Paddle credentials:</h3>
                            {/* <p className="text-base">Your credentials are encrypted end-to-end.</p> */}
                            <div className="mt-4 space-y-4">
                              <div>
                                <label htmlFor="payment_integration_field_one" className="block font-semibold">
                                  Paddle Public Key
                                </label>
                                <p className="mb-2">Your Public Key can be retrieved <a className="underline font-bold" href="https://vendors.paddle.com/public-key" target="_blank" rel="noreferrer">here.</a> Make sure to copy the entire key, including the beginning and end sections.</p>
                                <div>
                                  <textarea
                                    required
                                    rows="8"
                                    placeholder={`-----BEGIN PUBLIC KEY----- 
  YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HEREYOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE YOUR KEY HERE
  -----END PUBLIC KEY-----`}
                                    name="payment_integration_field_one"
                                    id="payment_integration_field_one"
                                    className="flex-1 block w-full min-w-0 p-3 rounded-xl focus:outline-none sm:text-md border-2 border-gray-300"
                                  ></textarea>
                                </div>
                              </div>
                              <div>
                                <label htmlFor="payment_integration_field_two" className="block font-semibold">
                                  Paddle API Key
                                </label>
                                <p className="mb-2">Your API Key can be retrieved <a className="underline font-bold" href="https://vendors.paddle.com/authentication" target="_blank" rel="noreferrer">here.</a> You may need to create a new key if one hasn&apos;t already been created.</p>
                                <div>
                                  <input
                                    minLength="2"
                                    required
                                    type="text"
                                    name="payment_integration_field_two"
                                    id="payment_integration_field_two"
                                    placeholder="*************"
                                    className="flex-1 block w-full min-w-0 p-3 rounded-xl focus:outline-none sm:text-md border-2 border-gray-300"
                                  />
                                </div>
                              </div>
                              <div>
                                <label htmlFor="payment_integration_field_three" className="block font-semibold">
                                  Paddle Vendor ID
                                </label>
                                <p className="mb-2">Your Vendor ID can be retrieved <a className="underline font-bold" href="https://vendors.paddle.com/authentication" target="_blank" rel="noreferrer">here</a>, in the section where it says <strong>&ldquo;Your Paddle Vendor ID&ldquo;</strong></p>
                                <div>
                                  <input
                                    minLength="2"
                                    required
                                    type="text"
                                    name="payment_integration_field_three"
                                    id="payment_integration_field_three"
                                    placeholder="*************"
                                    className="flex-1 block w-full min-w-0 p-3 rounded-xl focus:outline-none sm:text-md border-2 border-gray-300"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">Step 2. Setup webhooks in Paddle:</h3>
                            <p className="text-base mb-2">In order for Reflio to work and correctly attribute potential referrals, you need to have webhooks set up.</p>
                            <div className="mb-4">
                              <p className="mb-2">In Paddle, go to <a target="_blank" rel="noreferrer" className="font-bold underline" href="https://vendors.paddle.com/alerts-webhooks">Developer tools &gt; Alerts / Webhooks</a> and make sure the the following events have &ldquo;Webhook&ldquo; turned on:</p>
                              <ul className="list-disc pl-4">
                                <li>Subscription Payment Success</li>
                                <li>Subscription Payment Refunded</li>
                                <li>Payment Success</li>
                                <li>Payment Refunded</li>
                              </ul>
                            </div>
                            <div className="pb-6 border-b-4">
                              <p className="mb-2"><strong>IMPORTANT:</strong> In Paddle, in the <strong>&ldquo;URLs for receiving webhooks&ldquo;</strong> section, add the below URL as a new endpoint. This is your unique Paddle webhook URL.</p>
                              <CopyToClipboard text={`https://reflio.com/api/payments/paddle/${activeCompany?.company_id}/webhooks`} onCopy={() => toast.success('URL copied to clipboard')}>
                                <input 
                                  type="text"
                                  className="flex w-full cursor-pointer min-w-0 p-3 rounded-xl focus:outline-none sm:text-md border-2 border-gray-300 bg-white"
                                  value={`https://reflio.com/api/payments/paddle/${activeCompany?.company_id}/webhooks`}
                                />
                              </CopyToClipboard>
                            </div>
                          </div>
                        </>
                      }
                      <Button
                        className="mt-8"
                        large
                        primary
                      >
                        <span>{loading ? `Connecting to ${altPayment}...` : `Connect to ${altPayment}`}</span>
                      </Button>
                    </form>
                }
              </div>
          }
        </div>
        {
          activeCompany?.payment_integration_type === null &&
          <div className="mt-12">
            <button 
              className="text-gray-500 font-bold underline"
              onClick={e=>{handleSkipProcessor()}}
            >
              Continue without connecting a payment processor
            </button>
          </div>
        }
      </div>
    </>
  );
}