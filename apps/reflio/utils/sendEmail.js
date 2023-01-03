import { supabaseAdmin } from '@/utils/supabase-admin';
import emailBuilderServer from '@/utils/email-builder-server';
import { priceStringDivided } from '@/utils/helpers';

export const sendEmail = async (subject, content, to, type, companyId, customId) => {
  try {    
    console.log('customId: ',customId);
    const companyFromId = await supabaseAdmin
      .from('companies')
      .select('company_id, company_name, company_image, company_currency')
      .eq('company_id', companyId)
      .single();
      
    if(companyFromId?.data === null){
      console.log('error 1')
      return "error"
    }
  
    let subjectName = subject ?? null;
    let emailContent = content ?? null;
    let recipient = to ?? null;
  
    if(type === "new-commission" || type === "new-commission-affiliate"){
      const commissionFromId = await supabaseAdmin
        .from('commissions')
        .select('id, commission_id, affiliate_id, commission_sale_value, commission_total')
        .eq('commission_id', customId)
        .single();
        
      if(commissionFromId?.data === null){
        return "error"
      }

      const affiliateFromId = await supabaseAdmin
        .from('affiliates')
        .select(`
          *,
          details:invited_user_id (email)
        `)
        .eq('affiliate_id', commissionFromId?.data?.affiliate_id)
        .single();
         
      if(affiliateFromId?.data === null){
        return "error"
      }
      
      if(type === "new-commission-affiliate"){
        subjectName = `${priceStringDivided(commissionFromId?.data?.commission_total, companyFromId?.data?.company_currency)} commission received from ${companyFromId?.data?.company_name}`;
        emailContent = `You have received a new commission of ${priceStringDivided(commissionFromId?.data?.commission_total, companyFromId?.data?.company_currency)} from ${companyFromId?.data?.company_name}.`;  
        recipient = affiliateFromId?.data?.details?.email;
  
      } else {      
        subjectName = `New Reflio Commission Created: #${commissionFromId?.data?.commission_id.substring(1, 5)}`;
        emailContent = `You have received a new sale from affiliate <strong>${affiliateFromId?.data?.details?.email}</strong>, with a total value of ${priceStringDivided(commissionFromId?.data?.commission_sale_value, companyFromId?.data?.company_currency)}.`;
        
        const userFromId = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('id', commissionFromId?.data?.id)
          .single();
  
        if(userFromId?.data === null){
          console.log('error 3')
          console.log(userFromId?.error)
          return "error"
        }
  
        recipient = userFromId?.data?.email;
      } 
    }
  
    const logoUrl = companyFromId?.data?.company_image !== null && companyFromId?.data?.company_image?.length > 0 ? process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL+companyFromId?.data?.company_image : null
  
    const SibApiV3Sdk = require('sib-api-v3-sdk');
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.SIB_API_KEY;
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
    const emailHtml = emailBuilderServer(type, logoUrl, subjectName, emailContent, companyId);
    
    sendSmtpEmail.subject = subjectName;
    sendSmtpEmail.htmlContent = emailHtml;
    sendSmtpEmail.sender = {"name": companyFromId?.data?.company_name, "email":"affiliate@reflio.com"};
    sendSmtpEmail.to = [{"email": recipient}];
    sendSmtpEmail.params = {"parameter":`${type}`,"subject":`${type}`};
    
    await apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
      console.log('running email')
      return "success";
    }, function(error) {
      console.log(error);
      console.log('error 4')
      return "error";
    });
  
    return "success";
  } catch (error) {
    console.log(error);
    console.log("Could not send email")
  }

};