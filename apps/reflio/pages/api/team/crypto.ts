import type { NextApiRequest, NextApiResponse } from "next";
import { encrypt, decrypt } from '@/utils/crypto';

export default async function cryptoCall(req: NextApiRequest, res: NextApiResponse) {

  try {    
    if (req.method === "POST") {
      const { cryptoType, cryptoArray } = req.body as { cryptoType: string, cryptoArray: string[] };

      if(cryptoArray === null || cryptoArray.length === 0){
        return res.status(400).json({ 'message': 'Crypto array not found' });
      }

      if(cryptoType === "encrypt"){
        const encryptedArray = cryptoArray.map((item) => JSON.stringify(encrypt(item)));
        return res.status(200).json({ 'message': 'success', 'data': encryptedArray });

      } else if(cryptoType === "decrypt"){
        const decryptedArray = cryptoArray.map((item) => decrypt(JSON.parse(item)));
        return res.status(200).json({ 'message': 'success', 'data': decryptedArray });

      } else {
        return res.status(400).json({ 'message': 'Crypto type not found' });
      }
  
    } else {
      return res.status(405).json({ 'message': 'Method not allowed'});
    }
  } catch (error) {
    return res.status(400).json({ 'message': error});
  }
}