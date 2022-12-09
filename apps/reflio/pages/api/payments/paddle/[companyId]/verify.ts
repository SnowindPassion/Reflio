import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from '@/utils/supabase-admin';

export default async function paddleSetupHandler(req: NextApiRequest, res: NextApiResponse) {
  const PaddleSDK = require('paddle-sdk');

  try {    
    if (req.method === "POST") {
      const { companyId } = req.query as { companyId: string };
      const { vendorId, apiKey } = req.body as { vendorId: string, apiKey: string };

      if(!vendorId || !apiKey){
        return res.status(400).json({ 'message': 'Vendor ID or API Key not found' });
      }

      const companyFromId = await supabaseAdmin
        .from('companies')
        .select('payment_integration_type, payment_integration_field_one, payment_integration_field_two, payment_integration_field_three')
        .eq('company_id', companyId)
        .single();
        
      if(companyFromId?.data === null){
        return res.status(400).json({ 'message': 'Company not found'});
      }

      const client = new PaddleSDK(vendorId, apiKey);
      const products = await client.getProducts()

      if(products?.total === 0 || products?.products > 0){
        return res.status(200).json({ 'message': 'success' });
      }
      
      return res.status(400).json({ 'message': 'error'});
  
    } else {
      return res.status(405).json({ 'message': 'Method not allowed'});
    }
  } catch (error) {
    return res.status(400).json({ 'message': error});
  }
}