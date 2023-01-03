import type { NextApiRequest, NextApiResponse } from "next";
import { getUser } from '@/utils/supabase-admin';
import { supabaseAdmin } from '@/utils/supabase-admin';

export default async function paddleSetupHandler(req: NextApiRequest, res: NextApiResponse) {
  try {    
    if (req.method === "POST") {
      const { companyId, teamId, companyName, campaignId, affiliates, logoUrl, emailSubject, emailContent } = req.body as { companyId: string, teamId: string, companyName: string, campaignId: string, affiliates: Array<string>, logoUrl: string, emailSubject: string, emailContent: string };

      // const user = await getUser(token);

      // if(user === teamId){
        
      // }

      return res.status(400).json({ 'message': 'error'});
  
    } else {
      return res.status(405).json({ 'message': 'Method not allowed'});
    }
  } catch (error) {
    return res.status(400).json({ 'message': error});
  }
}