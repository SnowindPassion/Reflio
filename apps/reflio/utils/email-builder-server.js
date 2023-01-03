import emailBuilderInner from './email-builder-inner';

export default function emailBuilderServer(type, logoUrl, subject, content, companyId) {
  let emailType = 'defaultTemplate';
  const defaultEmail = require(`@/components/emails/${emailType}.js`).default;
  let templateEmail = defaultEmail();
  const jsdom = require("jsdom").JSDOM;
  const parsedDoc = new jsdom(templateEmail);

  return emailBuilderInner(parsedDoc, type, logoUrl, subject, content, companyId);
}