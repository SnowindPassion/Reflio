import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from '@/utils/supabase-admin';
import { postData } from '@/utils/helpers';
import {
  createPaddleCommission,
  refundCommission
} from '@/utils/processor-helpers/paddle/paddle-helpers';

export default async function paddleWebhooksHandler(req: NextApiRequest, res: NextApiResponse) {
  const PaddleSDK = require('paddle-sdk');

  try {    
    if (req.method === "POST") {
      const { companyId } = req.query as { companyId: string };
      const webhookType = req.body.alert_name ?? null;
      let paddleReferral = null;
      let webhookResult = null;

      if(req.body.passthrough !== 'undefined' && req.body.passthrough?.includes('referral')){
        try { 
          console.log('Parsed it')
          paddleReferral = JSON.parse(req.body.passthrough.replace(/`/g, ""));
        } catch (error) {
          console.log("Error:")
          console.log(error)
        }
      }

      if(paddleReferral?.referral){
        paddleReferral = paddleReferral?.referral;
      }

      if(paddleReferral === null){
        console.log("Referral not found");
        return res.status(400).json({ 'message': 'Referral not found'});
      }

      const relevantEvents = new Set([
        'payment_succeeded',
        'payment_refunded',
        'subscription_payment_succeeded',
        'subscription_payment_refunded'
      ]);
        
      const companyFromId = await supabaseAdmin
        .from('companies')
        .select('payment_integration_type, payment_integration_field_one, payment_integration_field_two, payment_integration_field_three')
        .eq('company_id', companyId)
        .single();
        
      if(companyFromId?.data === null){
        return res.status(400).json({ 'message': 'Company not found'});
      }

      if(companyFromId?.data?.payment_integration_type !== 'paddle'){
        return res.status(400).json({ 'message': 'Payment type is not Paddle'});
      }
      
      const cryptoCall = await postData({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/team/crypto`,
        data: { 
          cryptoType: "decrypt",
          cryptoArray: [companyFromId?.data?.payment_integration_field_one, companyFromId?.data?.payment_integration_field_two, companyFromId?.data?.payment_integration_field_two]
        },
        token: null
      });

      if(cryptoCall?.message !== "success"){
        return res.status(400).json({ 'message': 'Payment keys could not be decrypted'});
      }

      const client = new PaddleSDK(cryptoCall?.data[2], cryptoCall?.data[1], cryptoCall?.data[0]);
      const isVerified = client.verifyWebhookData(req.body);

      if(isVerified === false) return res.status(400).json({ 'message': 'Webhook not verified' });

      if (relevantEvents.has(webhookType)) {
        try {
          switch (webhookType) {
            case 'payment_succeeded':
              webhookResult = await createPaddleCommission(paddleReferral, req.body, companyId, cryptoCall?.data);
              break;
            case 'payment_refunded':
              webhookResult = await refundCommission(paddleReferral, req.body, companyId, cryptoCall?.data);
              break;
            case 'subscription_payment_succeeded':
              webhookResult = await createPaddleCommission(paddleReferral, req.body, companyId, cryptoCall?.data);
              break;
            case 'subscription_payment_refunded':
              webhookResult = await refundCommission(paddleReferral, req.body, companyId, cryptoCall?.data);
              break;
            default:
              throw new Error('Unhandled relevant event!');
          }
        } catch (error) {
          return res.status(400).json({ 'message': 'Webhook type not found' });
        }
      }
  
      if(webhookResult === "success"){
        return res.status(200).json({ 'message': 'Success' });
      }

      return res.status(400).json({ 'message': 'Webhook did not finish successfully'});
  
    } else {
      return res.status(405).json({ 'message': 'Method not allowed'});
    }
  } catch (error) {
    console.log("Error:")
    console.log(error)
    return res.status(400).json({ 'message': error});
  }
}