export default function emailBuilderInner(parsedDoc, type, logoUrl, subject, content, companyId) {
  if(parsedDoc === null) return false;

  let templateEmail = parsedDoc.serialize(parsedDoc);

  templateEmail = templateEmail.replace(/{{logoUrl}}/g, logoUrl !== null ? logoUrl : 'https://reflio.com/reflio-logo.png');
  templateEmail = templateEmail.replace(/{{subject}}/g, subject);
  templateEmail = templateEmail.replace(/{{content}}/g, content);

  if(type === 'invite'){
    templateEmail = templateEmail.replace(/{{buttonText}}/g, 'Accept Invite');
    templateEmail = templateEmail.replace(/{{buttonURL}}/g, `${process.env.NEXT_PUBLIC_AFFILIATE_SITE_URL}/signup`);
  }
  
  if(type === 'new-commission'){
    templateEmail = templateEmail.replace(/{{buttonText}}/g, 'View Commissions');
    templateEmail = templateEmail.replace(/{{buttonURL}}/g, `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard${companyId}/commissions`);
  }

  if(type === 'new-commission-affiliate'){
    templateEmail = templateEmail.replace(/{{buttonText}}/g, 'View Commissions');
    templateEmail = templateEmail.replace(/{{buttonURL}}/g, `${process.env.NEXT_PUBLIC_AFFILIATE_SITE_URL}/dashboard/commissions`);
  }

  return templateEmail;
}