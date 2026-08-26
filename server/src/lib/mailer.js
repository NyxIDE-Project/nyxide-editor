const {Resend} = require('resend');
const {RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL} = require('../config');

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const emailHtml = ({heading, bodyHtml, buttonText, buttonUrl}) => `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;
  font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%"><tr><td align="center" style="padding:2rem 1rem;">
    <table role="presentation" width="480" style="max-width:100%;background:#ffffff;
      border-radius:12px;overflow:hidden;">
      <tr><td style="background:#111114;padding:2rem;text-align:center;">
        <img src="${FRONTEND_URL}/logo.png" alt="NyxIDE" width="160" style="display:block;margin:0 auto;" />
      </td></tr>
      <tr><td style="padding:2rem;color:#111114;">
        <h1 style="font-size:1.25rem;margin:0 0 1rem;">${heading}</h1>
        <div style="font-size:0.95rem;line-height:1.55;color:#333;">${bodyHtml}</div>
        ${buttonUrl ? `
        <div style="text-align:center;margin:2rem 0 1rem;">
          <a href="${buttonUrl}" style="background:#4cff8e;color:#111114;font-weight:bold;
            text-decoration:none;padding:0.85rem 1.75rem;border-radius:8px;display:inline-block;">
            ${buttonText}
          </a>
        </div>
        <div style="font-size:0.75rem;color:#999;word-break:break-all;">
          If the button doesn't work, paste this link into your browser: ${buttonUrl}
        </div>` : ''}
      </td></tr>
      <tr><td style="padding:0 2rem 2rem;text-align:center;">
        <img src="${FRONTEND_URL}/logo-mini.png" alt="" width="26" style="opacity:0.5;" />
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

const sendMail = async ({to, subject, heading, bodyHtml, buttonText, buttonUrl}) => {
    if (!resend) {
        throw new Error('Email sending is not configured on this server.');
    }
    const {error} = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html: emailHtml({heading, bodyHtml, buttonText, buttonUrl})
    });
    if (error) {
        throw new Error(error.message || 'Resend rejected the email.');
    }
};

module.exports = {sendMail};
