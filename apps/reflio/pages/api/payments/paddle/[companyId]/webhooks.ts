import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from '@/utils/supabase-admin';

export default async function paddleWebhooksHandler(req: NextApiRequest, res: NextApiResponse) {
  const PaddleSDK = require('paddle-sdk');

  try {    
    if (req.method === "POST") {
      const { companyId } = req.query as { companyId: string };
      const webhookType = req.body.alert_name ?? null;

      if(webhookType === null){
        res.status(400).json({ 'message': 'Webhook type not found' });
      }
        
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

      const client = new PaddleSDK(companyFromId?.data?.payment_integration_field_three, companyFromId?.data?.payment_integration_field_two);
  
      return res.status(200).json({ 'message': 'Success' });
  
    } else {
      return res.status(405).json({ 'message': 'Method not allowed'});
    }
  } catch (error) {
    return res.status(400).json({ 'message': error});
  }
}