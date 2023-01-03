import { supabaseAdmin } from '@/utils/supabase-admin';
import { monthsBetweenDates, postData } from '@/utils/helpers';
import { sendEmail } from '@/utils/sendEmail';
import { LogSnagPost } from '@/utils/helpers';

export const createPaddleCommission = async(referralId: string, data: any, companyId: string, paddleAuth: string[]) => {
  if(!referralId || !data || !companyId || !paddleAuth) return "param_error";

  let paymentData = data;
  let continueProcess = true;
  let paymentType = data?.alert_name;
  
  //Check if referral is valid in DB
  let referralFromId = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('referral_id', referralId)
    .single();
    
  if(referralFromId?.data === null) return "referral_not_found_error";

  const commissionVariables = calculateCommissionVariables(data, referralFromId, "payment", null);
  
  if(commissionVariables === null) return "commission_variables_error";

  //Check if there is an earlier commission with the same referral ID... if so, check if payment limit has been reached
  let earliestCommission = await supabaseAdmin
    .from('commissions')
    .select('created')
    .eq('referral_id', referralId)
    .order('created', { ascending: true })
    .limit(1)

  if(earliestCommission?.data !== null){
    let commissionFound = earliestCommission?.data[0];
    if(commissionFound?.created){
      let paddleDate = new Date(paymentData?.event_time);
      let earliestCommissionDate = new Date(commissionFound?.created);
      let monthsBetween = monthsBetweenDates(paddleDate, earliestCommissionDate);

      if(referralFromId?.data?.commission_period <= monthsBetween){
        continueProcess = false;
      }
    }
  }
  
  if(continueProcess === true){
    let referralUpdate = await supabaseAdmin
      .from('referrals')
      .update({
        referral_converted: true
      })
      .eq('referral_id', referralId);

    if(!referralUpdate?.error){
      let newCommissionValues = await supabaseAdmin.from('commissions').insert({
        id: referralFromId?.data?.id,
        team_id: referralFromId?.data?.team_id,
        company_id: referralFromId?.data?.company_id,
        campaign_id: referralFromId?.data?.campaign_id,
        affiliate_id: referralFromId?.data?.affiliate_id,
        referral_id: referralFromId?.data?.referral_id,
        payment_intent_id: null,
        commission_sale_value: commissionVariables?.invoice_total,
        commission_total: commissionVariables?.commission_amount,
        commission_due_date: commissionVariables?.due_date_iso,
        commission_description: commissionVariables?.line_item,
        custom_field_one: paymentData?.checkout_id,
        custom_field_two: paymentType === "payment_succeeded" ? paymentData?.order_id : paymentType === "subscription_payment_succeeded" ? paymentData?.subscription_payment_id : null
      }).select();

      if(newCommissionValues?.data && newCommissionValues?.data[0]?.commission_id){
        console.log('Commission was created!')
        const commission = newCommissionValues?.data[0];
        const commissionId = commission?.commission_id;
        await sendEmail(null, null, null, 'new-commission', companyId, commissionId);
        await sendEmail(null, null, null, 'new-commission-affiliate', companyId, commissionId);
        await LogSnagPost('commission-created', `New commission registered for campaign ${referralFromId?.data?.campaign_id}`);
        return "success";
      }
    }
  }

  return "error";
};

//TODO: COMMISSION FROM ORDERID
export const createPaddleCommissionFromOrderId = async(companyId: string, orderId: string, referralId: string) => {
  return "error";
  // if(!companyId || !orderId || !referralId) return "param_error";
  
  // const PaddleSDK = require('paddle-sdk');

  // let companyData = await supabaseAdmin
  //   .from('companies')
  //   .select('payment_integration_type, payment_integration_field_one, payment_integration_field_two, payment_integration_field_three')
  //   .eq('company_id', companyId)
  //   .single();

  // if(companyData?.data === null) return "company_not_found_error";

  // const cryptoCall = await postData({
  //   url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/team/crypto`,
  //   data: { 
  //     cryptoType: "decrypt",
  //     cryptoArray: [companyData?.data?.payment_integration_field_one, companyData?.data?.payment_integration_field_two, companyData?.data?.payment_integration_field_two]
  //   },
  //   token: null
  // });

  // if(cryptoCall?.message !== "success"){
  //   return "payment_keys_error";
  // }

  // const client = new PaddleSDK(cryptoCall?.data[2], cryptoCall?.data[1], cryptoCall?.data[0]);
  // const orderDetails = await client.getOrderTransactions(orderId);
}

export const refundCommission = async(referralId: string, data: any, companyId: string, paddleAuth: string[]) => {
  if(!referralId || !data || !companyId || !paddleAuth) return "param_error";

  let paymentData = data;
  let paymentType = data?.alert_name;
  
  //Check if referral is valid in DB
  let referralFromId = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('referral_id', referralId)
    .single();
    
  if(referralFromId?.data === null) return "referral_not_found_error";

  //Check if there is an earlier commission with the same referral ID... if so, check if payment limit has been reached
  let commissionFromId = supabaseAdmin
    .from('commissions')
    .select('*')
    .eq('referral_id', referralId)
    
  if(paymentType === "payment_refunded"){
    commissionFromId = commissionFromId.eq('custom_field_two', paymentData?.order_id)
  } else if(paymentType === "payment_refunded"){
    commissionFromId = commissionFromId.eq('subscription_payment_refunded', paymentData?.subscription_payment_id)
  }

  let awaitCommissionFromId = await commissionFromId;

  if(awaitCommissionFromId?.data === null) return "commission_not_found_error";

  const foundCommission = awaitCommissionFromId?.data[0];
  const commissionVariables = calculateCommissionVariables(data, referralFromId, "refund", foundCommission);

  if(commissionVariables === null) return "commission_variables_error";

  let commissionUpdate = await supabaseAdmin
    .from('commissions')
    .update({
      commission_sale_value: commissionVariables?.invoice_total,
      commission_total: commissionVariables?.commission_amount,
      commission_refund_value: commissionVariables?.refund_amount
    })
    .eq('commission_id', foundCommission?.commission_id);
    
  if(!commissionUpdate?.error){
    return "success";
  }
  
  return "error";
}

export const calculateCommissionVariables = (paddleData: any, referral: any, eventType: string, commissionData: any) => {
  if(!paddleData || !referral || !eventType) return null;

  let invoiceTotal = null;
  let dueDateIso = null;
  let refundAmount = null;

  if(eventType === "refund"){
    if(commissionData === null) return null;

    //@ts-expect-error
    refundAmount = parseInt(paddleData?.amount * 100);
    //@ts-expect-error
    invoiceTotal = parseInt(commissionData?.commission_sale_value - refundAmount);
    dueDateIso = commissionData?.commission_due_date;

  } else {

    //@ts-expect-error
    invoiceTotal = parseInt(paddleData?.sale_gross * 100);

    let dueDate = new Date();
    if(referral?.data?.minimum_days_payout){
      dueDate.setDate(dueDate.getDate() + referral?.data?.minimum_days_payout);
    } else {
      dueDate.setDate(dueDate.getDate() + 30)
    }
    dueDateIso = dueDate.toISOString();
  }

  //@ts-expect-error
  let commissionAmount = invoiceTotal > 0 ? referral?.data?.commission_type === "fixed" ? referral?.data?.commission_value : (parseInt((((parseFloat(invoiceTotal/100)*parseFloat(referral?.data?.commission_value))/100)*100))) : 0;

  return {
    invoice_total: invoiceTotal,
    commission_amount: commissionAmount,
    refund_amount: refundAmount,
    due_date_iso: dueDateIso,
    line_item: paddleData?.plan_name ? paddleData?.plan_name : paddleData?.product_name ? paddleData?.product_name : null
  }
}